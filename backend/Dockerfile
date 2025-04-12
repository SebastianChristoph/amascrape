FROM python:3.10-slim

# 🔧 System-Abhängigkeiten installieren
RUN apt-get update && apt-get install -y \
    curl \
    unzip \
    gnupg \
    wget \
    fonts-liberation \
    libnss3 \
    libxss1 \
    libasound2 \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    chromium \
    chromium-driver \
    && rm -rf /var/lib/apt/lists/*

# ✅ Optional: Firefox + Geckodriver (falls du auch Firefox nutzt)
RUN apt-get update && apt-get install -y firefox-esr && \
    wget https://github.com/mozilla/geckodriver/releases/download/v0.36.0/geckodriver-v0.36.0-linux64.tar.gz && \
    tar -xzf geckodriver-v0.36.0-linux64.tar.gz && \
    mv geckodriver /usr/local/bin && \
    chmod +x /usr/local/bin/geckodriver && \
    rm geckodriver-v0.36.0-linux64.tar.gz

# 📦 Python-Abhängigkeiten installieren
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 📁 Projektcode kopieren
COPY . .

# ✅ Umgebungsvariablen setzen
ENV PYTHONUNBUFFERED=1 \
    CHROME_BIN=/usr/bin/chromium \
    CHROMEDRIVER_PATH=/usr/bin/chromedriver \
    INSIDE_DOCKER=1

# 🧪 Debug (optional – kann später raus)
RUN which chromium && chromium --version && \
    which chromedriver && chromedriver --version

# 🚪 Port für FastAPI öffnen
EXPOSE 9000

# 🚀 FastAPI starten
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9000"]
