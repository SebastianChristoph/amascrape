# Node.js als Basis-Image
FROM node:18

# Arbeitsverzeichnis setzen
WORKDIR /app

# Abhängigkeiten kopieren und installieren
COPY package.json package-lock.json ./
RUN npm install

# Den gesamten Code kopieren
COPY . .

# Port für Vite-Frontend
EXPOSE 5173

# Startbefehl für Vite
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
