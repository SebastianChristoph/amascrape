import sys
import os
from datetime import datetime, timezone
import time
import logging
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Product, ProductChange
from scraper.product_selenium_scraper import AmazonProductScraper
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import scraper.selenium_config as selenium_config

# 🌍 Globale Log-Datei einrichten
log_file = "scraping_log.txt"

# Logging konfigurieren (schreibt in Datei & zeigt im Terminal an)
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(log_file, mode="w", encoding="utf-8"),  # In Datei schreiben
        logging.StreamHandler(sys.stdout)  # Gleichzeitig im Terminal ausgeben
    ]
)

class Product_Orchestrator:
    def __init__(self, just_scrape_3_products=False):
        """Initialisiert den Orchestrator und setzt den WebDriver einmalig auf."""
        self.just_scrape_3_products = just_scrape_3_products

        logging.info("🚀 Product Orchestrator gestartet.")

        # 🌍 Chrome WebDriver mit Optionen starten
        chrome_options = Options()
        chrome_options.add_argument("--headless=new")  
        chrome_options.add_argument("--disable-gpu")  
        chrome_options.add_argument("--window-size=1920,1080")  
        chrome_options.add_argument("--no-sandbox")  
        chrome_options.add_argument("--disable-dev-shm-usage")  
        chrome_options.add_argument("--disable-software-rasterizer")  
        chrome_options.add_argument("--disable-gpu-rasterization")  
        chrome_options.add_argument("--enable-unsafe-webgl")  
        chrome_options.add_argument("--enable-unsafe-swiftshader")  
        chrome_options.add_argument("--mute-audio")  
        chrome_options.add_argument("--ignore-certificate-errors")  
        chrome_options.add_argument("--allow-running-insecure-content")  
        chrome_options.add_argument("--disable-web-security")  
        chrome_options.add_argument("--log-level=3")  
        chrome_options.add_argument(f"user-agent={selenium_config.user_agent}")  

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
            logging.info("✅ Verbindung zu Amazon erfolgreich hergestellt!")
        except Exception as e:
            logging.error(f"❌ Fehler beim Verbinden mit Amazon: {e}")

    def set_cookies(self):
        """Setzt die gespeicherten Cookies."""
        logging.info("🍪 Setze Cookies...")
        for cookie in selenium_config.cookies:
            self.driver.add_cookie(cookie)
        logging.info("✅ Cookies gesetzt!")

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

        title_changed = False  # Flag für Titel-Änderung

        for field in product_fields:
            old_value = getattr(old_data, field, None) if old_data else None
            new_value = new_data.get(field, None)

            if new_value is None and old_value is not None:
                continue  

            if new_value != old_value:
                if field == "title":
                    title_changed = True  # Setze das Flag für Title-Änderung
                else:
                    changes.append(f"{field} geändert: {old_value} → {new_value}")
                
                changed_fields[field] = new_value

        # Falls Title geändert wurde, füge "title changed" hinzu
        if title_changed:
            changes.insert(0, "title changed")  # Titel-Änderung soll am Anfang stehen

        return changes, changed_fields


    def update_products(self):
        """Scraped alle Produkte nacheinander und schließt den WebDriver danach."""
        db = SessionLocal()
        scraped_asins = set()

        try:
            logging.info("🚀 Starte Product-Update...")

            products = db.query(Product).all()
            if not products:
                logging.warning("⚠️ Keine Produkte gefunden.")
                return

            if self.just_scrape_3_products:
                products = products[:3]

            total_products = len(products)
            for index, product in enumerate(products, start=1):
                if product.asin in scraped_asins:
                    logging.info(f"⏩ ASIN {product.asin} wurde bereits gescraped, überspringe...")
                    continue

                logging.info(f"\n🔍 Überprüfe Produkt [{index}/{total_products}]: {product.asin} https://www.amazon.com/dp/{product.asin}?language=en_US")


                try:
                    last_product_change = self.get_latest_product_change(db, product.asin)
                    new_data = self.scraper.get_product_infos(product.asin)

                    if not new_data:
                        logging.warning(f"❌ Fehler beim Scrapen von {product.asin}, überspringe...")
                        continue  

                    changes, changed_fields = self.detect_product_changes(last_product_change, new_data)

                    if not changes:
                        logging.info(f"✅ Keine Änderungen für {product.asin}.")
                    else:
                        logging.info(f"⚡ Änderungen erkannt für {product.asin}: {', '.join(changes)}")
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

                    logging.info(f"✅ last_time_scraped für {product.asin} aktualisiert.")

                    scraped_asins.add(product.asin)

                except Exception as e:
                    logging.error(f"❌ Fehler beim Scrapen von {product.asin}: {e}")
                    continue  

        except Exception as e:
            logging.critical(f"❌ Schwerwiegender Fehler im Product-Update: {e}")
        finally:
            db.close()
            self.close_driver()

    def close_driver(self):
        """Schließt den WebDriver nach dem Scraping."""
        logging.info("\n🔻 Schließe WebDriver...")
        self.driver.quit()
        logging.info("✅ WebDriver geschlossen.")

if __name__ == "__main__":
    orchestrator = Product_Orchestrator(just_scrape_3_products=False)
    orchestrator.update_products()
