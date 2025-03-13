from datetime import datetime, timezone
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models import Market, MarketChange, MarketCluster, Product, ProductChange
from scraper.first_page_amazon_scraper import AmazonFirstPageScraper


class Market_Orchestrator():
    def __init__(self):
        pass
            
    def get_latest_market_change(self, db: Session, market_id: int):
        """ Holt den letzten MarketChange für einen Markt """
        return db.query(MarketChange).filter(MarketChange.market_id == market_id).order_by(MarketChange.change_date.desc()).first()

    def fetch_current_market_data(self, keyword: str):
        """ Holt aktuelle Marktdaten von Amazon """
        scraper = AmazonFirstPageScraper(headless=True, show_details=False)
        return scraper.get_first_page_data(keyword)

    def detect_changes(self, old_data, new_data):
        """ Vergleicht MarketChange-Daten und gibt eine Liste der Änderungen zurück """
        changes = []

        # Neue Produkte finden
        old_asins = set(old_data.new_products.split(",")) if old_data and old_data.new_products else set()
        new_asins = set(p["asin"] for p in new_data["first_page_products"]) if new_data["first_page_products"] else set()
        added_asins = new_asins - old_asins
        removed_asins = old_asins - new_asins

        if added_asins:
            changes.append(f"Neue Produkte hinzugefügt: {', '.join(added_asins)}")
        if removed_asins:
            changes.append(f"Produkte entfernt: {', '.join(removed_asins)}")

        # Top-Suchvorschläge vergleichen
        old_suggestions = set(old_data.get_top_suggestions()) if old_data else set()
        new_suggestions = set(new_data["top_search_suggestions"]) if new_data["top_search_suggestions"] else set()

        if old_suggestions != new_suggestions:
            changes.append(f"Neue Top-Suchvorschläge: {', '.join(new_suggestions - old_suggestions)}")
            changes.append(f"Entfernte Top-Suchvorschläge: {', '.join(old_suggestions - new_suggestions)}")

        return changes, added_asins, removed_asins, new_suggestions

    def update_market_changes(self):
        """ Überprüft alle Märkte und erstellt neue MarketChanges bei Änderungen """
        db = SessionLocal()
        try:
            print("🚀 Starte MarketChange-Update...")

            markets = db.query(Market).all()
            if not markets:
                print("⚠️ Keine Märkte gefunden.")
                return

            for market in markets:
                print(f"\n🔍 Überprüfe Markt: {market.keyword}")
                old_market_change = self.get_latest_market_change(db, market.id)
                new_data = self.fetch_current_market_data(market.keyword)

                if not new_data:
                    print(f"❌ Keine Daten für {market.keyword} erhalten. Überspringe...")
                    continue

                changes, added_asins, removed_asins, new_suggestions = self.detect_changes(old_market_change, new_data)

                if not changes:
                    print(f"✅ Kein MarketChange für {market.keyword} erkannt.")
                    continue

                print(f"⚡ Änderungen für {market.keyword} erkannt: {', '.join(changes)}")

                # Neuen MarketChange erstellen
                new_market_change = MarketChange(
                    market_id=market.id,
                    change_date=datetime.now(timezone.utc),
                    new_products=",".join(added_asins),
                    removed_products=",".join(removed_asins),
                    top_suggestions=",".join(new_suggestions),
                    changes=" | ".join(changes)
                )

                db.add(new_market_change)

                # Neue Produkte anlegen/verknüpfen
                for product_data in new_data["first_page_products"]:
                    product = db.query(Product).filter(Product.asin == product_data["asin"]).first()

                    if not product:
                        product = Product(asin=product_data["asin"])
                        db.add(product)
                        db.commit()
                        db.refresh(product)

                    market.products.append(product)
                    new_market_change.products.append(product)

                    # ProductChange speichern
                    new_product_change = ProductChange(
                        asin=product.asin,
                        title=product_data.get("title", None),
                        price=product_data.get("price") if isinstance(product_data.get("price"), (int, float)) else None,
                        main_category=product_data.get("main_category", None),
                        second_category=product_data.get("second_category", None),
                        main_category_rank=product_data.get("main_category_rank", None),
                        second_category_rank=product_data.get("second_category_rank", None),
                        img_path=product_data.get("image", None),
                        change_date=datetime.now(timezone.utc),
                        changes="Initial Creation by Orchestrator"
                    )
                    db.add(new_product_change)
                    product.product_changes.append(new_product_change)

                db.commit()
                print(f"✅ Neuer MarketChange für {market.keyword} gespeichert.")

        except Exception as e:
            db.rollback()
            print(f"❌ Fehler bei MarketChange-Update: {e}")

        finally:
            db.close()

    def update_total_revenue(self):
        """ Berechnet und aktualisiert den total_revenue für den letzten MarketChange jedes Markets. """
        db = SessionLocal()
        try:
            print("🚀 Starte Update von total_revenue für alle Märkte...")

            markets = db.query(Market).all()
            if not markets:
                print("⚠️ Keine Märkte gefunden.")
                return

            for market in markets:
                print(f"\n🔍 Berechne Total Revenue für Markt: {market.keyword}")

                # Letzten MarketChange für diesen Markt holen
                last_market_change = self.get_latest_market_change(db, market.id)

                if not last_market_change:
                    print(f"⚠️ Kein MarketChange für Markt '{market.keyword}' gefunden. Überspringe...")
                    continue

                # Alle mit dem MarketChange verknüpften Produkte holen
                relevant_products = last_market_change.products

                total_revenue = 0  # Startwert für die Summierung

                for product in relevant_products:
                    # Letzten ProductChange für das Produkt holen
                    last_product_change = (
                        db.query(ProductChange)
                        .filter(ProductChange.asin == product.asin)
                        .order_by(ProductChange.change_date.desc())
                        .first()
                    )

                    if last_product_change and last_product_change.total is not None:
                        total_revenue += last_product_change.total
                    else:
                        print(f"⚠️ Produkt {product.asin} hat keinen gültigen total-Wert und wird ignoriert.")

                # total_revenue im letzten MarketChange aktualisieren
                last_market_change.total_revenue = total_revenue
                db.commit()

                print(f"✅ Total Revenue für Markt '{market.keyword}' aktualisiert: {total_revenue}")

        except Exception as e:
            db.rollback()
            print(f"❌ Fehler beim Update des total_revenue: {e}")

        finally:
            db.close()
    
    def update_market_cluster_total_revenue(self):
        """ Berechnet und aktualisiert den total_revenue für jedes MarketCluster. """
        db = SessionLocal()
        try:
            print("\n🚀 Starte Update von total_revenue für alle MarketCluster...")

            clusters = db.query(MarketCluster).all()
            if not clusters:
                print("⚠️ Keine MarketCluster gefunden.")
                return

            for cluster in clusters:
                print(f"\n🔍 Berechne Total Revenue für Cluster: {cluster.title}")

                total_revenue = 0  # Startwert für die Summierung

                for market in cluster.markets:
                    # Letzten MarketChange für diesen Markt holen
                    last_market_change = (
                        db.query(MarketChange)
                        .filter(MarketChange.market_id == market.id)
                        .order_by(MarketChange.change_date.desc())
                        .first()
                    )

                    if last_market_change and last_market_change.total_revenue is not None:
                        total_revenue += last_market_change.total_revenue
                    else:
                        print(f"⚠️ Kein gültiger total_revenue für Markt '{market.keyword}', wird ignoriert.")

                # total_revenue im MarketCluster aktualisieren
                cluster.total_revenue = total_revenue
                db.commit()

                print(f"✅ Total Revenue für Cluster '{cluster.title}' aktualisiert: {total_revenue}")

        except Exception as e:
            db.rollback()
            print(f"❌ Fehler beim Update des total_revenue für MarketCluster: {e}")

        finally:
            db.close()


if __name__ == "__main__":
    orchestrator = Market_Orchestrator()
    #orchestrator.update_market_changes()
    orchestrator.update_total_revenue()
    orchestrator.update_market_cluster_total_revenue()
