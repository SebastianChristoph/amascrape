import random
import pytest
import timeit
from product_seleium_scraper import AmazonProductScraper
import selenium_config

total_duration = 0  # Global variable to track total duration

def print_product_info(product):
    """ Prints product information in a structured format. """
    max_key_length = max(len(key) for key in product.keys())
    for key, value in product.items():
        if isinstance(value, str):
            value = value[:20] + "..." if len(value) > 20 else value
        print(f"\t{key.ljust(max_key_length)} : {value}")


@pytest.mark.parametrize("asin", selenium_config.health_and_household_asins)
def test_all_asins(asin, request):
    """ Tests the AmazonProductScraper with multiple ASINs from the list.
        Run with: python -m pytest test_amazon_scraper.py -s -k test_all_asins
    """
    global total_duration  # Use global variable to track cumulative time

    # Testnummer berechnen
    test_index = request.node.callspec.indices["asin"] + 1  # 1-basiert
    total_tests = len(selenium_config.health_and_household_asins)

    print(f"\n🔍 Testing ASIN {test_index}/{total_tests}: {asin}")

    scraper = AmazonProductScraper(show_details=False)
    start_time = timeit.default_timer()
    
    try:
        product = scraper.get_product_infos(asin)
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        total_duration += scrape_duration  # Add to global duration
        
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin} is not a dictionary!"
        assert isinstance(product.get("price"), float) and product["price"] > 0, f"❌ Error: Invalid price for ASIN {asin}!"
        
        #print_product_info(product)
        
        print(f"\n✅ Test {test_index}/{total_tests} passed! Product is valid. Scraping took {scrape_duration} seconds.\n")
    
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
        Run with: python -m pytest test_amazon_scraper.py -s -k test_random_asin
    """
    print(f"\n🔍 Testing RANDOM ASIN: {asin}")
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
        Run with: python -m pytest test_amazon_scraper.py -s -k test_specific_asin --asin B08WM3LMJF
    """
    if not asin_param:
        pytest.fail("❌ Error: No ASIN provided! Use --asin <ASIN> to pass an ASIN.")
    
    print(f"\n🔍 Testing SPECIFIC ASIN: {asin_param}")
    scraper = AmazonProductScraper(show_details=False)
    start_time = timeit.default_timer()
    
    try:
        product = scraper.get_product_infos(asin_param)    
        assert isinstance(product, dict), f"❌ Error: Product for ASIN {asin_param} is not a dictionary!"
        assert isinstance(product.get("price"), float) and product["price"] > 0, f"❌ Error: Invalid price for ASIN {asin_param}!"
        
        print(f"✅ Test passed! Product is valid.")
        print_product_info(product)
    except Exception as e:
        pytest.fail(f"❌ Test failed for ASIN {asin_param}: {e}")
    finally:
        scraper.driver.quit()
        scrape_duration = round(timeit.default_timer() - start_time, 2)
        print(f"\nScraping took {scrape_duration} seconds.")
