import os
from concurrent.futures import ThreadPoolExecutor
from app.database import init_db, ensure_admin_user
from app.routes import chartdata, market_clusters, scraping, users, user_products, products
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware



# Start mit:
# python -m uvicorn app.main:app --host 0.0.0.0 --port 9000 --reload

executor = ThreadPoolExecutor()
app = FastAPI()

# ✅ Prüfen, ob die Datenbank existiert, falls nicht → Erstellen
DB_FILE = "marketdata.db"

def initialize_database():
    if not os.path.exists(DB_FILE):
        print("📌 Keine vorhandene Datenbank gefunden. Erstelle neue DB...")
        init_db()  # Erstellt alle Tabellen und Admin-User
    else:
        print("✅ Datenbank existiert bereits.")
        ensure_admin_user()  # Falls der Admin-User fehlt, erstelle ihn

initialize_database()

# ✅ CORS aktivieren (für Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # ✅ Erlaubt React-Frontend
    allow_credentials=True,
    allow_methods=["*"],  # ✅ Erlaubt alle HTTP-Methoden
    allow_headers=["*"],  # ✅ Erlaubt alle Header
)

# ✅ Router einbinden
app.include_router(users.router, prefix="/users", tags=["Users"])
app.include_router(products.router, prefix="/products", tags=["Markets"])
app.include_router(market_clusters.router, prefix="/market-clusters", tags=["Market Clusters"])
app.include_router(chartdata.router, prefix="/chartdata", tags=["Chart Data"])
app.include_router(scraping.router, prefix="/scraping", tags=["Scraping"])
app.include_router(user_products.router, prefix="/user-products", tags=["User Products"])


@app.get("/")
def root():
    return {"message": "Welcome to the FastAPI Auth System"}
