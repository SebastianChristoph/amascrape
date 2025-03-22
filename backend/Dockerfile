FROM python:3.10

# Arbeitsverzeichnis setzen
WORKDIR /app

# Systempakete aktualisieren und notwendige Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
    firefox-esr \
    wget \
    unzip \
    curl \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Geckodriver herunterladen und installieren
RUN GECKO_VERSION=$(curl -sL https://api.github.com/repos/mozilla/geckodriver/releases/latest | grep '"tag_name"' | cut -d '"' -f 4 | sed 's/v//') \
    && wget -q "https://github.com/mozilla/geckodriver/releases/download/v${GECKO_VERSION}/geckodriver-v${GECKO_VERSION}-linux64.tar.gz" -O /tmp/geckodriver.tar.gz \
    && tar -xzf /tmp/geckodriver.tar.gz -C /usr/local/bin \
    && chmod +x /usr/local/bin/geckodriver \
    && rm /tmp/geckodriver.tar.gz

RUN apt-get update && \
    apt-get install -y firefox-esr \
    && wget https://github.com/mozilla/geckodriver/releases/download/v0.33.0/geckodriver-v0.33.0-linux64.tar.gz \
    && tar -xzf geckodriver-v0.33.0-linux64.tar.gz \
    && mv geckodriver /usr/local/bin/ \
    && rm geckodriver-v0.33.0-linux64.tar.gz


# Python-Abhängigkeiten kopieren und installieren
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Den gesamten Code kopieren
COPY . .

# Port für FastAPI-Server
EXPOSE 9000

# Startbefehl für Uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
