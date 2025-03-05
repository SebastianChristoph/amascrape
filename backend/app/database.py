from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.models import Base, User
from app.auth import get_password_hash
import os

# Lade Umgebungsvariablen
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///users.db")

# Datenbank-Engine erstellen
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})

# SessionFactory erstellen
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 📌 Dependency für FastAPI → Stellt eine DB-Session bereit
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 📌 Datenbank und Tabellen initialisieren
def init_db():
    Base.metadata.create_all(bind=engine)
    init_admin_user()  # Admin-User erstellen

# 📌 Prüft, ob Admin existiert, und erstellt ihn falls nötig
def init_admin_user():
    db = SessionLocal()
    admin_user = db.query(User).filter(User.username == "admin").first()

    if not admin_user:
        hashed_password = get_password_hash("admin123")
        new_admin = User(username="admin", hashed_password=hashed_password)
        db.add(new_admin)
        db.commit()
        db.refresh(new_admin)
        print("✅ Admin-Benutzer wurde erstellt!")

    db.close()
