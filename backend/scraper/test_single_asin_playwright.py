import logging
import time
from playwright.sync_api import sync_playwright
import selenium_config as selenium_config
from product_playwright_scraper import AmazonProductScraper

# Logging-Konfiguration
logging.basicConfig(level=logging.DEBUG, format='%(message)s')

def test_asin(asin):
    """Testet einen einzelnen ASIN mit dem AmazonProductScraper."""
    logging.info(f"Starte Test für ASIN: {asin}")
    
    try:
        with sync_playwright() as p:
            # Browser-Konfiguration
            browser = p.chromium.launch(
                headless=True,  # Headless mode aktiviert
                args=[
                    "--disable-gpu",
                    "--no-sandbox",
                    "--disable-dev-shm-usage",
                    "--disable-software-rasterizer",
                    "--disable-gpu-rasterization",
                    "--enable-unsafe-webgl",
                    "--enable-unsafe-swiftshader",
                    "--mute-audio",
                    "--ignore-certificate-errors",
                    "--allow-running-insecure-content",
                    "--disable-web-security",
                    "--window-size=1920,1080"
                ]
            )
            
            context = browser.new_context(
                user_agent=selenium_config.user_agent,
                viewport={"width": 1920, "height": 1080}
            )
            
            page = context.new_page()
            
            # Setze Cookies mit Domain und Path
            cookies = []
            for cookie in selenium_config.cookies:
                cookies.append({
                    "name": cookie["name"],
                    "value": cookie["value"],
                    "domain": ".amazon.com",
                    "path": "/"
                })
            context.add_cookies(cookies)
            
            # Initialisiere Scraper
            scraper = AmazonProductScraper(page, show_details=True)
            
            # Führe Scraping durch
            start_time = time.time()
            product_data = scraper.get_product_infos(asin)
            end_time = time.time()
            
            if product_data:
                logging.info("\n✅ Produkt erfolgreich gescraped!")
                logging.info("\nProduktinformationen:")
                for key, value in product_data.items():
                    if isinstance(value, str):
                        value = value[:60] + "..." if len(value) > 60 else value
                    logging.info(f"{key}: {value}")
                logging.info(f"⏳ Dauer des Scraping: {end_time - start_time:.2f} Sekunden")
            else:
                logging.error("❌ Test Fail: Fehler beim Scrapen des Produkts!")
                
    except Exception as e:
        logging.error(f"❌ Fehler: {e}")
    finally:
        try:
            context.close()
            browser.close()
        except:
            pass
        logging.info("\n✅ Browser geschlossen.")

if __name__ == "__main__":
    while True:
        asin = input("Bitte geben Sie eine ASIN ein [default ist B095YJW56C]: ").strip()
        if asin == "":
            asin = "B095YJW56C"
        test_asin(asin)
        repeat = input("Möchten Sie eine weitere ASIN testen? (ja/nein): ").strip().lower()
        if repeat != "ja":
            logging.info("Beende das Programm.")
            break 