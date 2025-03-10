from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Product, Market, MarketCluster, ProductChange, MarketChange
import os
import random
import string
from datetime import datetime, timedelta
from sqlalchemy.orm.exc import StaleDataError
from dotenv import load_dotenv
from sqlalchemy.sql import text

from app.auth import get_password_hash

# Lade die .env-Datei
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set in environment variables!")

print(f"✅ Loaded DATABASE_URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Erstellt die Datenbank & löscht alte Daten"""
    print("🔄 Lösche und erstelle alle Tabellen neu...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("✅ Datenbanktabellen erfolgreich erstellt!")
    
def get_db():
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 📌 Testbenutzer erstellen (🔥 MUSS vor `init_db()` stehen!)
def init_test_users():
    db = SessionLocal()
    try:
        test_users = [
            {"username": "Tester1", "password": "test123"},
            {"username": "Tester2", "password": "test123"},
        ]

        for user in test_users:
            existing_user = db.query(User).filter(User.username == user["username"]).first()
            if not existing_user:
                hashed_password = get_password_hash(user["password"])
                new_user = User(username=user["username"], hashed_password=hashed_password)
                db.add(new_user)
                db.commit()
                db.refresh(new_user)
                print(f"✅ Benutzer {user['username']} wurde erstellt!")

    except Exception as e:
        db.rollback()
        print(f"❌ Fehler beim Erstellen der Testbenutzer: {e}")

    finally:
        db.close()

# 📌 Zufällige ASINs generieren (Amazon Standard Identification Number)
def generate_asin():
    """Erzeugt eine zufällige 10-stellige ASIN."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))


# 🏗️ Initialisierung der Datenbank mit `drop_all()`
# 📌 Märkte, MarketChanges & ProductChanges erstellen
def init_products_and_markets():
    db = SessionLocal()
    try:
        print("📌 Initialisiere Produkte & Märkte...")

        # ✅ Produkte erstellen, falls sie noch nicht existieren
        if db.query(Product).count() == 0:
            all_products = [Product(asin=generate_asin()) for _ in range(50)]
            db.add_all(all_products)
            db.commit()
        else:
            all_products = db.query(Product).all()

        # ✅ FIX: Stelle sicher, dass `markets` immer existiert
        markets = []

        # ✅ Märkte erstellen, falls sie noch nicht existieren
        if db.query(Market).count() == 0:
            market1 = Market(keyword="creatine")
            market2 = Market(keyword="turf grass")
            db.add_all([market1, market2])
            db.commit()
            markets = [market1, market2]  # ✅ Nach dem Erstellen zuweisen
        else:
            markets = db.query(Market).all()  # ✅ Falls sie existieren, abrufen

        # ✅ Produkte den Märkten zuweisen
        for market in markets:
            market.products = random.sample(all_products, k=random.randint(10, 15))
        db.commit()
        print("✅ Produkte wurden Märkten zugewiesen!")

        # ✅ FIX: Einen MarketCluster erstellen und mit Benutzer + Märkten verknüpfen
        tester1 = db.query(User).filter(User.username == "Tester1").first()
        tester2 = db.query(User).filter(User.username == "Tester2").first()

        if tester1 and markets:
            cluster1 = MarketCluster(user_id=tester1.id, title="Fitness & Health Markets", markets=markets)
            db.add(cluster1)
            db.commit()
            print(f"✅ MarketCluster '{cluster1.title}' für Tester1 mit {len(markets)} Märkten erstellt!")

        if tester2 and markets:
            cluster2 = MarketCluster(user_id=tester2.id, title="General Markets", markets=markets)
            db.add(cluster2)
            db.commit()
            print(f"✅ MarketCluster '{cluster2.title}' für Tester2 mit {len(markets)} Märkten erstellt!")

        # ✅ MarketChanges für jeden Markt erstellen
        possible_suggestions = ["protein", "vitamins", "creatine", "energy drink", "running shoes", "gym bag", "supplements"]

        for market in markets:
            existing_changes = db.query(MarketChange).filter(MarketChange.market_id == market.id).count()
            if existing_changes == 0:
                num_changes = random.randint(3, 4)
                changes = []
                for _ in range(num_changes):
                    change_date = datetime.now() - timedelta(days=random.randint(1, 30))
                    new_products = random.sample(all_products, k=random.randint(5, 10))
                    removed_products = random.sample(all_products, k=random.randint(1, 4))
                    random_revenue = round(random.uniform(1000.0, 5000.0), 2)
                    top_suggestions = random.sample(possible_suggestions, k=random.randint(3, 5))

                    changes.append(MarketChange(
                        market_id=market.id,
                        change_date=change_date,
                        products=new_products,
                        total_revenue=random_revenue,
                        new_products=",".join([p.asin for p in new_products]),
                        removed_products=",".join([p.asin for p in removed_products]),
                        top_suggestions=",".join(top_suggestions)  # 🔥 Top-Suggestions speichern
                    ))

                db.add_all(changes)
                db.commit()
                print(f"✅ {num_changes} MarketChanges für Markt '{market.keyword}' erstellt!")

    except Exception as e:
        db.rollback()
        print(f"❌ Fehler in init_products_and_markets: {e}")

    finally:
        db.close()
