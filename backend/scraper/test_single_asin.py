import logging
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import scraper.selenium_config as selenium_config
from scraper.product_selenium_scraper import AmazonProductScraper

# Logging-Konfiguration
logging.basicConfig(level=logging.INFO, format='%(message)s')

def test_asin(asin):
    """Testet einen einzelnen ASIN mit dem AmazonProductScraper."""
    logging.info(f"Starte Test für ASIN: {asin}")
    
    chrome_options = Options()
    #chrome_options.add_argument("--headless=new")
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
    
    try:
        driver = webdriver.Chrome(options=chrome_options)
        scraper = AmazonProductScraper(driver, show_details=True)
        
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
        driver.quit()
        logging.info("\n✅ WebDriver geschlossen.")

if __name__ == "__main__":
    while True:
        asin = input("Bitte geben Sie eine ASIN ein [default ist B008PAIDO2]: ").strip()
        if asin == "":
            asin = "B008PAIDO2"
        test_asin(asin)
        repeat = input("Möchten Sie eine weitere ASIN testen? (ja/nein): ").strip().lower()
        if repeat != "ja":
            logging.info("Beende das Programm.")
            break