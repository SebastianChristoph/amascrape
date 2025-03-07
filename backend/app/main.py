import random
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.routes import users, markets, market_clusters
from app.database import init_db
from typing import List
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper
from fastapi import FastAPI, BackgroundTasks


app = FastAPI()

# start with
# python -m uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload

# Datenbank initialisieren
init_db()

# ✅ CORS aktivieren
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # 🔥 React-Frontend erlauben
    allow_credentials=True,
    allow_methods=["*"],  # GET, POST, DELETE, usw. erlauben
    allow_headers=["*"],  # Alle Header erlauben
    )


# 📌 Router registrieren
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(markets.router, prefix="/markets", tags=["Markets"])
app.include_router(market_clusters.router, prefix="/market-clusters", tags=["Market Clusters"])  # 📌 Neue Route
@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Auth System"}


asin_results = {}

@app.get("/api/get-asins")
async def fetch_asins(search_term: str, task_id: str, background_tasks: BackgroundTasks):
    """Startet das Scraping und speichert den Task als 'processing'"""
    
    # 🔥 Stelle sicher, dass die Task-ID gespeichert wird, bevor Scraping startet
    asin_results[task_id] = {"status": "processing", "asins": []}

    # Starte Scraping im Hintergrund
    background_tasks.add_task(run_scraping_task_test, search_term, task_id)

    return {"message": "Scraping started", "task_id": task_id}



@app.get("/api/get-asins/status")
async def get_scraping_status(task_id: str):
    """Gibt den aktuellen Status des Scraping-Tasks zurück"""
    if task_id not in asin_results:
        print(f"❌ [Backend] Task {task_id} nicht gefunden!")  # ✅ DEBUG LOG
        return {"status": "not found"}
    
    print(f"🔄 [Backend] Task {task_id} Status: {asin_results[task_id]['status']}")  # ✅ DEBUG LOG
    return asin_results[task_id]


def run_scraping_task_test(search_term: str, task_id: str):
    print(f"🚀 [Scraping gestartet] Task {task_id} für '{search_term}'")  
    asin_results[task_id] = {"status": "processing", "asins": []}

    delay = random.randint(3, 8)
    print(f"⏳ [Scraping läuft] Task {task_id}, Wartezeit: {delay} Sekunden")
    time.sleep(delay)

    fake_asins = [
        {"asin": f"TEST-{i}", "title": f"Produkt {i}", "price": round(random.uniform(5, 100), 2)}
        for i in range(random.randint(3, 10))
    ]

    asin_results[task_id] = {"status": "completed", "data": {"first_page_products": fake_asins}}
    print(f"✅ [Scraping abgeschlossen] Task {task_id} hat {len(fake_asins)} Produkte gefunden.")


# def run_scraping_task(search_term: str, task_id: str):
#     """Führt das Scraping aus und speichert das Ergebnis"""
    
#     # Sicherstellen, dass eine Instanz verwendet wird
#     amazon_scraper = AmazonFirstPageScraper(headless=True,show_details=False)
#     first_page_data = amazon_scraper.get_first_page_data(search_term)

#     # DEBUG: Zeige gefundene ASINs in der Konsole
#     # print(f"✅ Scraping für Task {task_id} abgeschlossen. Gefundene ASINs: {asins}")

#     # **Hier den Status auf "completed" setzen**
#     asin_results[task_id] = {"status": "completed", "data": first_page_data}

