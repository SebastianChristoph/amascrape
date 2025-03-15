import random
import asyncio
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.auth import get_current_user
from app.models import MarketCluster, Market, MarketChange, ProductChange, market_cluster_markets, User
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import delete
from sqlalchemy.exc import IntegrityError

router = APIRouter()

# 📌 MarketCluster Response Schema
class MarketClusterResponse(BaseModel):
    id: int
    title: str
    markets: List[str]
    total_revenue: Optional[float]

    class Config:
        orm_mode = True

class MarketClusterCreate(BaseModel):
    title: str
    keywords: List[str]

class MarketClusterUpdate(BaseModel):
    title: str

# 📌 Asynchrones Update eines Market Cluster-Titels
@router.put("/update/{cluster_id}", response_model=dict)
async def update_market_cluster(
    cluster_id: int,
    cluster_data: MarketClusterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    await asyncio.sleep(0.5)  # ⏳ Simulierte Verzögerung für DB-Operation
    cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    cluster.title = cluster_data.title
    db.commit()

    return {"message": "Market Cluster erfolgreich aktualisiert"}

# 📌 Asynchrones Löschen eines Market Clusters mit `BackgroundTasks`
@router.delete("/delete/{cluster_id}", response_model=dict)
async def delete_market_cluster(
    cluster_id: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    background_tasks.add_task(_delete_market_cluster, cluster_id, db)  # ✅ Hintergrund-Task
    return {"message": "Market Cluster wird im Hintergrund gelöscht"}

async def _delete_market_cluster(cluster_id: int, db: Session):
    await asyncio.sleep(1)  # ⏳ Simulierte Verzögerung
    db.execute(delete(market_cluster_markets).where(
        market_cluster_markets.c.market_cluster_id == cluster_id))
    db.commit()

# 📌 Asynchrone Route: MarketClusters des Users abrufen
@router.get("/", response_model=List[MarketClusterResponse])
async def get_user_market_clusters(
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    await asyncio.sleep(0.5)  # ⏳ Simulierte Verzögerung
    market_clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).all()

    return [
        MarketClusterResponse(
            id=cluster.id,
            title=cluster.title,
            markets=[market.keyword for market in cluster.markets] if cluster.markets else ["Keine Märkte"],
            total_revenue=cluster.total_revenue
        )
        for cluster in market_clusters
    ]

# 📌 Asynchrone Route: Market Cluster Details abrufen
@router.get("/{cluster_id}")
async def get_market_cluster_details(
    cluster_id: int, 
    db: Session = Depends(get_db), 
    current_user=Depends(get_current_user)
):
    await asyncio.sleep(0.5)  # ⏳ Simulierte Verzögerung
    market_cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).first()

    if not market_cluster:
        raise HTTPException(status_code=404, detail="MarketCluster not found")

    response_data = {
        "id": market_cluster.id,
        "title": market_cluster.title,
        "markets": [],
        "total_revenue": market_cluster.total_revenue
    }

    for market in market_cluster.markets:
        latest_market_change = db.query(MarketChange).filter(
            MarketChange.market_id == market.id
        ).order_by(MarketChange.change_date.desc()).first()

        market_data = {
            "id": market.id,
            "keyword": market.keyword,
            "products": []
        }

        if latest_market_change:
            market_data["revenue_total"] = latest_market_change.total_revenue
            market_data["top_suggestions"] = latest_market_change.top_suggestions

            for product in latest_market_change.products:
                latest_product_change = db.query(ProductChange).filter(
                    ProductChange.asin == product.asin
                ).order_by(ProductChange.change_date.desc()).first()

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
                    "sparkline_data": [random.randint(1, 10) for _ in range(9)]  # ✅ Sparkline-Daten generieren
                }

                market_data["products"].append(product_data)

        response_data["markets"].append(market_data)

    return response_data
