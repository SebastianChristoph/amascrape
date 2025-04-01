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

@router.post("/start-firstpage-scraping-process")
async def start_firstpage_scraping(
    newClusterData: NewClusterData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cluster_name = newClusterData.clusterName or "Unnamed Cluster"
    cluster_type = newClusterData.clusterType or "dynamic"

    # Cluster anlegen
    new_cluster = MarketCluster(
        title=cluster_name,
        user_id=current_user.id,
        cluster_type=cluster_type
    )
    db.add(new_cluster)
    db.commit()
    db.refresh(new_cluster)

    for keyword in newClusterData.keywords:
        market = db.query(Market).filter(Market.keyword == keyword).first()

        if not market:
            market = Market(keyword=keyword)
            db.add(market)
            db.commit()
            db.refresh(market)

            # First Page Scraping ausführen (async im Hintergrund)
            await perform_first_page_scrape(market, new_cluster, db)
        
        new_cluster.markets.append(market)

    db.commit()

    # Orchestratoren starten
    loop = asyncio.get_running_loop()
    loop.run_in_executor(executor, run_product_orchestrator, new_cluster.id)

    return {"message": f"Cluster '{cluster_name}' mit Scraping gestartet."}

async def perform_first_page_scrape(market: Market, cluster: MarketCluster, db: Session):
    loop = asyncio.get_running_loop()
    data = await loop.run_in_executor(executor, fetch_first_page_data, market.keyword)

    product_data_list = data.get("first_page_products", [])
    top_suggestions = data.get("top_search_suggestions", [])

    market_change = MarketChange(
        market_id=market.id,
        change_date=datetime.now(timezone.utc),
        new_products=",".join([p["asin"] for p in product_data_list])
    )
    market_change.set_top_suggestions(top_suggestions)
    db.add(market_change)

    for product_data in product_data_list:
        product = db.query(Product).filter(Product.asin == product_data["asin"]).first()

        if not product:
            product = Product(asin=product_data["asin"])
            db.add(product)
            db.commit()
            db.refresh(product)

        market.products.append(product)
        market_change.products.append(product)

        product_change = ProductChange(
            asin=product.asin,
            title=product_data.get("title"),
            price=product_data.get("price"),
            main_category=product_data.get("main_category"),
            second_category=product_data.get("second_category"),
            main_category_rank=product_data.get("main_category_rank"),
            second_category_rank=product_data.get("second_category_rank"),
            img_path=product_data.get("image"),
            change_date=datetime.now(timezone.utc),
            changes="Initial creation"
        )
        db.add(product_change)
        db.commit()

        product.product_changes.append(product_change)

    db.commit()

@router.get("/get-loading-clusters")
async def get_loading_clusters(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    clusters = db.query(MarketCluster).filter(
        MarketCluster.user_id == current_user.id,
        MarketCluster.is_initial_scraped == False
    ).all()
    return [
        {
            "id": cluster.id,
            "title": cluster.title,
            "status": "initial_scraping",
            "cluster_type": cluster.cluster_type
        }
        for cluster in clusters
    ]

def fetch_first_page_data(keyword: str):
    scraper = AmazonFirstPageScraper(headless=True, show_details=True)
    return scraper.get_first_page_data(keyword)

def run_product_orchestrator(cluster_id: int):
    try:
        orchestrator = Product_Orchestrator(just_scrape_3_products=False, cluster_to_scrape=cluster_id)
        orchestrator.update_products()
        run_market_orchestrator(cluster_id)
    except Exception as e:
        print(f"❌ Fehler im Product-Orchestrator für Cluster {cluster_id}: {e}")

def run_market_orchestrator(cluster_id: int):
    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        orchestrator = MarketOrchestrator(cluster_to_scrape=cluster_id)
        orchestrator.update_markets()

        # Cluster als gescraped markieren
        db = next(get_db())
        db.query(MarketCluster).filter(MarketCluster.id == cluster_id).update({"is_initial_scraped": True})
        db.commit()
    except Exception as e:
        print(f"❌ Fehler im Market-Orchestrator für Cluster {cluster_id}: {e}")


## ASYNC PRODUCT ORCHESTRATOR
# def run_product_orchestrator(cluster_id: int, db: Session):
#     """Führt den Product Orchestrator für ein bestimmtes Cluster aus und startet danach den Market Orchestrator asynchron."""
#     try:
#         print(f"🔄 Product-Orchestrator gestartet für Cluster {cluster_id}")

#         # 🏁 Starte den Product Orchestrator
#         orchestrator = Product_Orchestrator(just_scrape_3_products=False, cluster_to_scrape=cluster_id)
#         orchestrator.update_products()

#         print(f"✅ Product-Orchestrator abgeschlossen für Cluster {cluster_id}, starte Market-Orchestrator...")

#         # 🏁 Starte den Market Orchestrator in einem neuen Thread mit eigenem Event-Loop
#         thread_executor = ThreadPoolExecutor()
#         thread_executor.submit(run_market_orchestrator, cluster_id, db)

#     except Exception as e:
#         print(f"❌ Fehler im Product-Orchestrator für Cluster {cluster_id}: {e}")

# ## ASYNC MARKET ORCHESTRATOR
# def run_market_orchestrator(cluster_id: int, db: Session):
#     """Führt den Market Orchestrator für ein bestimmtes Cluster aus."""
#     try:
#         print(f"🔄 Market-Orchestrator gestartet für Cluster {cluster_id}")

#         # 🏁 Erstelle einen **neuen** Event-Loop für diesen Thread
#         loop = asyncio.new_event_loop()
#         asyncio.set_event_loop(loop)

#         orchestrator = MarketOrchestrator(cluster_to_scrape=cluster_id)
#         orchestrator.update_markets()

#         print(f"✅ Market-Orchestrator abgeschlossen für Cluster {cluster_id}")

#         # ✅ Setze is_initial_scraped auf True
#         mark_cluster_as_scraped(cluster_id, db)

#     except Exception as e:
#         print(f"❌ Fehler im Market-Orchestrator für Cluster {cluster_id}: {e}")

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
