import os
import random
import string
from datetime import datetime, timedelta, timezone

from app.auth import get_password_hash
from app.models import Base, Market, MarketChange, MarketCluster, Product, ProductChange, User
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import text

# ✅ Lade Umgebungsvariablen
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///marketdata.db")  # Standard: SQLite
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set in environment variables!")

print(f"✅ Loaded DATABASE_URL: {DATABASE_URL}")

# ✅ Datenbank-Verbindung einrichten
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Datenbank-Initialisierung
def init_db():
    """Erstellt die Datenbank-Tabellen nur, wenn sie nicht existieren und fügt den Admin-User hinzu."""
    db = SessionLocal()
    try:
        # **📌 Stelle sicher, dass alle Tabellen erstellt werden**
        print("📌 Erstelle Datenbank-Tabellen...")
        Base.metadata.create_all(bind=engine)

        # **📌 Admin-User erstellen, falls nicht vorhanden**
        ensure_admin_user()

        print("✅ Datenbank-Initialisierung abgeschlossen.")
    except Exception as e:
        print(f"❌ Fehler beim Initialisieren der Datenbank: {e}")
    finally:
        db.close()


# ✅ Stellt eine DB-Session bereit
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ✅ Admin-User sicherstellen
def ensure_admin_user():
    """Falls der Admin-User nicht existiert, erstelle ihn."""
    db = SessionLocal()
    try:
        existing_admin = db.query(User).filter(User.username == "admin").first()
        if not existing_admin:
            print("📌 Admin-User nicht gefunden. Erstelle 'admin' mit Passwort 'admin'...")
            admin_user = User(
                username="admin",
                email="admin@admin.de",
                hashed_password=get_password_hash("admin"),
                is_verified=True  # Admin sollte sofort aktiviert sein
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin-User wurde erfolgreich erstellt.")
        else:
            print("✅ Admin-User existiert bereits.")
    except Exception as e:
        print(f"❌ Fehler beim Erstellen des Admin-Users: {e}")
    finally:
        db.close()

