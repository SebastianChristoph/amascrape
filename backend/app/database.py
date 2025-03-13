from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, Product, Market, MarketCluster, ProductChange, MarketChange
import os
import random
import string
from datetime import datetime, timedelta, timezone
from sqlalchemy.exc import OperationalError
from dotenv import load_dotenv
from sqlalchemy.sql import text
from app.auth import get_password_hash

# ✅ Lade Umgebungsvariablen
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("❌ DATABASE_URL is not set in environment variables!")

print(f"✅ Loaded DATABASE_URL: {DATABASE_URL}")

# ✅ Datenbank-Verbindung einrichten
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# ✅ Initialisiert die Datenbank nur, wenn sie leer ist
def init_db():
    """Erstellt die Datenbank-Tabellen nur, wenn sie nicht existieren und fügt Testdaten hinzu."""
    db = SessionLocal()
    try:
        # Prüfen, ob die `users`-Tabelle existiert
        try:
            db.execute(text("SELECT 1 FROM users LIMIT 1"))
            print("✅ Users-Tabelle existiert bereits.")
        except OperationalError:
            print("📌 Keine Tabellen gefunden. Erstelle alle Tabellen...")
            Base.metadata.create_all(bind=engine)  # ✅ Erstellt alle Tabellen
            insert_test_user_data(db)  # ✅ Testdaten einfügen
            return  # Wichtig: Verhindert doppeltes Schließen der Session

        print("✅ Datenbank ist bereits initialisiert.")

    finally:
        db.close()


# ✅ Stellt eine DB-Session bereit
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def ensure_test_users():
    """Fügt Testbenutzer hinzu, auch wenn die DB bereits existiert."""
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

        print("📌 Testbenutzer wurden überprüft & ggf. erstellt.")

    except Exception as e:
        print(f"❌ Fehler beim Einfügen der Testbenutzer: {e}")
    finally:
        db.close()


# ✅ Fügt Testdaten ein, falls die Datenbank neu erstellt wurde
def insert_test_data(db):
    """ Erstellt Testbenutzer, Produkte und Märkte """
    print("🔄 Füge Testdaten hinzu...")

    # Testbenutzer
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

    # Produkte
    all_products = []
    for _ in range(50):
        new_asin = generate_asin()
        yesterday = datetime.now(timezone.utc) - timedelta(1)
        new_product = Product(asin=new_asin, last_time_scraped=yesterday)
        db.add(new_product)
        db.commit()
        db.refresh(new_product)

        blm_rand = random.randint(1, 5)
        price_rand = round(random.uniform(10.0, 100.0), 2)
        total_rand = round(blm_rand * price_rand, 2)

        new_product_change = ProductChange(
            asin=new_product.asin,
            title=f"Produkt {new_asin}",
            price=price_rand,
            main_category="Electronics",
            second_category="Gadgets",
            main_category_rank=random.randint(1, 100),
            second_category_rank=random.randint(1, 200),
            img_path=None,
            change_date=yesterday,
            changes="Initial product creation",
            blm=blm_rand,
            total=total_rand
        )
        db.add(new_product_change)
        db.commit()
        db.refresh(new_product_change)

        new_product.product_changes.append(new_product_change)
        db.commit()

        all_products.append(new_product)
        print(f"✅ `Product` {new_product.asin} mit `ProductChange` erstellt!")

    # Märkte
    markets = []
    if db.query(Market).count() == 0:
        market1 = Market(keyword="creatine")
        market2 = Market(keyword="turf grass")
        db.add_all([market1, market2])
        db.commit()
        markets = [market1, market2]
    else:
        markets = db.query(Market).all()

    # Produkte Märkten zuweisen
    for market in markets:
        market.products = random.sample(all_products, k=random.randint(10, 15))
    db.commit()
    print("✅ Produkte wurden Märkten zugewiesen!")

    # MarketClusters mit Benutzern und Märkten verknüpfen
    tester1 = db.query(User).filter(User.username == "Tester1").first()
    tester2 = db.query(User).filter(User.username == "Tester2").first()

    if tester1 and markets:
        cluster1 = MarketCluster(user_id=tester1.id, title="Fitness & Health Markets", markets=markets)
        db.add(cluster1)
        db.commit()
        print(f"✅ MarketCluster '{cluster1.title}' für Tester1 erstellt!")

    if tester2 and markets:
        cluster2 = MarketCluster(user_id=tester2.id, title="General Markets", markets=markets)
        db.add(cluster2)
        db.commit()
        print(f"✅ MarketCluster '{cluster2.title}' für Tester2 erstellt!")

    # MarketChanges für Märkte erstellen
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
                    changes="Initial creation",
                    total_revenue=random_revenue,
                    new_products=",".join([p.asin for p in new_products]),
                    removed_products=",".join([p.asin for p in removed_products]),
                    top_suggestions=",".join(top_suggestions)
                ))

            db.add_all(changes)
            db.commit()
            print(f"✅ {num_changes} MarketChanges für Markt '{market.keyword}' erstellt!")

    db.close()

# ✅ Generiert zufällige ASINs
def generate_asin():
    """Erzeugt eine zufällige 10-stellige ASIN."""
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=10))
