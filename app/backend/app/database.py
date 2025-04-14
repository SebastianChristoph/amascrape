import os
from app.auth import get_password_hash
from app.models import Base, User
from dotenv import load_dotenv
from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///marketdata.db")  # Standard: SQLite
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set in environment variables!")

if DATABASE_URL.startswith("sqlite"):
    connect_args = {"check_same_thread": False}
else:
    connect_args = {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


def init_db():
    """Erstellt die Datenbank-Tabellen nur, wenn sie nicht existieren und fügt den Admin-User hinzu."""
    db = SessionLocal()
    try:
        print("📌 Erstelle Datenbank-Tabellen...")
        Base.metadata.create_all(bind=engine)

        # Erst Admin erstellen, wenn die Tabellen wirklich existieren
        print("📌 Überprüfe Admin-User...")
        ensure_admin_user()

        print("✅ Datenbank-Initialisierung abgeschlossen.")
    except OperationalError as e:
        print(f"❌ Datenbankverbindung fehlgeschlagen: {e}")
    except Exception as e:
        print(f"❌ Fehler beim Initialisieren der Datenbank: {e}")
    finally:
        db.close()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


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
                is_verified=True
            )
            db.add(admin_user)
            db.commit()
            print("✅ Admin-User wurde erfolgreich erstellt.")
        else:
            print("✅ Admin-User existiert bereits.")
    except Exception as e:
        db.rollback()  # Wichtige Verbesserung!
        print(f"❌ Fehler beim Erstellen des Admin-Users: {e}")
    finally:
        db.close()


