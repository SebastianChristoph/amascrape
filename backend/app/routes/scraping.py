import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
import os
from typing import Dict, List, Optional

from app.auth import get_current_user
from app.database import get_db
from app.models import (Market, MarketChange, MarketCluster, Product,
                        ProductChange, User)
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from scraper.Product_Orchestrator import Product_Orchestrator  # ✅ Richtig

from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from sqlalchemy.orm import Session
import logging
from scraper.Market_Orchestrator import MarketOrchestrator


router = APIRouter()
executor = ThreadPoolExecutor()
orchestrator_task = None
orchestrator_running = False
market_orchestrator_task = None
market_orchestrator_running = False


class NewClusterData(BaseModel):
    keywords: List[str]
    clusterName: Optional[str] = None
    clusterType: Optional[str] = None


LOG_FILE_PRODUCT = "scraping_log.txt"
LOG_FILE_MARKET = "market_scraping_log.txt"

# ✅ Logging-Konfiguration
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()  # Direkt in die Konsole schreiben
    ]
)

scraping_processes: Dict[int, Dict[str, Dict[str, Dict[str, any]]]] = {}


@router.post("/start-firstpage-scraping-process")
async def post_scraping(
    newClusterData: NewClusterData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Startet den Scraping-Prozess für einen Nutzer"""
    user_id = current_user.id
    cluster_name = newClusterData.clusterName
    cluster_type = newClusterData.clusterType
    print(f"🔥 Start Scraping für Nutzer {user_id}, Cluster: {cluster_name}")

    scraping_processes[user_id] = {}
    scraping_processes[user_id][cluster_name] = {
        "status": "processing", "keywords": {},  "cluster_type": cluster_type}

    for keyword in newClusterData.keywords:
        market_exists = db.query(Market).filter(
            Market.keyword == keyword).first()

        if market_exists:
            print(f"✅ Market '{keyword}' existiert bereits.")
            scraping_processes[user_id][cluster_name]["keywords"][keyword] = {
                "status": "done", "data": {}}
        else:
            print(f"🔍 Scraping für neues Keyword: {keyword}")
            scraping_processes[user_id][cluster_name]["keywords"][keyword] = {
                "status": "processing", "data": {}}
            asyncio.create_task(scraping_process(
                keyword, cluster_name, user_id))

    return {"success": True, "message": f"Scraping für {cluster_name} mit type {cluster_type} gestartet"}


@router.get("/get-loading-clusters")
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
    has_errors = any(
        data["status"] == "error" for data in cluster_data["keywords"].values())

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
    all_done = all(
        status["status"] == "done" for status in cluster_data["keywords"].values())

    if all_done:
        scraping_processes[user_id][clustername]["status"] = "done"
        print(
            f"✅ Alle Keywords für '{clustername}' fertig! -> Datenbank schreiben")

        existing_cluster = db.query(MarketCluster).filter(
            MarketCluster.title == clustername, MarketCluster.user_id == user_id
        ).first()

        if not existing_cluster:
            # 🆕 Default ist "dynamic", falls nicht gesetzt
            cluster_type = cluster_data.get("cluster_type", "dynamic")
            new_cluster = MarketCluster(
                title=clustername, user_id=user_id, cluster_type=cluster_type)

            db.add(new_cluster)

            for keyword, keyword_data in scraping_processes[user_id][clustername]["keywords"].items():
                existing_market = db.query(Market).filter(
                    Market.keyword == keyword).first()

                if existing_market:
                    new_cluster.markets.append(existing_market)
                    continue

                new_market = Market(keyword=keyword)
                db.add(new_market)
                db.commit()
                db.refresh(new_market)
                new_cluster.markets.append(new_market)

                product_data_list = keyword_data["data"].get(
                    "first_page_products", [])
                top_suggestions = keyword_data["data"].get(
                    "top_search_suggestions", [])

                new_market_change = MarketChange(
                    market_id=new_market.id,
                    change_date=datetime.now(timezone.utc),
                    new_products=",".join(
                        [p["asin"] for p in product_data_list]) if product_data_list else "",
                )
                new_market_change.set_top_suggestions(top_suggestions)
                db.add(new_market_change)

                for product_data in product_data_list:
                    existing_product = db.query(Product).filter(
                        Product.asin == product_data["asin"]).first()

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
                            second_category=product_data.get(
                                "second_category"),
                            main_category_rank=product_data.get(
                                "main_category_rank"),
                            second_category_rank=product_data.get(
                                "second_category_rank"),
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

         # ✅ Startet den Product Orchestrator asynchron für das Cluster

        print(
            f"🚀 Starte Product-Orchestrator für Cluster-ID {existing_cluster.id}")
        loop = asyncio.get_running_loop()
        loop.run_in_executor(ThreadPoolExecutor(),
                             run_product_orchestrator, existing_cluster.id, db)

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
        first_page_data = {"first_page_products": [],
                           "top_search_suggestions": []}
        scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "error"
    else:
        scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "done"

    scraping_processes[user_id][clustername]["keywords"][keyword]["data"] = first_page_data
    print(f"✅ Scraping für '{keyword}' abgeschlossen! (Nutzer {user_id})")


def fetch_first_page_data(keyword: str):
    """Führt das Scraping im Hintergrund aus"""
    amazon_scraper = AmazonFirstPageScraper(headless=True, show_details=True)
    return amazon_scraper.get_first_page_data(keyword)
# ✅ Product Orchestrator Start


@router.post("/start-product-orchestrator")
async def start_product_orchestrator(current_user: User = Depends(get_current_user)):
    global orchestrator_task, orchestrator_running
    open(LOG_FILE_PRODUCT, "w").close()
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Nur Admins dürfen den Product Orchestrator starten.")

    if orchestrator_running:
        return {"success": False, "message": "Product Orchestrator läuft bereits!"}

    orchestrator_running = True
    loop = asyncio.get_running_loop()
    orchestrator_task = loop.run_in_executor(
        executor, run_product_orchestrator)

    return {"success": True, "message": "Product Orchestrator wurde gestartet!"}



def run_product_orchestrator(cluster_id: int, db: Session):
    """Führt den Product Orchestrator für ein bestimmtes Cluster aus und startet danach den Market Orchestrator asynchron."""
    try:
        print(f"🔄 Product-Orchestrator gestartet für Cluster {cluster_id}")

        # 🏁 Starte den Product Orchestrator
        orchestrator = Product_Orchestrator(just_scrape_3_products=False, cluster_to_scrape=cluster_id)
        orchestrator.update_products()

        print(f"✅ Product-Orchestrator abgeschlossen für Cluster {cluster_id}, starte Market-Orchestrator...")

        # 🏁 Starte den Market Orchestrator in einem neuen Thread mit eigenem Event-Loop
        thread_executor = ThreadPoolExecutor()
        thread_executor.submit(run_market_orchestrator, cluster_id, db)

    except Exception as e:
        print(f"❌ Fehler im Product-Orchestrator für Cluster {cluster_id}: {e}")

# ✅ Market Orchestrator Start


@router.post("/start-market-orchestrator")
async def start_market_orchestrator(current_user: User = Depends(get_current_user)):
    global market_orchestrator_task, market_orchestrator_running

    if not is_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Nur Admins dürfen den Market Orchestrator starten.")

    if market_orchestrator_running:
        return {"success": False, "message": "Market Orchestrator läuft bereits!"}

    market_orchestrator_running = True
    loop = asyncio.get_running_loop()
    market_orchestrator_task = loop.run_in_executor(
        executor, run_market_orchestrator)

    return {"success": True, "message": "Market Orchestrator wurde gestartet!"}



def run_market_orchestrator(cluster_id: int, db: Session):
    """Führt den Market Orchestrator für ein bestimmtes Cluster aus."""
    try:
        print(f"🔄 Market-Orchestrator gestartet für Cluster {cluster_id}")

        # 🏁 Erstelle einen **neuen** Event-Loop für diesen Thread
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        orchestrator = MarketOrchestrator(cluster_to_scrape=cluster_id)
        orchestrator.update_markets()

        print(f"✅ Market-Orchestrator abgeschlossen für Cluster {cluster_id}")

        # ✅ Setze is_initial_scraped auf True
        mark_cluster_as_scraped(cluster_id, db)

    except Exception as e:
        print(f"❌ Fehler im Market-Orchestrator für Cluster {cluster_id}: {e}")


def mark_cluster_as_scraped(cluster_id: int, db: Session):
    """Setzt is_initial_scraped auf True, wenn der Market-Orchestrator beendet ist."""
    try:
        db.query(MarketCluster).filter(MarketCluster.id == cluster_id).update({"is_initial_scraped": True})
        db.commit()
        print(f"✅ MarketCluster {cluster_id} wurde als vollständig gescraped markiert.")
    except Exception as e:
        print(f"❌ Fehler beim Setzen von is_initial_scraped für Cluster {cluster_id}: {e}")

# ✅ Status-Abfrage für Product Orchestrator


@router.get("/is-product-orchestrator-running")
async def is_product_orchestrator_running(current_user: User = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Nur Admins dürfen den Status abrufen.")
    return {"running": orchestrator_running}

# ✅ Status-Abfrage für Market Orchestrator


@router.get("/is-market-orchestrator-running")
async def is_market_orchestrator_running(current_user: User = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Nur Admins dürfen den Status abrufen.")
    return {"running": market_orchestrator_running}

# ✅ Logs für Product Orchestrator abrufen


@router.get("/get-product-orchestrator-logs")
async def get_product_orchestrator_logs(current_user: User = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Nur Admins dürfen Logs sehen.")
    return get_logs(LOG_FILE_PRODUCT)

# ✅ Logs für Market Orchestrator abrufen


@router.get("/get-market-orchestrator-logs")
async def get_market_orchestrator_logs(current_user: User = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(
            status_code=403, detail="Nur Admins dürfen Logs sehen.")
    return get_logs(LOG_FILE_MARKET)


def get_logs(log_file):
    if not os.path.exists(log_file):
        return {"logs": ["🚫 Keine Logs gefunden!"]}
    try:
        with open(log_file, "r", encoding="utf-8") as f:
            logs = f.readlines()
        return {"logs": logs[-20:]}  # 🔹 Nur die letzten 20 Logs anzeigen
    except Exception as e:
        return {"logs": [f"❌ Fehler beim Abrufen der Logs: {str(e)}"]}


def is_admin(user: User):
    return user.username == "admin"
