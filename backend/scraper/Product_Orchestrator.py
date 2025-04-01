import logging
from pathlib import Path
import shutil
import sys
import time
from datetime import date, datetime, timezone
from statistics import mean
import uuid
import platform

from sqlalchemy import or_, func
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from sqlalchemy.orm import Session

import scraper.selenium_config as selenium_config
from app.database import SessionLocal
from app.models import Market, MarketCluster, Product, ProductChange, market_products
from scraper.product_selenium_scraper import AmazonProductScraper, OutOfStockException

from collections import Counter

class Product_Orchestrator:
    def __init__(self, just_scrape_3_products=False, cluster_to_scrape=None, show_details=False):

        
        self.just_scrape_3_products = just_scrape_3_products
        self.scraping_times = []
        self.start_time = None
        self.failed_products = []
        self.cluster_to_scrape = cluster_to_scrape
        self.show_details = show_details

        # ⏰ Timestamp für Datei-Namen
        self.timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        self.log_file = f"scraping-{self.timestamp}.txt"
        self.fail_file = f"fails-{self.timestamp}.txt"

        LOGS_DIR = Path(__file__).resolve().parent / "logs"
        LOGS_DIR.mkdir(exist_ok=True)

        self.log_file = LOGS_DIR / f"scraping-{self.timestamp}.txt"
        self.fail_file = LOGS_DIR / f"fails-{self.timestamp}.txt"
        self.warning_products = []
        self.warning_file = LOGS_DIR / f"warnings-{self.timestamp}.txt"


        # 🧾 Logging konfigurieren
        logging.basicConfig(
            level=logging.DEBUG if self.show_details else logging.INFO,
            format="%(asctime)s [%(levelname)s] %(message)s",
            handlers=[
                logging.FileHandler(self.log_file, mode="a", encoding="utf-8"),
                logging.StreamHandler(sys.stdout)
            ]
        )

        logging.info("🚀 Product Orchestrator gestartet.")
      

         # Entferne DEBUG-Logs von Selenium & Co.
        logging.getLogger("selenium.webdriver.remote.remote_connection").setLevel(logging.WARNING)
        logging.getLogger("urllib3").setLevel(logging.WARNING)
        logging.getLogger("seleniumwire").setLevel(logging.WARNING)
        logging.getLogger("httpcore").setLevel(logging.WARNING)
        logging.getLogger("httpx").setLevel(logging.WARNING)

        # 🌍 WebDriver konfigurieren
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

        unique_id = uuid.uuid4().hex
        chrome_options.add_argument(f'--user-data-dir=/tmp/chrome-user-data-{cluster_to_scrape}-{unique_id}')

        if platform.system() == "Windows":
            service = Service(ChromeDriverManager().install())
        else:
            chromedriver_path = shutil.which("chromedriver")
            if not chromedriver_path:
                raise FileNotFoundError("❌ Kein chromedriver gefunden.")
            service = Service(executable_path=chromedriver_path)

        self.driver = webdriver.Chrome(service=service, options=chrome_options)
        logging.info(f"🔧 Verwende ChromeDriver: {service.path}")
        self.scraper = AmazonProductScraper(self.driver, show_details=show_details)
        self.scraper.warning_callback = self.add_warning


        self.check_connection()
        self.set_cookies()

    def add_warning(self, asin, url, message, location=None,  warning_type="unknown"):
        self.warning_products.append({
            'asin': asin,
            'url': url,
            'message': message,
            'location': location or "Unknown",
            'type': warning_type
        })

    def write_warning_file(self):

        with open(self.warning_file, 'w', encoding='utf-8') as f:
            f.write(f"⚠️ Warnungen beim Scraping – {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write("=" * 60 + "\n")

            counter = Counter(w["type"] for w in self.warning_products)
            f.write(f"🧾 Übersicht:\n")
            f.write(f"  • {len(self.warning_products)} Produkte betroffen\n")
            f.write(f"  • {sum(counter.values())} Warnungen insgesamt\n")
            for category, count in counter.most_common():
                f.write(f"    - {count} × {category.upper()}\n")
            f.write("\n" + "=" * 60 + "\n\n")

            for warn in self.warning_products:
                f.write(f"🧾 ASIN: {warn['asin']}\n")
                f.write(f"🔗 URL: {warn['url']}\n")
                f.write(f"⚠️ Fehler: {warn['message']}\n")
                f.write(f"📍 Location: {warn.get('location', 'Unknown')}\n")
                f.write(f"🔖 Typ: {warn.get('type', 'unknown')}\n")
                f.write("-" * 60 + "\n\n")


    
    def summarize_warnings(self):
        counter = Counter(w["type"] for w in self.warning_products)
        total = sum(counter.values())
        summary_lines = [f"⚠️ {total} Warnungen insgesamt:"]
        for category, count in counter.most_common():
            summary_lines.append(f"  • {count} × {category.upper()}")
        return "\n".join(summary_lines)


    def format_time(self, seconds):
        minutes, seconds = divmod(seconds, 60)
        return f"{int(minutes)}m {int(seconds)}s"

    def check_connection(self):
        try:
            self.driver.get("https://www.amazon.com")
            logging.info("✅ Verbindung zu Amazon erfolgreich!")
        except Exception as e:
            logging.error(f"❌ Fehler beim Verbinden: {e}")

    def set_cookies(self):
        try:
            self.driver.get("https://www.amazon.com")
            for cookie in selenium_config.cookies:
                self.driver.add_cookie(cookie)
            logging.info("🍪 Cookies erfolgreich gesetzt.")
        except Exception as e:
            logging.error(f"❌ Fehler beim Setzen der Cookies: {e}")

    def get_latest_product_change(self, db: Session, asin):
        return (
            db.query(ProductChange)
            .filter(ProductChange.asin == asin)
            .order_by(ProductChange.change_date.desc())
            .first()
        )

    def detect_product_changes(self, old_data, new_data):
        changes = []
        changed_fields = {}

        fields = [
            "title", "price", "main_category", "second_category",
            "main_category_rank", "second_category_rank", "img_path",
            "blm", "total", "store", "manufacturer"
        ]

        for field in fields:
            old = getattr(old_data, field, None) if old_data else None
            new = new_data.get(field, None)

            # Debug-Log zum Vergleich der Werte und Typen
            logging.debug(f"Vergleiche Feld '{field}': OLD={old} ({type(old)}) vs NEW={new} ({type(new)})")

            # Typensicher vergleichen – optional beide casten für stringbasierte Gleichheit
            if new is not None and old != new:
                changes.append(field)
                changed_fields[field] = new

        return changes, changed_fields


    def should_skip_product(self, product):
        if product.last_time_scraped and product.last_time_scraped.date() == date.today():
            logging.info(f"⏭️ {product.asin} wurde heute bereits gescraped – überspringe.")
            return True
        return False

    def update_products(self):
        db = SessionLocal()
        scraped_asins = set()
        self.start_time = time.time()
        self.failed_products = []

        try:
            logging.info("📦 Starte Produktscraping...")

            if self.cluster_to_scrape is None:
                products = db.query(Product).filter(
                or_(
                    Product.last_time_scraped == None,
                    func.date(Product.last_time_scraped) != date.today()
                )
            ).all()
                
            else:
                markets = db.query(Market).join(
                    MarketCluster.markets
                ).filter(MarketCluster.id == self.cluster_to_scrape).all()

                if not markets:
                    logging.warning(f"⚠️ Keine Märkte im Cluster {self.cluster_to_scrape}")
                    return

                market_ids = [market.id for market in markets]
                products = db.query(Product).join(
                    market_products, market_products.c.asin == Product.asin
                ).filter(
                    market_products.c.market_id.in_(market_ids)
                ).distinct().all()

            if self.just_scrape_3_products:
                products = products[:3]

            total_products = len(products)
            if total_products == 0:
                self.close_driver()
                logging.warning("ALL PRODUCTS ARE SCRAPED TODAY")
                return 
            
            for index, product in enumerate(products, start=1):
                if product.asin in scraped_asins or self.should_skip_product(product):
                    continue

                logging.info("\n\n" + "="*80)
                logging.info(f"📦 [{index}/{total_products}] Scrape Produkt: {product.asin}")
                logging.info("="*80 + "\n")

                try:
                    start = time.time()
                    last = self.get_latest_product_change(db, product.asin)
                    data = self.scraper.get_product_infos(product.asin)
                    self.scraping_times.append(time.time() - start)

                    if not data:
                        reason = "Complete scrape failed"
                        logging.warning(f"❌ {reason} für {product.asin}")
                        self.failed_products.append({
                            'asin': product.asin,
                            'url': f"https://www.amazon.com/dp/{product.asin}?language=en_US",
                            'missing': [reason],
                            'context': "Scraper returned None"
                        })
                    else:
                        changes, _ = self.detect_product_changes(last, data)
                        if changes:
                            logging.info(f" ⚡ Änderungen: {', '.join(changes)}")

                            pc = ProductChange(
                                asin=product.asin,
                                title=data.get("title"),
                                price=data.get("price"),
                                main_category=data.get("main_category"),
                                second_category=data.get("second_category"),
                                main_category_rank=data.get("rank_main_category"),
                                second_category_rank=data.get("rank_second_category"),
                                img_path=data.get("image_url"),
                                blm=data.get("blm"),
                                total=data.get("total"),
                                store=data.get("store"),
                                manufacturer=data.get("manufacturer"),
                                change_date=datetime.now(timezone.utc),
                                changes=" | ".join(changes)
                            )
                            db.add(pc)
                            product.product_changes.append(pc)

                    product.last_time_scraped = datetime.now(timezone.utc)
                    db.commit()
                    scraped_asins.add(product.asin)

                except OutOfStockException as e:
                    logging.warning(f"🚫 {product.asin} ist out of stock: {e}")
                    product.last_time_scraped = datetime.now(timezone.utc)
                    db.commit()
                    self.failed_products.append({
                        'asin': product.asin,
                        'url': f"https://www.amazon.com/dp/{product.asin}",
                        'missing': ["Out of stock"],
                        'context': str(e)
                    })

                except Exception as e:
                    logging.error(f"❌ Fehler bei {product.asin}: {e}")
                    product.last_time_scraped = datetime.now(timezone.utc)
                    db.commit()
                    self.failed_products.append({
                        'asin': product.asin,
                        'url': f"https://www.amazon.com/dp/{product.asin}",
                        'missing': ["Exception"],
                        'context': str(e)
                    })

            # Fehler-Log schreiben
            if self.failed_products:
                with open(self.fail_file, 'a', encoding='utf-8') as f:
                    f.write(f"❌ Scraping Fehler – {datetime.now()}\n")
                    f.write("=" * 60 + "\n")
                    for fail in self.failed_products:
                        f.write(f"🧾 ASIN: {fail['asin']}\n")
                        f.write(f"🔗 URL: {fail['url']}\n")
                        f.write(f"🚫 Grund: {', '.join(fail['missing'])}\n")
                        f.write(f"⚠️ Kontext: {fail.get('context', 'Unbekannter Fehler')}\n")
                        f.write("-" * 60 + "\n\n")

        finally:
            total_time = time.time() - self.start_time
            avg_time = mean(self.scraping_times) if self.scraping_times else 0
            logging.info("##############################################################################")
            logging.info("##############################################################################")
            logging.info("\n📊 Scraping abgeschlossen:")
            logging.info(f"⏱️ Gesamtzeit: {self.format_time(total_time)}")
            logging.info(f"⏲️ Durchschnitt pro Produkt: {avg_time:.2f}s")
            logging.info(f"📦 Erfolgreich: {len(scraped_asins)}")
            logging.info(f"❌ Fehlgeschlagen: {len(self.failed_products)}")
            logging.info(f"📝 Log-Datei: {self.log_file}")
            logging.info(f"🧨 Fehlgeschlagene Produkte: {self.fail_file}")
            if self.warning_products:
                logging.info(f"⚠️ Warnungen: {len(self.warning_products)} Produkte betroffen")
                logging.info(self.summarize_warnings())
                logging.info(f"📄 Warnings-Log: {self.warning_file}")
                self.write_warning_file()

            db.close()
            self.close_driver()

           


    def close_driver(self):
        logging.info("🔻 Schließe WebDriver...")
        self.driver.quit()
        logging.info("✅ WebDriver beendet.")


if __name__ == "__main__":
    orchestrator = Product_Orchestrator(just_scrape_3_products=False, show_details=True)
    orchestrator.update_products()
