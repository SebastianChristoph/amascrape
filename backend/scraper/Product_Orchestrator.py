from datetime import datetime, timezone
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product, ProductChange
from scraper.product_selenium_scraper import AmazonProductScraper

# von backend folder starten:   python -m scraper.Product_Orchestrator

class Product_Orchestrator():
    def __init__(self, just_scrape_3_products=False):
        """ Initialisiert den Orchestrator mit einer Flag für das Testen """
        self.scraper = AmazonProductScraper(headless=False, show_details=True)
        self.just_scrape_3_products = just_scrape_3_products

    def get_latest_product_change(self, db: Session, asin: str):
        """ Holt den letzten ProductChange für ein Produkt anhand der ASIN """
        return (
            db.query(ProductChange)
            .filter(ProductChange.asin == asin)
            .order_by(ProductChange.change_date.desc())
            .first()
        )

    def detect_product_changes(self, old_data: ProductChange, new_data: dict):
        """ Vergleicht alte und neue Produktdaten und gibt Änderungen zurück """
        changes = []
        changed_fields = {}

        product_fields = [
            "title", "price", "main_category", "second_category",
            "main_category_rank", "second_category_rank", "img_path",
            "blm", "total"
        ]

        for field in product_fields:
            old_value = getattr(old_data, field, None) if old_data else None
            new_value = new_data.get(field, None)

            # Null-Werte im neuen Datensatz ignorieren, wenn vorher ein Wert existierte
            if new_value is None and old_value is not None:
                continue  

            # Wenn sich der Wert geändert hat, speichern
            if new_value != old_value:
                changes.append(f"{field} geändert: {old_value} → {new_value}")
                changed_fields[field] = new_value

        return changes, changed_fields

    def update_products(self):
        """ Überprüft alle Produkte und erstellt neue ProductChanges bei Änderungen """
        db = SessionLocal()
        try:
            print("🚀 Starte Product-Update...")

            products = db.query(Product).all()
            if not products:
                print("⚠️ Keine Produkte gefunden.")
                return

            # Falls nur 3 Produkte gescrapt werden sollen, begrenzen
            if self.just_scrape_3_products:
                products = products[:3]

            for product in products:
                print(f"\n🔍 Überprüfe Produkt: {product.asin}")
                #time.sleep(3000)
                # Letzten ProductChange holen
                last_product_change = self.get_latest_product_change(db, product.asin)

                # Produkt mit Scraper abrufen
                new_data = self.scraper.get_product_infos(product.asin)

                if not new_data:
                    print(f"❌ Fehler beim Scrapen von {product.asin}, überspringe...")
                    continue

                # Änderungen erkennen
                changes, changed_fields = self.detect_product_changes(last_product_change, new_data)

                if not changes:
                    print(f"✅ Keine Änderungen für {product.asin}.")
                else:
                    print(f"⚡ Änderungen erkannt für {product.asin}: {', '.join(changes)}")

                    # Neuen ProductChange erstellen
                    new_product_change = ProductChange(
                        asin=product.asin,
                        title=new_data.get("title"),
                        price=new_data.get("price"),
                        main_category=new_data.get("main_category"),
                        second_category=new_data.get("second_category"),
                        main_category_rank=new_data.get("rank_main_category"),
                        second_category_rank=new_data.get("rank_second_category"),
                        img_path=new_data.get("image_url"),
                        blm=new_data.get("blm"),
                        total=new_data.get("total"),
                        change_date=datetime.now(timezone.utc),
                        changes=" | ".join(changes)
                    )

                    db.add(new_product_change)
                    product.product_changes.append(new_product_change)

                # ✅ `last_time_scraped` aktualisieren
                product.last_time_scraped = datetime.now(timezone.utc)
                db.commit()  # Änderungen in der Datenbank speichern

                print(f"✅ `last_time_scraped` für {product.asin} aktualisiert.")

        except Exception as e:
            db.rollback()
            print(f"❌ Fehler beim Product-Update: {e}")

        finally:
            db.close()


if __name__ == "__main__":
    orchestrator = Product_Orchestrator(just_scrape_3_products=True)  # 🛠️ Setze auf True für Testen
    orchestrator.update_products()
