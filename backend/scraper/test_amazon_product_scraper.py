import random
import pytest
import timeit
from scraper.product_selenium_scraper import AmazonProductScraper
import scraper.selenium_config as selenium_config

total_duration = 0  # Global variable to track total duration
total_duration_combined = 0  # Separate tracking for this tes

def print_product_info(product):
    """ Prints product information in a structured format. """
    max_key_length = max(len(key) for key in product.keys())
    for key, value in product.items():
        if isinstance(value, str):
            value = value[:60] + "..." if len(value) > 60 else value
        print(f"\t{key.ljust(max_key_length)} : {value}")
# Kombinierte Liste aus allen drei Listen
all_asins = list(set(selenium_config.random_asins + selenium_config.health_and_household_asins + selenium_config.electronics_asins + selenium_config.no_reviews +  selenium_config.no_product_info + selenium_config.no_ranking + selenium_config.no_blms + selenium_config.no_price_box))  

@pytest.mark.parametrize("asin", all_asins)
def test_all_asins_combined(asin, request):
    """ Testet den AmazonProductScraper mit allen ASINs aus der kombinierten Liste.
        Aufruf mit: python -m pytest tests/test_amazon_product_scraper.py -s -k test_all_asins_combined
    """
    global total_duration_combined  # Globale Variable für die Gesamtdauer

    # Testnummer berechnen
    test_index = request.node.callspec.indices["asin"] + 1  # 1-basiert
    total_tests = len(all_asins)

    print(f"\n🧪 Testing ASIN {test_index}/{total_tests}: {asin}")

    scraper = AmazonProductScraper(show_details=False)
    start_time = timeit.default_timer()
    
    try:
        product = scraper.get_product_infos(asin)
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        total_duration_combined += scrape_duration  # Zeit addieren
        
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
        assert isinstance(product.get("price"), float) and product["price"] > 0, f"❌ Error: Invalid price for ASIN {asin}!"
        
        print(f"✅ Test {test_index}/{total_tests} passed! Product is valid. Scraping took {scrape_duration} seconds.\n")
    
    except Exception as e:
        pytest.fail(f"❌ Test {test_index}/{total_tests} failed for ASIN {asin}: {e}")
    finally:
        scraper.driver.quit()


@pytest.mark.parametrize("asin", selenium_config.no_product_info)
def test_asins_list(asin, request):
    """ Tests the AmazonProductScraper with multiple ASINs from the list.
        Run with: python -m pytest -s -k test_asins_list tests/test_amazon_product_scraper.py

    """
    global total_duration  # Use global variable to track cumulative time

    # Testnummer berechnen
    test_index = request.node.callspec.indices["asin"] + 1  # 1-basiert
    total_tests = len(selenium_config.no_product_info)

    print(f"\n🧪 Testing ASIN {test_index}/{total_tests}: {asin}")

    scraper = AmazonProductScraper(show_details=False)
    start_time = timeit.default_timer()
    
    try:
        product = scraper.get_product_infos(asin)
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        total_duration += scrape_duration  # Add to global duration
        
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
        assert isinstance(product.get("price"), float) and product["price"] > 0, f"❌ Error: Invalid price for ASIN {asin}!"
        
        #print_product_info(product)
        
        print(f"✅ Test {test_index}/{total_tests} passed! Product is valid. Scraping took {scrape_duration} seconds.\n")
    
    except Exception as e:
        pytest.fail(f"❌ Test {test_index}/{total_tests} failed for ASIN {asin}: {e}")
    finally:
        scraper.driver.quit()

@pytest.mark.parametrize("asin", selenium_config.no_blms)
def test_no_blms_asins(asin, request):
    """ Tests that ASINs in the 'not_working' list return None. 
     Run with: python -m pytest tests/test_amazon_product_scraper.py -s -k test_no_blms_asins
     """
    test_index = request.node.callspec.indices["asin"] + 1  # 1-basiert
    total_tests = len(selenium_config.no_blms)
    
    print(f"\n🧪 Testing ASINS with no blm {test_index}/{total_tests}: {asin}")
    start_time = timeit.default_timer()
    scraper = AmazonProductScraper(show_details=False)
    
    try:
        product = scraper.get_product_infos(asin)
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
        assert isinstance(product.get("blm"), int) and product["blm"] == 0, f"❌ Error: Invalid blm price for ASIN {asin}!"

        print(f"✅ Test {test_index}/{total_tests} passed! ASIN {asin} correctly returned None. Scraping took {scrape_duration} seconds.\n")
    except Exception as e:
        pytest.fail(f"❌ Test {test_index}/{total_tests} failed for ASIN {asin}: {e}")
    finally:
        scraper.driver.quit()

@pytest.hookimpl(tryfirst=True)
def pytest_sessionfinish(session, exitstatus):
    """ Hook that runs after all tests are completed to print total scrape time. """
    if total_duration > 60:
        minutes = int(total_duration // 60)
        seconds = int(total_duration % 60)
        print(f"\n⏳ Total scraping time: {minutes} min {seconds} sec")
    else:
        print(f"\n⏳ Total scraping time: {round(total_duration, 2)} sec")
    
@pytest.mark.parametrize("asin", [random.choice(selenium_config.health_and_household_asins)])
def test_random_asin(asin):
    """ Tests the AmazonProductScraper with a random ASIN.
        Run with: python -m pytest  tests/test_amazon_product_scraper.py -s -k test_random_asin
    """
    print(f"\n🧪 Testing RANDOM ASIN: {asin}")
    scraper = AmazonProductScraper(show_details=False)
    start_time = timeit.default_timer()
    
    try:
        product = scraper.get_product_infos(asin)
        
        
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
        assert isinstance(product.get("price"), float) and product["price"] > 0, f"❌ Error: Invalid price for ASIN {asin}!"
        
        print(f"✅ Test passed! Product is valid.")
        print_product_info(product)
    except Exception as e:
        pytest.fail(f"❌ Test failed for RANDOM ASIN {asin}: {e}")
    finally:
        scraper.driver.quit()
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        print(f"\nScraping took {scrape_duration} seconds.")

def test_specific_asin(asin_param):
    """ Tests the AmazonProductScraper with a specific ASIN passed as a parameter.
        Run with: python -m pytest test_amazon_product_scraper.py -s -k test_specific_asin --asin B009EO0FSU
    """
    if not asin_param:
        pytest.fail("❌ Error: No ASIN provided! Use --asin <ASIN> to pass an ASIN.")
    
    print(f"\n🧪 Testing SPECIFIC ASIN: {asin_param}")
    scraper = AmazonProductScraper(show_details=True, headless=False)
    start_time = timeit.default_timer()
    
    try:
        product = scraper.get_product_infos(asin_param)    
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin_param} is not a dictionary!"
        assert isinstance(product.get("price"), float) and product.get("price") > 0, f"❌ Error: Invalid price for ASIN {asin_param}!"
        
        print(f"✅ Test passed! Product is valid.")
        print_product_info(product)
    except Exception as e:
        pytest.fail(f"❌ Test failed for ASIN {asin_param}: {e}")
    finally:
        scraper.driver.quit()
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        print(f"\nScraping took {scrape_duration} seconds.")
