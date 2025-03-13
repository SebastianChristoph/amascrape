from datetime import datetime, timezone
import time
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product, ProductChange
from scraper.product_selenium_scraper import AmazonProductScraper
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import scraper.selenium_config as selenium_config

# im backend folder: python -m scraper.Product_Orchestrator
class Product_Orchestrator:
    def __init__(self, just_scrape_3_products=False):
        """Initialisiert den Orchestrator und setzt den WebDriver einmalig auf."""
        self.just_scrape_3_products = just_scrape_3_products

        # 🌍 Chrome WebDriver mit Optionen starten
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")  # Neuer Headless-Modus
        chrome_options.add_argument("--disable-gpu")  # GPU deaktivieren
        chrome_options.add_argument("--window-size=1920,1080")  
        chrome_options.add_argument("--no-sandbox")  
        chrome_options.add_argument("--disable-dev-shm-usage")  
        chrome_options.add_argument("--disable-software-rasterizer")  # Blockiert Software-WebGL-Fallback
        chrome_options.add_argument("--disable-gpu-rasterization")  # Verhindert GPU-Rendering-Probleme
        chrome_options.add_argument("--enable-unsafe-webgl")  # WebGL-Fehlermeldungen verhindern
        chrome_options.add_argument("--enable-unsafe-swiftshader")  # WebGL-Fallback aktivieren
        chrome_options.add_argument("--mute-audio")  # Falls Amazon Medien-Fehlermeldungen ausgibt

        # 🔹 SSL-Fehlermeldungen verhindern
        chrome_options.add_argument("--ignore-certificate-errors")  # Ignoriert SSL-Zertifikatsfehler
        chrome_options.add_argument("--allow-running-insecure-content")  # Lässt unsichere Inhalte zu
        chrome_options.add_argument("--disable-web-security")  # Deaktiviert Web-Security
        chrome_options.add_argument("--log-level=3")  # Nur Fehler anzeigen (keine Warnungen)
        chrome_options.add_argument(f"user-agent={selenium_config.user_agent}")  # User-Agent setzen


        self.driver = webdriver.Chrome(options=chrome_options)
        self.scraper = AmazonProductScraper(self.driver, show_details=False)

        # 🏁 Verbindung testen
        self.check_connection()

        # 🍪 Cookies setzen
        self.set_cookies()

    def check_connection(self):
        """Überprüft, ob der WebDriver eine Verbindung herstellen kann."""
        try:
            self.driver.get("https://www.amazon.com")
            print("✅ Verbindung zu Amazon erfolgreich hergestellt!")
        except Exception as e:
            print(f"❌ Fehler beim Verbinden mit Amazon: {e}")

    def set_cookies(self):
        """Setzt die gespeicherten Cookies."""
        print("🍪 Setze Cookies...")
        for cookie in selenium_config.cookies:
            self.driver.add_cookie(cookie)
        print("✅ Cookies gesetzt!")

    def get_latest_product_change(self, db, asin):
        """Holt den letzten ProductChange für ein Produkt anhand der ASIN."""
        return (
            db.query(ProductChange)
            .filter(ProductChange.asin == asin)
            .order_by(ProductChange.change_date.desc())
            .first()
        )

    def detect_product_changes(self, old_data, new_data):
        """Vergleicht alte und neue Produktdaten und gibt Änderungen zurück."""
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
                if field == "title" and not changed_fields:
                    return ["title changed"], {"title": new_value}
                
                changes.append(f"{field} geändert: {old_value} → {new_value}")
                changed_fields[field] = new_value
        
        return changes, changed_fields

    def update_products(self):
        """Scraped alle Produkte nacheinander und schließt den WebDriver danach."""
        db = SessionLocal()
        scraped_asins = set()  # Set zur Vermeidung doppelter ASINs

        try:
            print("🚀 Starte Product-Update...")

            products = db.query(Product).all()
            if not products:
                print("⚠️ Keine Produkte gefunden.")
                return

            if self.just_scrape_3_products:
                products = products[:3]

            for product in products:
                if product.asin in scraped_asins:
                    print(f"⏩ ASIN {product.asin} wurde bereits gescraped, überspringe...")
                    continue  # Diese ASIN wurde bereits verarbeitet

                print(f"\n🔍 Überprüfe Produkt: {product.asin}", f"https://www.amazon.com/dp/{product.asin}?language=en_US")

                try:
                    last_product_change = self.get_latest_product_change(db, product.asin)
                    new_data = self.scraper.get_product_infos(product.asin)

                    if not new_data:
                        print(f"❌ Fehler beim Scrapen von {product.asin}, überspringe...")
                        continue  # Fehlerhaftes Produkt wird übersprungen

                    changes, changed_fields = self.detect_product_changes(last_product_change, new_data)

                    if not changes:
                        print(f"✅ Keine Änderungen für {product.asin}.")
                    else:
                        print(f"⚡ Änderungen erkannt für {product.asin}: {', '.join(changes)}")
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

                    product.last_time_scraped = datetime.now(timezone.utc)
                    db.commit()

                    print(f"✅ last_time_scraped für {product.asin} aktualisiert.")

                    # 🔥 ASIN zur Liste der gescrapeten Produkte hinzufügen
                    scraped_asins.add(product.asin)

                except Exception as e:
                    print(f"❌ Fehler beim Scrapen von {product.asin}: {e}")
                    continue  # Überspringt fehlerhafte ASIN

        except Exception as e:
            print(f"❌ Schwerwiegender Fehler im Product-Update: {e}")
        finally:
            db.close()
            self.close_driver()

    def close_driver(self):
        """Schließt den WebDriver nach dem Scraping."""
        print("\n🔻 Schließe WebDriver...")
        self.driver.quit()
        print("✅ WebDriver geschlossen.")

if __name__ == "__main__":
    orchestrator = Product_Orchestrator(just_scrape_3_products=False)
    orchestrator.update_products()
