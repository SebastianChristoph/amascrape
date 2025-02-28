import product_scraper
import scraping_services
import first_page_scraper

BASE_URL = "https://www.amazon.com/dp/"

IS_PRODUCTION = True

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
    if title is not None and not IS_PRODUCTION:
        print("🏷️  Title:", title)
    else:
        if IS_PRODUCTION:
            print("❌ No title found")
            return
        raise ValueError("❌ No title found")  


    price = product_scraper.get_price(soup)
    if price is not None and not IS_PRODUCTION:
        print("💲 Price:", price)
    else:
        if IS_PRODUCTION:
            print("❌ No price found")
            return
        raise ValueError("❌ No price found")  


    blm = product_scraper.get_bought_last_month(soup)
    if blm is not None and not IS_PRODUCTION:
        print("📊 Bought last month:", blm)
    else:
        if IS_PRODUCTION:
            print("❌ No BLM found")
            return
        raise ValueError("❌ No BLM found")  

    # category (optional)
    # image_path (optional)

    product = {
        "title" : title,
        "price" : price,
        "blm" : blm,
        "asin" : asin
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
            
            if check_only_five and limiter >= 5:
                break  
    except ValueError as e:
        print(f"\n🚨 ERROR: {e}") 
        print("⛔ Script stopped due to missing data! Check product_debug.html")

    return results
