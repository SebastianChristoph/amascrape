import random
import json
import requests
import time
from bs4 import BeautifulSoup


BASE_URL = "https://www.amazon.com/s?k="

def get_random_proxy():
    """
    Liest die JSON-Proxy-Liste und gibt einen zufälligen Proxy im requests-kompatiblen Format zurück.
    """
    try:
        with open("proxylist.json", "r", encoding="utf-8") as json_file:
            proxy_list = json.load(json_file)  # JSON einlesen

        if not proxy_list:
            print("⚠️ Proxy-Liste ist leer! Verwende keinen Proxy.")
            return None

        # Zufälligen Proxy auswählen
        proxy = random.choice(proxy_list)

        # Proxy-Format bestimmen (socks4 oder socks5)
        protocol = "socks5h" if "socks5" in proxy["protocols"] else "socks4"

        # Proxy-String für requests
        proxies = {
            "http": f"{protocol}://{proxy['ip']}:{proxy['port']}",
            "https": f"{protocol}://{proxy['ip']}:{proxy['port']}"
        }

        return proxies

    except FileNotFoundError:
        print("❌ proxylist.json nicht gefunden! Verwende keinen Proxy.")
        return None
    except json.JSONDecodeError:
        print("❌ Fehler beim Einlesen der JSON-Datei! Verwende keinen Proxy.")
        return None

def get_headers() -> dict:
    """
    Gibt zufällige HTTP-Header für die Anfrage zurück.
    """
    user_agents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, wie Gecko) Chrome/92.0.4515.107 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, wie Gecko) Chrome/91.0.4472.114 Safari/537.36',
        'Mozilla/5.0 (Linux; Android 11; Pixel 4 XL) AppleWebKit/537.36 (KHTML, wie Gecko) Chrome/90.0.4430.91 Mobile Safari/537.36',
        # Füge weitere User-Agents hinzu
    ]

    headers = {
        'User-Agent': random.choice(user_agents),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'DNT': '1'
    }

    return headers

def fetch_product_data_soup(asin, max_retries = 2):

    headers = get_headers()
    retries = 0

    while retries < max_retries:
        try:
            response = requests.get(BASE_URL + asin, headers=headers, timeout=10)
            if response.status_code == 200:
                print("✅ Request successful")
                break
            else:
                print(f"⚠️ Request failed with status {response.status_code}, trying another proxy...")

        except requests.exceptions.RequestException as e:
            print(f"\t\t❌ Request failed! Trying another round...")

        retries += 1
        time.sleep(2)

    else:
        print("\t\t❌ All attempts failed")
        response = requests.get(BASE_URL + asin, headers=headers, timeout=10)

    soup = BeautifulSoup(response.text, "html.parser")
    print("✅ Parsing successful")

    with open("product_debug.html", "w", encoding="UTF-8") as file:
        file.write(soup.prettify())
   
    return soup