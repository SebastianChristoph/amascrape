import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Market, MarketChange, MarketCluster, Product, ProductChange
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper

# Logging einrichten
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

class Market_Orchestrator:
    def __init__(self):
        pass

    def get_latest_market_change(self, db: Session, market_id: int):
        """ 🏷️ Holt den letzten MarketChange für einen Markt """
        logging.info(f"📢 Suche letzten MarketChange für Market-ID {market_id}...")
        return db.query(MarketChange).filter(MarketChange.market_id == market_id).order_by(MarketChange.change_date.desc()).first()

    def fetch_current_market_data(self, keyword: str):
        """ 🔍 Holt aktuelle Marktdaten von Amazon """
        logging.info(f"🚀 Starte Scraping für Markt: {keyword}")
        scraper = AmazonFirstPageScraper(headless=True, show_details=True)
        return scraper.get_first_page_data(keyword)

    def calculate_total_revenue(self, db: Session, market: Market, last_market_change: MarketChange):
        """ 💰 Berechnet total_revenue für einen Markt basierend auf den letzten validen Produkt-Daten """
        logging.info(f"💰 Berechne Total Revenue für {market.keyword}...")

        total_revenue = 0
        today = datetime.now(timezone.utc).date()
        has_valid_products = False  # Prüft, ob es wenigstens ein Produkt mit alten Scrape-Daten gibt

        for product in market.products:
            # 1️⃣ Finde den letzten ProductChange, der **NICHT** von heute ist
            last_valid_product_change = db.query(ProductChange) \
                .filter(ProductChange.asin == product.asin, ProductChange.change_date < today) \
                .order_by(ProductChange.change_date.desc()) \
                .first()

            if last_valid_product_change and last_valid_product_change.total is not None:
                logging.info(f"✅ Produkt {product.asin} trägt {last_valid_product_change.total:.2f}€ zum Revenue bei. (Letzter Scrape: {last_valid_product_change.change_date.date()})")
                total_revenue += last_valid_product_change.total
                has_valid_products = True  # Es gibt gültige Umsatzdaten
            else:
                logging.warning(f"⚠️ Kein älterer ProductChange für {product.asin} gefunden. Umsatz nicht berücksichtigt!")

        # 2️⃣ Falls KEIN einziges Produkt eine gültige alte Umsatzberechnung hat
        if not has_valid_products:
            if last_market_change and last_market_change.total_revenue is not None:
                total_revenue = last_market_change.total_revenue
                logging.warning(f"⚠️ Kein einziges Produkt hat alte Umsatzdaten! Übernehme alten MarketChange Revenue: {total_revenue:.2f}€")
            else:
                logging.warning(f"❌ Kein älterer MarketChange Revenue vorhanden! Setze total_revenue auf None.")
                total_revenue = None  # Wichtige Änderung!

        logging.info(f"🏷️ Gesamtumsatz für {market.keyword}: {total_revenue if total_revenue is not None else 'None'}€")
        return total_revenue


    def detect_changes(self, last_market_change, new_data):
        """ 🔄 Vergleicht alte und neue Marktdaten und ermittelt Änderungen """
        logging.info(f"🔎 Vergleiche alte und neue Daten für MarketChange ID {last_market_change.id}")

        added_asins = []
        removed_asins = []
        new_suggestions = []

        old_asins = set(last_market_change.new_products.split(",")) if last_market_change.new_products else set()
        new_asins = set(p["asin"] for p in new_data["first_page_products"])

        added_asins = list(new_asins - old_asins)
        removed_asins = list(old_asins - new_asins)

        old_suggestions = set(last_market_change.top_suggestions.split(",")) if last_market_change.top_suggestions else set()
        new_suggestions = set(new_data["top_search_suggestions"])

        changes = []
        if added_asins:
            logging.info(f"✅ Neue Produkte gefunden: {', '.join(added_asins)}")
            changes.append(f"Neue Produkte: {', '.join(added_asins)}")
        if removed_asins:
            logging.info(f"⚠️ Entfernte Produkte: {', '.join(removed_asins)}")
            changes.append(f"Entfernte Produkte: {', '.join(removed_asins)}")
        if old_suggestions != new_suggestions:
            logging.info(f"⚠️ Änderungen in den Top-Suchvorschlägen erkannt!")
            changes.append("Änderungen in den Top-Suchvorschlägen")

        return changes, added_asins, removed_asins, list(new_suggestions)

    def update_market_changes(self, db: Session, market: Market, new_market_change: MarketChange, new_data, added_asins, removed_asins):
        """ 🔄 Aktualisiert MarketChange mit neuen Produkten und Änderungen """
        logging.info(f"📢 Aktualisiere MarketChange für {market.keyword}...")

        new_market_change.new_products = ",".join(added_asins)
        new_market_change.removed_products = ",".join(removed_asins)
        new_market_change.top_suggestions = ",".join(new_data["top_search_suggestions"])

        # Neue Produkte hinzufügen
        for product_data in new_data["first_page_products"]:
            product = db.query(Product).filter(Product.asin == product_data["asin"]).first()
            if not product:
                logging.info(f"🆕 Neues Produkt {product_data['asin']} wird erstellt.")
                product = Product(asin=product_data["asin"], last_time_scraped=None)
                db.add(product)
                db.commit()
                db.refresh(product)

            if product not in market.products:
                market.products.append(product)
            if product not in new_market_change.products:
                new_market_change.products.append(product)

        # Entfernte Produkte aus Market entfernen
        if removed_asins:
            removed_products = db.query(Product).filter(Product.asin.in_(removed_asins)).all()
            for product in removed_products:
                if product in market.products:
                    market.products.remove(product)
                if product in new_market_change.products:
                    new_market_change.products.remove(product)

        db.commit()
        logging.info(f"✅ MarketChange für {market.keyword} aktualisiert.")

    def update_market_cluster_total_revenue(self):
        """ 🔄 Aktualisiert total_revenue für alle MarketCluster """
        db = SessionLocal()
        try:
            logging.info("📢 Aktualisiere total_revenue für alle MarketCluster...")

            clusters = db.query(MarketCluster).all()
            for cluster in clusters:
                total_revenue = sum(
                    self.get_latest_market_change(db, market.id).total_revenue or 0 for market in cluster.markets
                )
                cluster.total_revenue = total_revenue
                db.commit()
                logging.info(f"✅ Aktualisiertes Revenue für Cluster '{cluster.title}': {total_revenue}")

        except Exception as e:
            db.rollback()
            logging.error(f"❌ Fehler beim Update des total_revenue für MarketCluster: {e}")
        finally:
            db.close()

    def update_market_revenue_and_changes(self):
        """ 🚀 Führt Market-Update durch, berechnet Revenue und prüft Änderungen """
        db = SessionLocal()
        try:
            logging.info("🚀 Starte Market-Revenue-Berechnung und Updates...")

            markets = db.query(Market).all()
            for market in markets:
                logging.info(f"\n🔍 Starte Update für Markt: {market.keyword}")

                last_market_change = self.get_latest_market_change(db, market.id)
                if not last_market_change:
                    logging.warning(f"⚠️ Kein MarketChange für {market.keyword} gefunden! Überspringe...")
                    continue  

                scraped_products = [p for p in market.products if p.last_time_scraped is not None]
                if not scraped_products:
                    logging.info(f"⚠️ Noch keine Scraping-Daten für {market.keyword}. Warte auf Product Orchestrator.")
                    continue  

                # ✅ FIX: Hier wird last_market_change als Parameter übergeben
                new_total_revenue = self.calculate_total_revenue(db, market, last_market_change)

                new_data = self.fetch_current_market_data(market.keyword)
                if not new_data:
                    logging.warning(f"❌ Keine neuen Daten für {market.keyword}, überspringe...")
                    continue  

                changes, added_asins, removed_asins, new_suggestions = self.detect_changes(last_market_change, new_data)

                if new_total_revenue != last_market_change.total_revenue or changes:
                    logging.info(f"⚡ Erstelle neuen MarketChange für {market.keyword}")

                    new_market_change = MarketChange(
                        market_id=market.id,
                        change_date=datetime.now(timezone.utc),
                        total_revenue=new_total_revenue,
                        new_products=",".join(added_asins),
                        removed_products=",".join(removed_asins),
                        top_suggestions=",".join(new_suggestions),
                        changes=" | ".join(changes) if changes else "Kein Total Revenue Change, aber andere Änderungen"
                    )
                    db.add(new_market_change)
                    db.commit()
                    db.refresh(new_market_change)

                    self.update_market_changes(db, market, new_market_change, new_data, added_asins, removed_asins)
                else:
                    logging.info(f"✅ Keine Änderungen für {market.keyword}, MarketChange bleibt unverändert.")

            self.update_market_cluster_total_revenue()
        except Exception as e:
            db.rollback()
            logging.error(f"❌ Fehler bei Market-Revenue-Update: {e}")
        finally:
            db.close()




if __name__ == "__main__":
    orchestrator = Market_Orchestrator()
    orchestrator.update_market_revenue_and_changes()
