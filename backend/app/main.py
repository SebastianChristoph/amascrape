from datetime import datetime, timezone
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from app.routes import users, markets, market_clusters
from app.database import SessionLocal, ensure_test_users, init_db, engine, get_db
from typing import List, Optional
from sqlalchemy.orm import Session
from app.auth import get_current_user
from app.routes import chartdata, scraping
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from fastapi import BackgroundTasks
from pydantic import BaseModel
import asyncio
from app.models import Base, Market, MarketChange, MarketCluster, Product, ProductChange, User
from sqlalchemy.exc import OperationalError
from concurrent.futures import ThreadPoolExecutor

# start with
 # python -m uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload

 
executor = ThreadPoolExecutor()

# class NewClusterData(BaseModel):
#     keywords: List[str]
#     clusterName: Optional[str] = None

app = FastAPI()

# ✅ Datenbank initialisieren (nur wenn notwendig)
def initialize_database():
    db = SessionLocal()
    try:
        try:
            db.execute(text("SELECT 1 FROM users LIMIT 1"))
            print("✅ Users-Tabelle existiert bereits.")
            print("rufe ensure auf")
            ensure_test_users()  # ✅ Stellt sicher, dass die Testbenutzer eingefügt werden!
        except OperationalError:
            print("📌 Keine users-Tabelle gefunden. Erstelle alle Tabellen...")
            Base.metadata.create_all(bind=engine)  # ✅ Erstellt alle Tabellen
            init_db()  # Initialisiert die DB mit Testdaten
            return  

        print("✅ Datenbank ist bereits initialisiert.")

    finally:
        db.close()

initialize_database()

# ✅ CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 🔥 React-Frontend erlauben
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, DELETE, usw. erlauben
    allow_headers=["*"],  # Alle Header erlauben
)

app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(markets.router, prefix="/markets", tags=["Markets"])
app.include_router(market_clusters.router, prefix="/market-clusters", tags=["Market Clusters"])
app.include_router(chartdata.router, prefix="/chartdata", tags=["Chart Data"])
app.include_router(scraping.router, tags=["Scraping"])  # ✅ Scraping als eigenes Modul

@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Auth System"}

scraping_processes = {}  # Struktur: { user_id: { cluster_name: { status, keywords: {...} } } }

# @app.post("/api/start-firstpage-scraping-process")
# async def post_scraping(newClusterData: NewClusterData, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
#     """Startet den Scraping-Prozess für einen Nutzer"""
#     user_id = current_user.id
#     cluster_name = newClusterData.clusterName
#     print(f"🔥 Start Scraping für Nutzer {user_id}, Cluster: {cluster_name}")

#     scraping_processes[user_id] = {}
#     scraping_processes[user_id][cluster_name] = {"status": "processing", "keywords": {}}

#     for keyword in newClusterData.keywords:
#         market_exists = db.query(Market).filter(Market.keyword == keyword).first()

#         if market_exists:
#             print(f"✅ Market '{keyword}' existiert bereits.")
#             scraping_processes[user_id][cluster_name]["keywords"][keyword] = {"status": "done", "data": {}}
#         else:
#             print(f"🔍 Scraping für neues Keyword: {keyword}")
#             scraping_processes[user_id][cluster_name]["keywords"][keyword] = {"status": "processing", "data": {}}
#             asyncio.create_task(scraping_process(keyword, cluster_name, user_id))  

#     return {"success": True, "message": f"Scraping für {cluster_name} gestartet"}

# @app.get("/api/get-loading-clusters")
# @app.get("/api/get-loading-clusters")
# async def get_loading_clusters(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
#     user_id = current_user.id
#     if user_id not in scraping_processes or not scraping_processes[user_id]:
#         print("[get-loading-clusters] keine user id in scraping processes")
#         return {"active_clusters": []}  # ✅ Keine aktiven Scraping-Prozesse

#     clustername, cluster_data = next(iter(scraping_processes[user_id].items()))

#     has_errors = False
#     for keyword in cluster_data["keywords"]:
#         for key, value in cluster_data["keywords"][keyword].items():
#             #print(cluster_data["keywords"][keyword], key, value)
#             if value == "error":
#                 has_errors = True
#                 break

# # CHECK STATUS FOR ERRORS
# # {'status': 'error', 'data': {'first_page_products': [], 'top_search_suggestions': []}} status error
# # {'status': 'error', 'data': {'first_page_products': [], 'top_search_suggestions': []}} data {'first_page_products': [], 'top_search_suggestions': []}
# # return active cluster: {'clustername': 'd', 'status': 'processing', 'keywords': {'sdsd': 'error'}}
#     if has_errors:
#         print("### FOUND ERROR")
#         cluster_data["status"] = "error"
#         keywords_status = {
#                 keyword: data["status"] for keyword, data in cluster_data["keywords"].items()
#             }
#         active_cluster = {
#                 "clustername": clustername,
#                 "status": "error",
#                 "keywords": keywords_status
#             }
#         #print("return active cluster:", active_cluster)

#         scraping_processes[user_id] = {}
#         print("set scraping processes for user to default")
        
#         return active_cluster


#     # ✅ Prüfen, ob noch ein Keyword im Status "processing" ist
#     all_done = all(status["status"] == "done" for status in cluster_data["keywords"].values())

#     if all_done:
#         # ✅ Falls alles fertig ist, setze Status auf "done"
#         scraping_processes[user_id][clustername]["status"] = "done"
#         print(f"✅ Alle Keywords für '{clustername}' fertig! -> Datenbank schreiben")

