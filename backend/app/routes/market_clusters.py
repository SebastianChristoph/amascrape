import asyncio
import logging
from datetime import datetime, timedelta, timezone
from typing import List, Optional

from app.auth import get_current_user
from app.database import get_db
from app.models import (Market, MarketChange, MarketCluster, Product,
                        ProductChange, User, market_change_products,
                        market_cluster_markets)
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import delete, distinct, func
from sqlalchemy.orm import Session, joinedload

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
        total_revenue = 999.99
        clusters_without_revenue = 0
        total_clusters = len(market_clusters)  # Count total clusters
        
      
        # Get market IDs that belong to user's clusters first
        market_ids = db.query(Market.id).join(
            market_cluster_markets
        ).join(
            MarketCluster
        ).filter(
            MarketCluster.user_id == current_user.id
        ).subquery()

      
        response_data = {
            "total_revenue": float(total_revenue),
            "total_clusters": int(total_clusters),  # Changed from total_markets
            "clusters_without_revenue": int(clusters_without_revenue),
            "total_unique_products": 999
        }

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
        },
        "is_initial_scraped" : market_cluster.is_initial_scraped,
        "cluster_type" : market_cluster.cluster_type
    }

    total_products = 0
    max_market_revenue = 0
    top_market = None
    top_product = {"asin": None, "title": None, "revenue": 0}

    for market in market_cluster.markets:
        latest_market_change = db.query(MarketChange).filter(
            MarketChange.market_id == market.id
        ).order_by(MarketChange.change_date.desc()).first()

        if not latest_market_change.products:
            logging.warning(f"⚠️ Kein ProductChange gefunden für Market {market.keyword} (MarketChange ID: {latest_market_change.id})")

        sparkline_data_total_revenue = get_sparkline_for_market(db=db, id=market.id, field="total_revenue" )
        market_data = {
            "id": market.id,
            "keyword": market.keyword,
            "products": [],
            "sparkline_data_total_revenue" : sparkline_data_total_revenue
        }

        if latest_market_change:
            market_revenue = latest_market_change.total_revenue or 0
            market_data["revenue_total"] = market_revenue
            market_data["top_suggestions"] = latest_market_change.top_suggestions

            if market_revenue > max_market_revenue:
                max_market_revenue = market_revenue
                top_market = market.keyword

            for product in latest_market_change.products:
                total_products += 1
                latest_product_change = db.query(ProductChange).filter(
                    ProductChange.asin == product.asin
                ).order_by(ProductChange.change_date.desc()).first()

                # Generiere Sparkline-Daten für Preis, Main Category Rank und Second Category Rank
                sparkline_price = get_sparkline_for_product(db, product.asin, "price")
                sparkline_main_rank = get_sparkline_for_product(db, product.asin, "main_category_rank")
                sparkline_second_rank = get_sparkline_for_product(db, product.asin, "second_category_rank")
                sparkline_total = get_sparkline_for_product(db, product.asin, "total")
                sparkline_blm = get_sparkline_for_product(db, product.asin, "blm")

                if latest_product_change and latest_product_change.total:
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
                    "sparkline_price": sparkline_price,
                    "sparkline_main_rank": sparkline_main_rank,
                    "sparkline_second_rank": sparkline_second_rank,
                    "sparkline_total": sparkline_total,
                    "sparkline_blm": sparkline_blm,
                }

                market_data["products"].append(product_data)

        response_data["markets"].append(market_data)

    total_revenue = response_data["total_revenue"] or 0
    response_data["insights"].update({
        "total_products": total_products,
        "avg_revenue_per_market": round(total_revenue / len(market_cluster.markets) if len(market_cluster.markets) > 0 else 0, 2),
        "avg_revenue_per_product": round(total_revenue / total_products if total_products > 0 else 0, 2),
        "top_performing_market": top_market,
        "top_performing_product": top_product
    })

    return response_data



