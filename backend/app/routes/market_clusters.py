import logging
import random
from datetime import datetime, timezone
from typing import List, Optional

import scraper.selenium_config as selenium_config
from app.auth import get_current_user
from app.database import SessionLocal, get_db
from app.models import (Market, MarketChange, MarketCluster, Product,
                        ProductChange, User, market_change_products,
                        market_cluster_markets, market_products)
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from pydantic import BaseModel
# Importiere deinen Scraper
from scraper.product_selenium_scraper import AmazonProductScraper
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from sqlalchemy import delete, distinct, func
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timedelta

from app.models import ProductChange
from sqlalchemy.orm import Session
router = APIRouter()


class MarketClusterResponse(BaseModel):
    id: int
    title: str
    markets: List[str]
    total_revenue: Optional[float]
    is_initial_scraped: bool
    cluster_type: str

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

class AddAsinRequest(BaseModel):
    asin: str
    market_id: int

@router.post("/add-asin")
async def add_individual_asin_to_market(
    request: AddAsinRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    asin = request.asin.strip().upper()
    market_id = request.market_id

    market = db.query(Market).filter(Market.id == market_id).first()
    if not market:
        raise HTTPException(status_code=404, detail="Market not found")

    def run_scraper_and_insert():
      # Falls nicht vorhanden, importieren
        db_in_task = SessionLocal()

        try:
            # Scraper Teil (wie gehabt)
            options = Options()
            options.add_argument("--headless=new")
            options.add_argument("--disable-gpu")
            options.add_argument("--window-size=1920,1080")
            options.add_argument(f"user-agent={selenium_config.user_agent}")

            driver = webdriver.Chrome(options=options)
            scraper = AmazonProductScraper(driver, show_details=True)
            driver.get("https://www.amazon.com")
            for cookie in selenium_config.cookies:
                driver.add_cookie(cookie)

            product_data = scraper.get_product_infos(asin)
            driver.quit()

            if not product_data:
                raise Exception("Scraper returned no data")

            # 💡 Session-internal neu laden
            market_in_task = db_in_task.query(Market).filter(Market.id == market_id).first()
            if not market_in_task:
                raise Exception("Market not found (in task)")

            # Product
            product = db_in_task.query(Product).filter(Product.asin == asin).first()
            if not product:
                product = Product(
                    asin=asin,
                    last_time_scraped=datetime.now(timezone.utc)
                )
                db_in_task.add(product)
                db_in_task.commit()
                db_in_task.refresh(product)
            else:
                product.last_time_scraped = datetime.now(timezone.utc)
                db_in_task.commit()


            # Verknüpfen mit Market
            if product not in market_in_task.products:
                market_in_task.products.append(product)

            # ProductChange
            new_product_change = ProductChange(
                asin=asin,
                title=product_data.get("title"),
                price=product_data.get("price"),
                main_category=product_data.get("main_category"),
                second_category=product_data.get("second_category"),
                main_category_rank=product_data.get("main_category_rank"),
                second_category_rank=product_data.get("second_category_rank"),
                img_path=product_data.get("image_url"),
                change_date=datetime.now(timezone.utc),
                changes="Added via individual ASIN input",
                blm=product_data.get("blm"),
                total=product_data.get("total"),
                store=product_data.get("store"),
                manufacturer=product_data.get("manufacturer"),
            )

            db_in_task.add(new_product_change)
            db_in_task.commit()
            db_in_task.refresh(new_product_change)

          # Produkt an den letzten MarketChange anhängen
            latest_market_change = db_in_task.query(MarketChange).filter(
                MarketChange.market_id == market_in_task.id
            ).order_by(MarketChange.change_date.desc()).first()

            if latest_market_change:
                # Verknüpfung prüfen
                if product not in latest_market_change.products:
                    latest_market_change.products.append(product)
                    db_in_task.commit()
                    logging.info(f"✅ ASIN {asin} mit MarketChange {latest_market_change.id} verknüpft.")
                else:
                    logging.info(f"ℹ️ ASIN {asin} war bereits mit MarketChange {latest_market_change.id} verknüpft.")


            db_in_task.commit()
            print(f"✅ ASIN {asin} erfolgreich hinzugefügt zu Market {market_id}")

        except Exception as e:
            logging.error(f"❌ Fehler beim Hinzufügen von ASIN {asin}: {e}")
            db_in_task.rollback()

        finally:
            db_in_task.close()

    background_tasks.add_task(run_scraper_and_insert)

    return {"message": f"ASIN {asin} wird hinzugefügt und gescraped..."}

## UPDATE CLUSTER
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
        raise HTTPException(
            status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    cluster.title = cluster_data.title
    db.commit()

    return {"message": "Market Cluster erfolgreich aktualisiert"}

## DELETE CLUSTER
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
        raise HTTPException(
            status_code=404, detail="Market Cluster nicht gefunden oder nicht autorisiert")

    try:
        db.execute(delete(market_cluster_markets).where(
            market_cluster_markets.c.market_cluster_id == cluster_id
        ))
        db.commit()
        db.delete(cluster)
        db.commit()

        logging.info(f"✅ Market Cluster {cluster_id} deleted.")
        return {"message": "Market Cluster successfully deletedt"}

    except Exception as e:
        db.rollback()
        logging.error(
            f"❌ Error deleting {cluster_id}: {e}")
        raise HTTPException(
            status_code=500, detail="Internal Server Error whily Deleting Cluster")

# GET CLUSTERS FOR USER
@router.get("/", response_model=List[MarketClusterResponse])
async def get_user_market_clusters(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    market_clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id,
        MarketCluster.is_initial_scraped == True
    ).options(joinedload(MarketCluster.markets)).all()

    return [
        MarketClusterResponse(
            id=cluster.id,
            title=cluster.title,
            markets=[market.keyword for market in cluster.markets] if cluster.markets else [
                "Keine Märkte"],
            total_revenue=cluster.total_revenue,
            is_initial_scraped=cluster.is_initial_scraped,
            cluster_type = cluster.cluster_type
        )
        for cluster in market_clusters
    ]

## GET DASHBOARD INSIGHT DATA
@router.get("/dashboard-overview")
async def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    try:
        market_clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id,
        MarketCluster.is_initial_scraped == True
        ).options(joinedload(MarketCluster.markets)).all()

        # DDD1
        total_revenue = -1
    
        # DDD2
        total_clusters = len(market_clusters)

        # DDD3
        total_markets = len({
            market.id
            for cluster in market_clusters
            for market in cluster.markets
        })

        ### DDD4
        market_ids_subquery = db.query(Market.id).join(
            market_cluster_markets
        ).join(
            MarketCluster
        ).filter(
            MarketCluster.user_id == current_user.id
        ).subquery()


        total_products = db.query(func.count(distinct(Product.asin))).join(
            market_products, Product.asin == market_products.c.asin
        ).filter(
            market_products.c.market_id.in_(market_ids_subquery)
        ).scalar()

        response_data = {
            "total_revenue": float(total_revenue),
            "total_clusters": int(total_clusters),
            "total_markets": int(total_markets), 
            "total_unique_products": total_products
        }

        return response_data

    except Exception as e:
        print(f"Error in dashboard overview: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Internal server error: {str(e)}")


## GET MARKET CLUSTER DETAILS
@router.get("/{cluster_id}")
async def get_market_cluster_details(
    cluster_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    market_cluster = db.query(MarketCluster).filter(
        MarketCluster.id == cluster_id,
        MarketCluster.user_id == current_user.id,
        MarketCluster.is_initial_scraped == True
    ).options(joinedload(MarketCluster.markets)).first()

    if not market_cluster:
        raise HTTPException(
            status_code=404, detail="MarketCluster nicht gefunden")

    
    #CD 1
    response_data = {
        "id": market_cluster.id,
        "title": market_cluster.title,
        "markets": [],
        "insights": {
            "total_revenue": -1,
            "total_markets": len(market_cluster.markets),
            "total_products": 0,
            "avg_revenue_per_market": 0,
            "avg_revenue_per_product": 0,
            "top_performing_market": None,
            "top_performing_product": None
        },
        "is_initial_scraped": market_cluster.is_initial_scraped,
        "cluster_type": market_cluster.cluster_type
    }

    total_products = []
    max_market_revenue = 0
    top_market = None
    top_product = {"asin": None, "title": None, "revenue": 0}

    for market in market_cluster.markets:
        latest_market_change = db.query(MarketChange).filter(
            MarketChange.market_id == market.id
        ).order_by(MarketChange.change_date.desc()).first()

        if not latest_market_change:
            continue

        # if not latest_market_change.products:
        #     logging.warning(
        #         f"⚠️ Kein ProductChange gefunden für Market {market.keyword} (MarketChange ID: {latest_market_change.id})")

        market_data = {
            "id": market.id,
            "keyword": market.keyword,
            "products": [],
        }

        # DDM1
        market_revenue = -1
        market_data["revenue_total"] = market_revenue
        market_data["top_suggestions"] = latest_market_change.top_suggestions

        if market_revenue > max_market_revenue:
            max_market_revenue = market_revenue
            top_market = market.keyword

        # Neue Query: Nur Produkte mit gültigem Scrape
        products_with_scrape = (
            db.query(Product)
            .join(market_change_products)
            .filter(
                market_change_products.c.market_change_id == latest_market_change.id,
                Product.last_time_scraped.isnot(None)
            )
            .all()
        )

        for product in products_with_scrape:
            if not product.asin in total_products:
                total_products.append(product.asin)

            latest_product_change = db.query(ProductChange).filter(
                ProductChange.asin == product.asin
            ).order_by(ProductChange.change_date.desc()).first()

         

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
                "store": latest_product_change.store if latest_product_change else None,
                "manufacturer": latest_product_change.manufacturer if latest_product_change else None,
                "review_count": latest_product_change.review_count if latest_product_change else None,
                "rating": latest_product_change.rating if latest_product_change else None,
                "sparkline_data_price": get_sparkline_data_for_field(product, "price", db),
                "sparkline_data_main_category_rank": get_sparkline_data_for_field(product, "main_category_rank", db),
                "sparkline_data_second_category_rank": get_sparkline_data_for_field(product, "second_category_rank", db),
                 "sparkline_data_rating": get_sparkline_data_for_field(product, "rating", db),
                  "sparkline_data_review_count": get_sparkline_data_for_field(product, "review_count", db),
                "sparkline_data_blm": get_sparkline_data_for_field(product, "blm", db),
                "sparkline_data_total": get_sparkline_data_for_field(product, "total", db),
            }

            market_data["products"].append(product_data)
        # DDM2
        market_data["products_in_market_count"] = len(product_data)
        # DDM3
        market_data["avg_blm"] = -1
        response_data["markets"].append(market_data)


    # CD1
    # has to be implemented
    market_cluster_total_revenue = -1
    response_data["insights"].update({
        "total_products": len(total_products),
        "total_revenue": market_cluster_total_revenue,
        "avg_revenue_per_market": round(market_cluster_total_revenue / len(market_cluster.markets) if len(market_cluster.markets) > 0 else 0, 2),
        "avg_revenue_per_product": round(market_cluster_total_revenue / len(total_products) if len(total_products) > 0 else 0, 2),
        "top_performing_market": top_market,
        "top_performing_product": top_product
    })

    return response_data




def get_sparkline_data_for_field(product, field: str, db: Session):
    # Hole alle ProductChanges für das gegebene Produkt und das gewünschte Feld
    product_changes = (
        db.query(ProductChange)
        .filter(ProductChange.asin == product.asin)
        .order_by(ProductChange.change_date)
        .all()
    )

    if not product_changes:
        return []

    # Heutiges Datum (nur Datumsteil)
    today = datetime.now().date()

    # Erster Change-Zeitpunkt
    first_change_date = product_changes[0].change_date.date()
    
    # Anzahl der Tage seit dem ersten Change bis gestern
    days_since_first = (today - first_change_date).days
    num_days = min(days_since_first, 30)

    if num_days <= 0:
        return []

    # Liste mit Platzhaltern
    sparkline_data = [None] * num_days
    date_list = [first_change_date + timedelta(days=i) for i in range(num_days)]

    # Pointer für aktuellen gültigen Wert
    last_valid_value = None
    change_index = 0

    for i, date in enumerate(date_list):
        # Suche alle Changes bis einschließlich diesem Tag
        while change_index < len(product_changes) and product_changes[change_index].change_date.date() <= date:
            value = getattr(product_changes[change_index], field)
            if value is not None:
                last_valid_value = value
            change_index += 1

        sparkline_data[i] = last_valid_value

    return sparkline_data

# def get_sparkline_data_for_field(product, field: str, db: Session):
#     # Hole alle ProductChanges für das gegebene Produkt und das gewünschte Feld
#     product_changes = db.query(ProductChange).filter(ProductChange.asin == product.asin).order_by(ProductChange.change_date).all()

#     if not product_changes:
#         return []

#     # Bestimme das heutige Datum
#     today = datetime.now()

#     # Initialisiere die Liste für die letzten 30 Tage
#     sparkline_data = [None] * 30  # 30 Tage, initial mit None

#     # Bestimme die letzten 30 Tage
#     last_30_days = [today - timedelta(days=i) for i in range(30)]

#     # Funktion zum Füllen der Lücken in den Daten
#     def fill_data_for_day(day, value):
#         index = (today - day).days
#         if 0 <= index < 30:
#             sparkline_data[index] = value

#     # Variable für den letzten gültigen Wert
#     last_valid_value = None

#     # Durchlaufe alle ProductChanges und fülle die Daten
#     for change in product_changes:
#         field_value = getattr(change, field)

#         # Überspringe null-Werte
#         if field_value is None:
#             continue

#         # Wenn der Wert gültig ist, setze den letzten gültigen Wert
#         last_valid_value = field_value

#         # Fülle für alle Tage von dem Change-Datum bis heute
#         days_diff = (today - change.change_date).days
#         if days_diff < 30:
#             # Fülle alle Tage, die zwischen diesem Change und heute liegen
#             for i in range(days_diff + 1):
#                 fill_data_for_day(today - timedelta(days=i), field_value)

#     # Wenn es immer noch null-Werte gibt, fülle sie mit dem letzten gültigen Wert
#     for i in range(30):
#         if sparkline_data[i] is None and last_valid_value is not None:
#             sparkline_data[i] = last_valid_value

#     # Falls das Produkt weniger als 30 Tage existiert, fülle die Anfangstage mit dem ersten validen Wert
#     if len(product_changes) > 0 and sparkline_data[0] is None and last_valid_value is not None:
#         first_valid_change = next((change for change in product_changes if getattr(change, field) is not None), None)
#         if first_valid_change:
#             first_valid_value = getattr(first_valid_change, field)
#             for i in range(30):
#                 if sparkline_data[i] is None:
#                     sparkline_data[i] = first_valid_value

#     return sparkline_data

