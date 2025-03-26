import asyncio
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from typing import Dict, List, Optional

from fastapi.responses import FileResponse, JSONResponse
from app.auth import get_current_user
from app.database import get_db
from app.models import (Market, MarketChange, MarketCluster, Product,
                        ProductChange, User)
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from scraper.Product_Orchestrator import Product_Orchestrator
from pathlib import Path
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from sqlalchemy.orm import Session
import logging
from scraper.Market_Orchestrator import MarketOrchestrator
from fastapi import BackgroundTasks, Body
from app.auth import is_admin

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

LOGS_DIR = Path(__file__).resolve().parents[2] / "scraper" / "logs"
asin_test_logs = {}


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.StreamHandler()  # Direkt in die Konsole schreiben
    ]
)

scraping_processes: Dict[int, Dict[str, Dict[str, Dict[str, any]]]] = {}

## Get all clusters that are first-page-scraped right now
## TODO: Refactoring
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
            existing_cluster = new_cluster

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

## START FIRST PAGE SCRAPING FOR CLUSTER
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

## ASYNC INITIAL FIRST PAGE SCRAPING  WRAPPER
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

## INITIAL FIRST PAGE SCRAPING 
def fetch_first_page_data(keyword: str):
    """Führt das Scraping im Hintergrund aus"""
    amazon_scraper = AmazonFirstPageScraper(headless=True, show_details=True)
    return amazon_scraper.get_first_page_data(keyword)

## ASYNC PRODUCT ORCHESTRATOR
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

## ASYNC MARKET ORCHESTRATOR
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

# TODO: nur ADMIN
@router.get("/logs")
def list_scraping_logs(current_user: User = Depends(get_current_user)):
    """
    Gibt alle .txt Log-Dateien zurück (fails + scraping)
    """
    if current_user.username != "admin":
        raise JSONResponse(status_code=403, content={"error": "Access only for admins"})
    else:
        print("is admiN!")
    if not LOGS_DIR.exists():
        print("no logs dir")
        return []
    
    files = sorted([f.name for f in LOGS_DIR.glob("*.txt")], reverse=True)
    print("files", files)
    return files

@router.get("/logs/{filename}")
def get_log_content(filename: str, current_user: User = Depends(get_current_user)):
    """
    Gibt den Inhalt einer bestimmten Log-Datei zurück
    """
    if current_user.username != "admin":
        raise JSONResponse(status_code=403, content={"error": "Access only for admins"})
    file_path = LOGS_DIR / filename
    if not file_path.exists() or not file_path.is_file():
        return JSONResponse(status_code=404, content={"error": "Datei nicht gefunden."})
    
    return FileResponse(file_path, media_type="text/plain")


@router.post("/test-asin")
async def test_single_asin(
    background_tasks: BackgroundTasks,
    asin: str = Body(..., embed=True), current_user: User = Depends(get_current_user)
):
    if current_user.username != "admin":
        raise JSONResponse(status_code=403, content={"error": "Access only for admins"})
    timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S")
    asin_test_logs[asin] = f"🧪 Starte Test für ASIN: {asin} @ {timestamp}\n"
    background_tasks.add_task(run_single_asin_scraper, asin)
    return {"message": f"Scraping für ASIN {asin} gestartet"}

@router.get("/test-asin/{asin}")
def get_single_asin_log(asin: str, current_user: User = Depends(get_current_user)):
    """Gibt das aktuelle Log für einen ASIN-Test zurück"""
    if current_user.username != "admin":
        raise JSONResponse(status_code=403, content={"error": "Access only for admins"})
    return {"log": asin_test_logs.get(asin, "Kein Log gefunden.")}


def run_single_asin_scraper(asin: str, current_user: User = Depends(get_current_user)):
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    import scraper.selenium_config as selenium_config
    from scraper.product_selenium_scraper import AmazonProductScraper
    import traceback

    try:
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")
        chrome_options.add_argument("--disable-gpu")
        chrome_options.add_argument("--window-size=1920,1080")
        chrome_options.add_argument(f"user-agent={selenium_config.user_agent}")

        driver = webdriver.Chrome(options=chrome_options)
        scraper = AmazonProductScraper(driver, show_details=False)

        driver.get("https://www.amazon.com")
        for cookie in selenium_config.cookies:
            driver.add_cookie(cookie)

        product_data = scraper.get_product_infos(asin)
        if product_data:
            log = "\n✅ Produkt erfolgreich gescraped!\n"
            for k, v in product_data.items():
                log += f"{k}: {str(v)[:80]}\n"
        else:
            log = "❌ Kein Produkt gefunden oder Scrape fehlgeschlagen."

        asin_test_logs[asin] += log

    except Exception as e:
        asin_test_logs[asin] += f"\n❌ Fehler:\n{traceback.format_exc()}"

    finally:
        try:
            driver.quit()
        except:
            pass
        asin_test_logs[asin] += "\n✅ WebDriver geschlossen.\n"
