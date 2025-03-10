from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.auth import get_current_user
from app.models import MarketCluster, Market, MarketChange, ProductChange, market_cluster_markets, User
from pydantic import BaseModel
from typing import List
from sqlalchemy import delete  # ✅ Richtig importieren!

from sqlalchemy.exc import IntegrityError



router = APIRouter()

# 📌 MarketCluster Response Schema
class MarketClusterResponse(BaseModel):
    id: int
    title: str
    markets: List[str]

class MarketClusterCreate(BaseModel):
    title: str
    keywords: List[str]  # ✅ Mehrere Keywords erlaubt!

# 📌 Request-Body für das Update
class MarketClusterUpdate(BaseModel):
    title: str




@router.post("/create", response_model=dict)
def create_market_cluster(
    cluster_data: MarketClusterCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.main import run_scraping_task_test  # ✅ Import erst hier
    # 📌 Neues Market Cluster erstellen
    new_cluster = MarketCluster(title=cluster_data.title, user_id=current_user.id)
    db.add(new_cluster)
    db.commit()
    db.refresh(new_cluster)

    task_ids = []  # 🔥 Liste für Task-IDs

    print(f"🚀 [Cluster-Erstellung] Neues Cluster '{new_cluster.title}' mit {len(cluster_data.keywords)} Keywords.")

    for keyword in cluster_data.keywords:
        # 🔍 Prüfen, ob Market bereits existiert
        existing_market = db.query(Market).filter(Market.keyword == keyword).first()

        if existing_market:
            print(f"✅ [Bestehender Markt] '{keyword}' existiert bereits. Kein Scraping nötig.")
        else:
            # 📌 Neuen Markt erstellen
            new_market = Market(keyword=keyword)
            db.add(new_market)
            db.commit()
            db.refresh(new_market)
            existing_market = new_market
            print(f"🆕 [Neuer Markt] '{keyword}' wurde angelegt.")

        # 📌 Market mit Cluster verknüpfen (nur falls nicht schon verknüpft)
        db.execute(market_cluster_markets.insert().values(market_id=existing_market.id, market_cluster_id=new_cluster.id))
        db.commit()

        # 📌 Falls Market neu ist, Scraping starten
        if existing_market.id not in task_ids:
            task_id = f"{existing_market.id}-{keyword}"
            task_ids.append(task_id)
            background_tasks.add_task(run_scraping_task_test, keyword, task_id)
            print(f"🚀 [Scraping gestartet] Task {task_id} für '{keyword}'")
        else:
            print(f"⏩ [Kein Scraping] '{keyword}' existiert bereits.")

    return {"message": "Market Cluster erstellt", "id": new_cluster.id, "task_ids": task_ids} 



# 📌 Route zum Aktualisieren eines Market Cluster-Titels
@router.put("/update/{cluster_id}", response_model=dict)
def update_market_cluster(
    cluster_id: int,
    cluster_data: MarketClusterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 🔹 Cluster suchen und prüfen, ob es dem User gehört
    cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    # 🔹 Titel aktualisieren
    cluster.title = cluster_data.title
    db.commit()

    return {"message": "Market Cluster erfolgreich aktualisiert"}

# 📌 Route zum Löschen eines Market Clusters
@router.delete("/delete/{cluster_id}", response_model=dict)
def delete_market_cluster(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # ✅ Prüfen, ob das Market Cluster existiert und dem Nutzer gehört
    cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).first()

    if not cluster:
        raise HTTPException(status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    # ✅ Lösche Verknüpfung in market_cluster_markets
    db.execute(delete(market_cluster_markets).where(market_cluster_markets.c.market_cluster_id == cluster_id))

    # ✅ Lösche das Market Cluster
    db.delete(cluster)
    db.commit()

    return {"message": "Market Cluster erfolgreich gelöscht"}


# 📌 GET: MarketClusters des eingeloggten Users abrufen
@router.get("/", response_model=List[MarketClusterResponse])
def get_user_market_clusters(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    market_clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).all()

    if not market_clusters:
        return []

    return [
        MarketClusterResponse(
            id=cluster.id,
            title=cluster.title,
            markets=[market.keyword for market in cluster.markets] if cluster.markets else ["Keine Märkte"]
        )
        for cluster in market_clusters
    ]

# 📌 GET: Detaillierte Market-Cluster-Informationen mit MarketChanges
@router.get("/{cluster_id}")
def get_market_cluster_details(cluster_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    market_cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id
    ).options(joinedload(MarketCluster.markets)).first()

    if not market_cluster:
        raise HTTPException(status_code=404, detail="MarketCluster not found")

    response_data = {
        "id": market_cluster.id,
        "title": market_cluster.title,
        "markets": []
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
                    "image": latest_product_change.img_path if latest_product_change and latest_product_change.img_path else "no image",
                    "asin": product.asin,
                    "title": latest_product_change.title if latest_product_change else "Unknown",
                    "price": latest_product_change.price if latest_product_change else None,
                    "main_category": latest_product_change.main_category if latest_product_change else "N/A",
                    "main_category_rank": latest_product_change.main_category_rank if latest_product_change else "N/A",
                    "second_category": latest_product_change.second_category if latest_product_change else "N/A",
                    "second_category_rank": latest_product_change.second_category_rank if latest_product_change else "N/A",
                    "total": latest_product_change.total if latest_product_change else "N/A",
                    "blm": latest_product_change.blm if latest_product_change else "N/A"
                }
                market_data["products"].append(product_data)

        response_data["markets"].append(market_data)

    return response_data
