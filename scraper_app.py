import product_scraper
import scraping_services
import first_page_scraper

BASE_URL = "https://www.amazon.com/dp/"
limit_to_10 = True
searchtermn = input("Please enter searchterm: ")

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
        raise ValueError("❌ No title found")  


    price = product_scraper.get_price(soup)
    if price is not None:
        print("💲 Price:", price)
    else:
        raise ValueError("❌ No price found")  


    blm = product_scraper.get_bought_last_month(soup)
    if blm is not None:
        print("📊 Bought last month:", blm)
    else:
        raise ValueError("❌ No BLM found")  

    # category (optional)
    # image_path (optional)

found_asins = first_page_scraper.get_asins_in_first_page(searchtermn)

if limit_to_10:
    print("\n############# SHOWING ONLY 10 PRODUCTS #############")

product_count = 0

# **Produkte durchgehen und Infos abrufen**
try:
    for asin in found_asins:
        product_count += 1
        get_product_infos(asin, product_count, len(found_asins))
        
        if limit_to_10 and product_count >= 10:
            break  
except ValueError as e:
    print(f"\n🚨 ERROR: {e}") 
    print("⛔ Script stopped due to missing data! Check product_debug.html")

print("###########################################################")
print("\n\n✅ Script finished")
