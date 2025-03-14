import asyncio
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_user
from app.models import Market, MarketChange, MarketCluster, Product, ProductChange, User
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timezone
from concurrent.futures import ThreadPoolExecutor
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper

router = APIRouter()
executor = ThreadPoolExecutor()

class NewClusterData(BaseModel):
    keywords: List[str]
    clusterName: Optional[str] = None

scraping_processes: Dict[int, Dict[str, Dict[str, Dict[str, any]]]] = {}

@router.post("/api/start-firstpage-scraping-process")
async def post_scraping(
    newClusterData: NewClusterData, 
    db: Session = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    """Startet den Scraping-Prozess für einen Nutzer"""
    user_id = current_user.id
    cluster_name = newClusterData.clusterName
    print(f"🔥 Start Scraping für Nutzer {user_id}, Cluster: {cluster_name}")

    scraping_processes[user_id] = {}
    scraping_processes[user_id][cluster_name] = {"status": "processing", "keywords": {}}

    for keyword in newClusterData.keywords:
        market_exists = db.query(Market).filter(Market.keyword == keyword).first()

        if market_exists:
            print(f"✅ Market '{keyword}' existiert bereits.")
            scraping_processes[user_id][cluster_name]["keywords"][keyword] = {"status": "done", "data": {}}
        else:
            print(f"🔍 Scraping für neues Keyword: {keyword}")
            scraping_processes[user_id][cluster_name]["keywords"][keyword] = {"status": "processing", "data": {}}
            asyncio.create_task(scraping_process(keyword, cluster_name, user_id))  

    return {"success": True, "message": f"Scraping für {cluster_name} gestartet"}

@router.get("/api/get-loading-clusters")
async def get_loading_clusters(
    current_user: User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    """Gibt den Status der laufenden Scraping-Prozesse zurück"""
    user_id = current_user.id
    if user_id not in scraping_processes or not scraping_processes[user_id]:
        return {"active_clusters": []}

    clustername, cluster_data = next(iter(scraping_processes[user_id].items()))
    
    # ✅ Prüfen, ob Fehler vorliegen
    has_errors = any(data["status"] == "error" for data in cluster_data["keywords"].values())

    if has_errors:
        cluster_data["status"] = "error"
        active_cluster = {
            "clustername": clustername,
            "status": "error",
            "keywords": {kw: data["status"] for kw, data in cluster_data["keywords"].items()}
        }
        scraping_processes[user_id] = {}  # Reset Scraping-Prozess
        return active_cluster

    # ✅ Prüfen, ob alle Keywords fertig sind
    all_done = all(status["status"] == "done" for status in cluster_data["keywords"].values())

    if all_done:
        scraping_processes[user_id][clustername]["status"] = "done"
        print(f"✅ Alle Keywords für '{clustername}' fertig! -> Datenbank schreiben")

        existing_cluster = db.query(MarketCluster).filter(
            MarketCluster.title == clustername, MarketCluster.user_id == user_id
        ).first()

        if not existing_cluster:
            new_cluster = MarketCluster(title=clustername, user_id=user_id)
            db.add(new_cluster)

            for keyword, keyword_data in scraping_processes[user_id][clustername]["keywords"].items():
                existing_market = db.query(Market).filter(Market.keyword == keyword).first()

                if existing_market:
                    new_cluster.markets.append(existing_market)
                    continue  

                new_market = Market(keyword=keyword)
                db.add(new_market)
                db.commit()
                db.refresh(new_market)
                new_cluster.markets.append(new_market)

                product_data_list = keyword_data["data"].get("first_page_products", [])
                top_suggestions = keyword_data["data"].get("top_search_suggestions", [])

                new_market_change = MarketChange(
                    market_id=new_market.id,
                    change_date=datetime.now(timezone.utc),
                    new_products=",".join([p["asin"] for p in product_data_list]) if product_data_list else "",
                )
                new_market_change.set_top_suggestions(top_suggestions)
                db.add(new_market_change)

                for product_data in product_data_list:
                    existing_product = db.query(Product).filter(Product.asin == product_data["asin"]).first()

                    if not existing_product:
                        new_product = Product(asin=product_data["asin"])
                        db.add(new_product)
                        db.commit()
                        db.refresh(new_product)

                        new_market.products.append(new_product)
                        new_market_change.products.append(new_product)

                        new_product_change = ProductChange(
                            asin=new_product.asin,
                            title=product_data.get("title"),
                            price=product_data.get("price"),
                            main_category=product_data.get("main_category"),
                            second_category=product_data.get("second_category"),
                            main_category_rank=product_data.get("main_category_rank"),
                            second_category_rank=product_data.get("second_category_rank"),
                            img_path=product_data.get("image"),
                            change_date=datetime.now(timezone.utc),
                            changes="Initial creation",
                        )
                        db.add(new_product_change)
                        db.commit()
                        db.refresh(new_product_change)

                        new_product.product_changes.append(new_product_change)

            db.commit()
            db.refresh(new_cluster)

        del scraping_processes[user_id]
        return {"active_clusters": []}
    
    return {
        "clustername": clustername,
        "status": cluster_data["status"],
        "keywords": {kw: data["status"] for kw, data in cluster_data["keywords"].items()}
    }

async def scraping_process(keyword: str, clustername: str, user_id: int):
    """Führt das Scraping für ein Keyword durch"""
    print(f"⏳ Start Scraping ({keyword}) für Nutzer {user_id}")

    loop = asyncio.get_running_loop()
    first_page_data = await loop.run_in_executor(executor, fetch_first_page_data, keyword)

    if not first_page_data:
        first_page_data = {"first_page_products": [], "top_search_suggestions": []}
        scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "error"
    else:
        scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "done"

    scraping_processes[user_id][clustername]["keywords"][keyword]["data"] = first_page_data
    print(f"✅ Scraping für '{keyword}' abgeschlossen! (Nutzer {user_id})")

def fetch_first_page_data(keyword: str):
    """Führt das Scraping im Hintergrund aus"""
    amazon_scraper = AmazonFirstPageScraper(headless=True, show_details=True)
    return amazon_scraper.get_first_page_data(keyword)
