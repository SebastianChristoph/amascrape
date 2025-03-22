FROM python:3.10

# Arbeitsverzeichnis setzen
WORKDIR /app

# Systempakete & Browser installieren
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    gnupg \
    unzip \
    firefox-esr \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# Geckodriver 0.36.0 installieren (kompatibel mit Firefox 128+)
RUN wget https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux64.tar.gz && \
    tar -xzf geckodriver-v0.36.0-linux64.tar.gz && \
    mv geckodriver /usr/local/bin/ && \
    chmod +x /usr/local/bin/geckodriver && \
    rm geckodriver-v0.36.0-linux64.tar.gz

# Python requirements installieren
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Code kopieren
COPY . .

# Port für FastAPI
EXPOSE 9000

# Startbefehl
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