def get_sparkline_for_product(db: Session, asin: str, field: str) -> List[int]:
    """Generiert Sparkline-Daten für ein bestimmtes Produktfeld (Preis, Rank, etc.)."""
    
    today = datetime.now(timezone.utc).date()
    cutoff_date = today - timedelta(days=30)

    # Alle ProductChanges für die letzten 30 Tage abrufen (sortiert aufsteigend nach Datum)
    product_changes = (
        db.query(ProductChange)
        .filter(ProductChange.asin == asin)
        .order_by(ProductChange.change_date.asc())
        .all()
    )

    if not product_changes:
        print(f"⚠️ Keine Änderungen für {asin} gefunden!")
        return [0] * 30  

    # ✅ Entferne alle Einträge, wo das Feld `None` ist (erste gültige Werte finden)
    valid_changes = [change for change in product_changes if getattr(change, field, None) is not None]

    if not valid_changes:
        print(f"⚠️ Keine gültigen Werte für {asin}, Feld: {field}!")
        return [0] * 30  

    # Erstes gültiges Datum und Wert als Startpunkt finden
    first_valid_change = valid_changes[0]
    first_valid_date = first_valid_change.change_date.date()
    first_valid_value = getattr(first_valid_change, field)

    # 🗓️ Bestimmen des Startdatums:
    if first_valid_date > cutoff_date:
        # Falls das erste Produkt innerhalb der letzten 30 Tage liegt, nutze es als Start
        start_date = first_valid_date
    else:
        # Falls es älter ist, beginne ab cutoff_date (30 Tage zurück)
        start_date = cutoff_date

    # Erstelle eine Liste aller Tage vom `start_date` bis heute
    date_list = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range((today - start_date).days + 1)]
 
   
    # Mapping von Datum zu Feldwert aus den gespeicherten Änderungen
    changes_dict = {change.change_date.strftime("%Y-%m-%d"): getattr(change, field) for change in valid_changes}

    filled_data = []
    last_value = first_valid_value  # Starte mit dem ersten bekannten Wert

    # 🔄 Sparkline-Daten generieren (letzten bekannten Wert nutzen, falls keiner existiert)
    for date in date_list:
        if date in changes_dict:
            last_value = changes_dict[date]
        filled_data.append(int(last_value) if last_value is not None else 0)


    if len(filled_data) == 1:
        filled_data.append(filled_data[0])
    
    return filled_data


def get_sparkline_for_market(db: Session, id: int, field: str) -> List[int]:
    """Generiert Sparkline-Daten für ein bestimmtes Produktfeld (Preis, Rank, etc.)."""
    
    today = datetime.now(timezone.utc).date()
    cutoff_date = today - timedelta(days=30)

    # Alle ProductChanges für die letzten 30 Tage abrufen (sortiert aufsteigend nach Datum)
    market_changes = (
        db.query(MarketChange)
        .filter(MarketChange.market_id == id)
        .order_by(MarketChange.change_date.asc())
        .all()
    )

    if not market_changes:
        print(f"⚠️ Keine Änderungen für {id} gefunden!")
        return [0] * 30  

    valid_changes = [change for change in market_changes if getattr(change, field, None) is not None]

    if not valid_changes:
        #print(f"⚠️ Keine gültigen Werte für {id}, Feld: {field}!")
        return [0] * 30  

    # Erstes gültiges Datum und Wert als Startpunkt finden
    first_valid_change = valid_changes[0]
    first_valid_date = first_valid_change.change_date.date()
    first_valid_value = getattr(first_valid_change, field)

    # print(f"✅ Erstes gültiges Datum für {id}, Feld {field}: {first_valid_date} mit Wert {first_valid_value}")



    # 🗓️ Bestimmen des Startdatums:
    if first_valid_date > cutoff_date:
        # Falls das erste Produkt innerhalb der letzten 30 Tage liegt, nutze es als Start
        start_date = first_valid_date
    else:
        # Falls es älter ist, beginne ab cutoff_date (30 Tage zurück)
        start_date = cutoff_date

    # Erstelle eine Liste aller Tage vom `start_date` bis heute
    date_list = [(start_date + timedelta(days=i)).strftime("%Y-%m-%d") for i in range((today - start_date).days + 1)]
 
   
    # Mapping von Datum zu Feldwert aus den gespeicherten Änderungen
    changes_dict = {change.change_date.strftime("%Y-%m-%d"): getattr(change, field) for change in valid_changes}

    filled_data = []
    last_value = first_valid_value  # Starte mit dem ersten bekannten Wert

    # 🔄 Sparkline-Daten generieren (letzten bekannten Wert nutzen, falls keiner existiert)
    for date in date_list:
        if date in changes_dict:
            last_value = changes_dict[date]
        filled_data.append(int(last_value) if last_value is not None else 0)

   
    if len(filled_data) == 1:
        filled_data.append(filled_data[0])

    return filled_data




