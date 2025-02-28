import product_scraper
import scraping_services
import first_page_scraper
import time

BASE_URL = "https://www.amazon.com/dp/"

IS_PRODUCTION = True
WAITING_TIME= 2

def get_product_infos(asin, product_count, found_asins_count):
    """
    Holt Produktinformationen für eine bestimmte ASIN.
    Falls ein Wert fehlt, wird eine Exception geworfen, um die Schleife zu unterbrechen.
    """
    print("\n------------------------------------------")
    print(f"[{product_count}/{found_asins_count}] GETTING PRODUCT INFO FOR {asin}\n")
    print("🌐", BASE_URL + asin)

    soup = scraping_services.fetch_product_data_soup(asin)


    title = product_scraper.get_product_title(soup)
    if title is not None:
        print("🏷️  Title:", title)
    else:
        if IS_PRODUCTION:
            print("❌ No title found")
            return
        raise ValueError("❌ No title found")  


    price = product_scraper.get_price(soup)
    if price is not None:
        print("💲 Price:", price)
    else:
        if IS_PRODUCTION:
            print("❌ No price found")
            return
        raise ValueError("❌ No price found")  


    blm = product_scraper.get_bought_last_month(soup)
    if blm is not None:
        print("📊 Bought last month:", blm)
    else:
        if IS_PRODUCTION:
            print("❌ No BLM found")
            return
        raise ValueError("❌ No BLM found")  

    # category (optional)
    # image_path (optional)

    image_path = product_scraper.get_image_url(soup)
    if image_path is not None:
        print("🖼️  Image:", image_path)
    else:
        if IS_PRODUCTION:
            print("❌ No image found")
            return
        raise ValueError("❌ No image found")  


    product = {
        "title" : title,
        "price" : price,
        "blm" : blm,
        "asin" : asin,
        "image_path" : image_path
    }

    return product

def get_results(searchterm, check_only_five):
    found_asins = first_page_scraper.get_asins_in_first_page(searchterm)
    results = []
    if check_only_five:
        print("\n############# SHOWING ONLY 10 PRODUCTS #############")

    product_count = 0
    limiter = 0
    # **Produkte durchgehen und Infos abrufen**
    try:
        for asin in found_asins:
            product_count += 1
            result = get_product_infos(asin, product_count, len(found_asins))
            if result != None:
                limiter += 1
                results.append(result)
            else:
                print(f"\n WAITING FOR {WAITING_TIME}s....")
                time.sleep(WAITING_TIME)
            
            if check_only_five and limiter >= 5:
                break  
    except ValueError as e:
        print(f"\n🚨 ERROR: {e}") 
        print("⛔ Script stopped due to missing data! Check product_debug.html")

    return results