#         # 🔍 **CHECK: Gibt es das MarketCluster bereits für diesen Nutzer?**
#         existing_cluster = db.query(MarketCluster).filter(
#             MarketCluster.title == clustername,
#             MarketCluster.user_id == user_id
#         ).first()

#         if existing_cluster:
#             print(f"🔗 MarketCluster '{clustername}' existiert bereits -> Keine doppelte Anlage.")
#         else:
#             # 📌 Neues MarketCluster anlegen
#             new_cluster = MarketCluster(title=clustername, user_id=user_id)
#             db.add(new_cluster)

#             for keyword, keyword_data in scraping_processes[user_id][clustername]["keywords"].items():
#                 existing_market = db.query(Market).filter(Market.keyword == keyword).first()

#                 if existing_market:
#                     print(f"🔗 Markt '{keyword}' existiert bereits -> Verknüpfung mit Cluster.")
#                     new_cluster.markets.append(existing_market)
#                     continue  # Weiter zum nächsten Keyword

#                 print(f"🆕 Neuer Markt '{keyword}' wird angelegt.")
#                 new_market = Market(keyword=keyword)
#                 db.add(new_market)
#                 db.commit()
#                 db.refresh(new_market)
#                 new_cluster.markets.append(new_market)

#                 # ✅ MarketChange für neuen Markt erstellen
#                 product_data_list = keyword_data["data"].get("first_page_products", [])
#                 new_asins = [p["asin"] for p in product_data_list] if product_data_list else []
#                 top_suggestions = keyword_data["data"].get("top_search_suggestions", [])

#                 new_market_change = MarketChange(
#                     market_id=new_market.id,
#                     change_date=datetime.now(timezone.utc),
#                     new_products=",".join(new_asins),
#                 )
#                 new_market_change.set_top_suggestions(top_suggestions)
#                 db.add(new_market_change)

#                 # ✅ Produkte & ProductChanges verknüpfen
#                 for product_data in product_data_list:
#                     existing_product = db.query(Product).filter(Product.asin == product_data["asin"]).first()

#                     if existing_product:
#                         new_market.products.append(existing_product)
#                         new_market_change.products.append(existing_product)
#                     else:
#                         new_product = Product(asin=product_data["asin"])
#                         db.add(new_product)
#                         db.commit()
#                         db.refresh(new_product)

#                         new_market.products.append(new_product)
#                         new_market_change.products.append(new_product)

#                         # ✅ ProductChange sicher erstellen (Fallbacks für fehlende Daten)
#                         new_product_change = ProductChange(
#                             asin=new_product.asin,
#                             title=product_data.get("title", None),
#                             price=product_data.get("price") if isinstance(product_data.get("price"), (int, float)) else None,
#                             main_category=product_data.get("main_category", None),
#                             second_category=product_data.get("second_category", None),
#                             main_category_rank=product_data.get("main_category_rank", None),
#                             second_category_rank=product_data.get("second_category_rank", None),
#                             img_path=product_data.get("image", None),
#                             change_date=datetime.now(timezone.utc),
#                             changes="Initial creation",
#                             blm=None,
#                             total=None,
#                         )
#                         db.add(new_product_change)
#                         db.commit()
#                         db.refresh(new_product_change)

#                         new_product.product_changes.append(new_product_change)

#             db.commit()
#             db.refresh(new_cluster)

#         # ✅ Alle Prozesse abgeschlossen, leeres Array zurückgeben
#         del scraping_processes[user_id]
#         return {"active_clusters": []}
    
#     else:
#         if cluster_data["status"] == "processing":
#             keywords_status = {
#                 keyword: data["status"] for keyword, data in cluster_data["keywords"].items()
#             }
#             active_cluster = {
#                 "clustername": clustername,
#                 "status": cluster_data["status"],
#                 "keywords": keywords_status
#             }
#             #print("return active cluster:", active_cluster)
#             return active_cluster

# async def scraping_process(keyword: str, clustername: str, user_id: int):
#     """Führt das Scraping für ein Keyword durch"""
#     print(f"⏳ Start Scraping ({keyword}) für Nutzer {user_id}")

#     loop = asyncio.get_running_loop()
#     first_page_data = await loop.run_in_executor(executor, fetch_first_page_data, keyword)

#     # ✅ Falls der Scraper keine Daten zurückgibt, setze Standardwerte
#     if not first_page_data:
#         first_page_data = {"first_page_products": [], "top_search_suggestions": []}
#         scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "error"
#     else:
#         scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "done"
    
#     scraping_processes[user_id][clustername]["keywords"][keyword]["data"] = first_page_data
    
    
#     print(f"✅ Scraping für '{keyword}' abgeschlossen! (Nutzer {user_id})")


# def fetch_first_page_data(keyword: str):
#     """Scraper-Logik"""

#     amazon_scraper = AmazonFirstPageScraper(headless=True, show_details=True)
#     return amazon_scraper.get_first_page_data(keyword)

# async def scraping_process(keyword: str, clustername: str, user_id: int):
#     print(f"⏳ Start Scraping ({keyword}) für Nutzer {user_id}")
#     loop = asyncio.get_running_loop()
#     first_page_data = await loop.run_in_executor(executor, fetch_first_page_data, keyword)
#     scraping_processes[user_id][clustername]["keywords"][keyword]["status"] = "done"
#     scraping_processes[user_id][clustername]["keywords"][keyword]["data"] = first_page_data

# def fetch_first_page_data(keyword: str):
#     amazon_scraper = AmazonFirstPageScraper(headless=True, show_details=True)
#     return amazon_scraper.get_first_page_data(keyword)
