import pytest
import timeit
from scraper.product_selenium_scraper import AmazonProductScraper
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
import scraper.selenium_config as selenium_config

# 🌍 Globaler WebDriver (wird einmalig gestartet und nach Tests geschlossen)
driver = None

# 🏁 Vorbereitungen vor allen Tests (WebDriver einmal starten)
def setup_module(module):
    global driver
    print("\n🚀 Starting Chrome WebDriver for tests...")

    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--disable-gpu")
    chrome_options.add_argument("--window-size=1920,1080")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument(f"user-agent={selenium_config.user_agent}")

    driver = webdriver.Chrome(options=chrome_options)
    driver.get("https://www.amazon.com")  # Verbindung prüfen
    print("✅ WebDriver initialized!")

# 🛑 WebDriver nach den Tests schließen
def teardown_module(module):
    global driver
    print("\n🔻 Closing Chrome WebDriver...")
    driver.quit()
    print("✅ WebDriver closed.")

# 🧪 TEST 1: Scraper mit zufälligen ASINs testen
@pytest.mark.parametrize("asin", selenium_config.random_asins)
def test_random_asins(asin):
    """Testet den Scraper mit zufälligen ASINs.
    
    CMD-Aufruf:
    pytest tests/test_amazon_product_scraper.py -s -k test_random_asins
    """
    print(f"\n🧪 Testing ASIN: {asin}")
    scraper = AmazonProductScraper(driver, show_details=False)

    start_time = timeit.default_timer()
    product = scraper.get_product_infos(asin)
    duration = round(timeit.default_timer() - start_time, 2)

    assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
    assert isinstance(product.get("price"), float) and product["price"] > 0, f"❌ Error: Invalid price for ASIN {asin}!"

    print(f"✅ Test passed! Scraping took {duration} seconds.")

# 🧪 TEST 2: ASINs ohne Produktinformationen testen
@pytest.mark.parametrize("asin", selenium_config.no_product_info)
def test_no_product_info_asins(asin):
    """Testet ASINs, bei denen keine Produktinformationen verfügbar sind.
    
    CMD-Aufruf:
    pytest tests/test_amazon_product_scraper.py -s -k test_no_product_info_asins
    """
    print(f"\n🧪 Testing ASIN with missing product info: {asin}")
    scraper = AmazonProductScraper(driver, show_details=False)

    start_time = timeit.default_timer()
    product = scraper.get_product_infos(asin)
    duration = round(timeit.default_timer() - start_time, 2)

    assert product is None, f"❌ Error: ASIN {asin} should return None, but got {product}"

    print(f"✅ Test passed! ASIN {asin} correctly returned None. Scraping took {duration} seconds.")

# 🧪 TEST 3: ASINs ohne BLM-Wert testen
@pytest.mark.parametrize("asin", selenium_config.no_blms)
def test_no_blms_asins(asin):
    """Testet ASINs ohne `Bought Last Month` Wert.
    
    CMD-Aufruf:
    pytest tests/test_amazon_product_scraper.py -s -k test_no_blms_asins
    """
    print(f"\n🧪 Testing ASIN with missing BLM: {asin}")
    scraper = AmazonProductScraper(driver, show_details=False)

    start_time = timeit.default_timer()
    product = scraper.get_product_infos(asin)
    duration = round(timeit.default_timer() - start_time, 2)

    assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
    assert product.get("blm") in [None, 0], f"❌ Error: ASIN {asin} should have no BLM value!"

    print(f"✅ Test passed! Scraping took {duration} seconds.")

# 🧪 TEST 4: Eine spezifische ASIN testen
def test_specific_asin(asin_param):
    """Testet den Scraper mit einer spezifischen ASIN.
    
    CMD-Aufruf im scraper folder:
    python -m pytest test_amazon_product_scraper.py -s -k test_specific_asin --asin B009EO0FSU
    """
    if not asin_param:
        pytest.fail("❌ Error: No ASIN provided! Use --asin <ASIN> to pass an ASIN.")
    
    print(f"\n🧪 Testing SPECIFIC ASIN: {asin_param}")
    scraper = AmazonProductScraper(driver, show_details=False)

    start_time = timeit.default_timer()
    product = scraper.get_product_infos(asin_param)
    duration = round(timeit.default_timer() - start_time, 2)

    assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin_param} is not a dictionary!"
    assert isinstance(product.get("price"), float) and product.get("price") > 0, f"❌ Error: Invalid price for ASIN {asin_param}!"

    print(f"✅ Test passed! Scraping took {duration} seconds.")

# 🏁 Hook zum Anzeigen der gesamten Scraping-Zeit
@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session, exitstatus):
    print("\n✅ All tests completed!")
