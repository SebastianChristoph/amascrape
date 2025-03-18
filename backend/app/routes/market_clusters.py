import asyncio
import logging
from typing import List, Optional
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, func, distinct
from sqlalchemy.orm import Session, joinedload

from app.auth import get_current_user
from app.database import get_db
from app.models import MarketCluster, MarketChange, ProductChange, User, market_cluster_markets, Market, Product, market_change_products

router = APIRouter()

# 📌 MarketCluster Response Schema
class MarketClusterResponse(BaseModel):
    id: int
    title: str
    markets: List[str]
    total_revenue: Optional[float]

    class Config:
        from_attributes = True  # ✅ Neuer Name in Pydantic 2


class MarketClusterCreate(BaseModel):
    title: str
    keywords: List[str]


class MarketClusterUpdate(BaseModel):
    title: str


class DashboardOverviewResponse(BaseModel):
    total_revenue: Optional[float] = 0.0
    total_clusters: Optional[int] = 0
    clusters_without_revenue: Optional[int] = 0
    total_unique_products: Optional[int] = 0
    revenue_development: Optional[List[int]] = []

    class Config:
        from_attributes = True


#  Market Cluster Titel aktualisieren
@router.put("/update/{cluster_id}", response_model=dict)
async def update_market_cluster(
    cluster_id: int,
    cluster_data: MarketClusterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id,
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    cluster.title = cluster_data.title
    db.commit()

    return {"message": "Market Cluster erfolgreich aktualisiert"}

# 📌 Market Cluster synchron löschen
@router.delete("/delete/{cluster_id}", response_model=dict)
async def delete_market_cluster(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id,
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    try:
        # 🔥 Löscht Verknüpfungen in der Zwischentabelle
        db.execute(delete(market_cluster_markets).where(
            market_cluster_markets.c.market_cluster_id == cluster_id
        ))
        db.commit()

        # 🔥 Löscht das eigentliche MarketCluster
        db.delete(cluster)
        db.commit()

        logging.info(f"✅ Market Cluster {cluster_id} wurde gelöscht.")
        return {"message": "Market Cluster erfolgreich gelöscht"}

    except Exception as e:
        db.rollback()
        logging.error(f"❌ Fehler beim Löschen des Market Clusters {cluster_id}: {e}")
        raise HTTPException(status_code=500, detail="Interner Serverfehler beim Löschen")

# 📌 Market Cluster des Users abrufen
@router.get("/", response_model=List[MarketClusterResponse])
async def get_user_market_clusters(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    market_clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).all()

    return [
        MarketClusterResponse(
            id=cluster.id,
            title=cluster.title,
            markets=[market.keyword for market in cluster.markets] if cluster.markets else ["Keine Märkte"],
            total_revenue=cluster.total_revenue,
        )
        for cluster in market_clusters
    ]

# Move this endpoint before the /{cluster_id} endpoint to prevent path conflicts
@router.get("/dashboard-overview")  # Remove response_model temporarily for debugging
async def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """Get overview data for the dashboard including total revenue and statistics."""
    try:
        # Get all market clusters for the user with their markets
        market_clusters = db.query(MarketCluster).filter(
            MarketCluster.user_id == current_user.id
        ).options(joinedload(MarketCluster.markets)).all()
        
        
        
        # Calculate total revenue (from clusters with revenue > 0)
        total_revenue = 0.0
        clusters_without_revenue = 0
        total_clusters = len(market_clusters)  # Count total clusters
        
        for cluster in market_clusters:
            if cluster.total_revenue:
                total_revenue += float(cluster.total_revenue)
            else:
                clusters_without_revenue += 1
        
      
        
        # Get market IDs that belong to user's clusters first
        market_ids = db.query(Market.id).join(
            market_cluster_markets
        ).join(
            MarketCluster
        ).filter(
            MarketCluster.user_id == current_user.id
        ).subquery()

        # Then get unique products from these markets
        unique_products_count = db.query(func.count(distinct(ProductChange.asin))).join(
            MarketChange, MarketChange.market_id.in_(market_ids)
        ).filter(
            ProductChange.total.isnot(None)  # Only count products that have been scraped
        ).scalar() or 0
        
      
        
        # Simplified revenue development data for debugging
        revenue_data = [int(total_revenue)] * 30  # Just use current total revenue for all 30 days
        
        response_data = {
            "total_revenue": float(total_revenue),
            "total_clusters": int(total_clusters),  # Changed from total_markets
            "clusters_without_revenue": int(clusters_without_revenue),
            "total_unique_products": int(unique_products_count),
            "revenue_development": revenue_data
        }
        
        # print(f"Response data: {response_data}")
        return response_data
        
    except Exception as e:
        print(f"Error in dashboard overview: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

# 📌 Market Cluster Details abrufen
@router.get("/{cluster_id}")
async def get_market_cluster_details(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    market_cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id,
    ).options(joinedload(MarketCluster.markets)).first()

    if not market_cluster:
        raise HTTPException(status_code=404, detail="MarketCluster nicht gefunden")

    response_data = {
        "id": market_cluster.id,
        "title": market_cluster.title,
        "markets": [],
        "total_revenue": market_cluster.total_revenue,
        "insights": {
            "total_revenue": market_cluster.total_revenue,
            "total_markets": len(market_cluster.markets),
            "total_products": 0,
            "avg_revenue_per_market": 0,
            "avg_revenue_per_product": 0,
            "top_performing_market": None,
            "top_performing_product": None
        }
    }

    total_products = 0
    max_market_revenue = 0
    top_market = None
    top_product = {"asin": None, "title": None, "revenue": 0}

    for market in market_cluster.markets:
        latest_market_change = db.query(MarketChange).filter(
            MarketChange.market_id == market.id
        ).order_by(MarketChange.change_date.desc()).first()

        market_data = {
            "id": market.id,
            "keyword": market.keyword,
            "products": [],
        }

        if latest_market_change:
            market_revenue = latest_market_change.total_revenue or 0
            market_data["revenue_total"] = market_revenue
            market_data["top_suggestions"] = latest_market_change.top_suggestions

            # Track top performing market
            if market_revenue > max_market_revenue:
                max_market_revenue = market_revenue
                top_market = market.keyword

            for product in latest_market_change.products:
                total_products += 1
                latest_product_change = db.query(ProductChange).filter(
                    ProductChange.asin == product.asin
                ).order_by(ProductChange.change_date.desc()).first()

                if latest_product_change and latest_product_change.total:
                    # Track top performing product
                    if latest_product_change.total > top_product["revenue"]:
                        top_product = {
                            "asin": product.asin,
                            "title": latest_product_change.title,
                            "revenue": latest_product_change.total
                        }

                product_data = {
                    "image": latest_product_change.img_path if latest_product_change and latest_product_change.img_path else None,
                    "asin": product.asin,
                    "title": latest_product_change.title if latest_product_change and latest_product_change.title else None,
                    "price": latest_product_change.price if latest_product_change else None,
                    "main_category": latest_product_change.main_category if latest_product_change and latest_product_change.main_category else None,
                    "main_category_rank": latest_product_change.main_category_rank if latest_product_change else None,
                    "second_category": latest_product_change.second_category if latest_product_change and latest_product_change.second_category else None,
                    "second_category_rank": latest_product_change.second_category_rank if latest_product_change else None,
                    "total": latest_product_change.total if latest_product_change else None,
                    "blm": latest_product_change.blm if latest_product_change else None,
                }

                market_data["products"].append(product_data)

        response_data["markets"].append(market_data)

    # Calculate final insights
    total_revenue = response_data["total_revenue"] or 0
    response_data["insights"].update({
        "total_products": total_products,
        "avg_revenue_per_market": round(total_revenue / len(market_cluster.markets) if len(market_cluster.markets) > 0 else 0, 2),
        "avg_revenue_per_product": round(total_revenue / total_products if total_products > 0 else 0, 2),
        "top_performing_market": top_market,
        "top_performing_product": top_product
    })

    return response_data
