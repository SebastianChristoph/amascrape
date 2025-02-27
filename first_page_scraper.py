from bs4 import BeautifulSoup
import requests
import scraping_services
import time


URL = "https://www.amazon.com/s?k="


def fetch_html_data(searchterm, max_retries=2):
    print("\n✅ Getting raw data")
    headers = scraping_services.get_headers()

    retries = 0
    while retries < max_retries:
        try:
            # print("Getting random proxy")
            # proxy = scraping_services.get_random_proxy()
            # print("\tUsing Proxy:", proxy)

            #print("Sending request")
            response = requests.get(URL + searchterm, headers=headers, timeout=10)
            
            # Prüfen, ob die Anfrage erfolgreich war
            if response.status_code == 200:
                print("✅ Request successful")
                break
            else:
                print(f"⚠️ Request failed with status {response.status_code}, trying another round...")
        
        except requests.exceptions.RequestException as e:
            print(f"\t\t❌ Request failed, waiting 2sec")
        
        retries += 1
        time.sleep(2) 

    else:
        print("\t\t❌ All waiting failed.")
        response = requests.get(URL + searchterm, headers=headers, timeout=10)

    soup = BeautifulSoup(response.text, "html.parser")

    with open("debug.html", "w", encoding="UTF-8") as file:
        file.write(soup.prettify())

    return soup


def get_asins_in_first_page(searchterm):
    print(f"\nGETTING ALL ASINS FROM FIRST PAGE for >>{searchterm}<<")
    html_data = fetch_html_data(searchterm)

    found_asins = []
    print("✅ Getting listItems", end=" ")
    listitem_divs = html_data.find_all('div', {'role': 'listitem'})


    if listitem_divs:
        with open("listitem.html", "w", encoding="UTF-8") as file:
            file.write(listitem_divs[0].prettify())
   
    for listitem in listitem_divs:
        asin = None

        # Getting ASIN
        asin_div = listitem.find('div', {'data-csa-c-item-id': True})
        if asin_div:
            asin = str(asin_div.get('data-csa-c-item-id'))[-10:]
            found_asins.append(asin)
    print(" > Found:", len(found_asins), "products")
    
    return found_asins
