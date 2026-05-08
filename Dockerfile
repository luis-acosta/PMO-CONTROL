# Etapa 1: Construir el Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
# La exportación estática genera la carpeta 'out'
RUN npm run build

# Etapa 2: Configurar el Backend y la imagen final
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

# Instalar dependencias del backend
COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

# Copiar el código fuente del backend
COPY backend/ ./backend/

# Copiar los archivos estáticos del frontend construidos en la Etapa 1
# Se copian a backend/public que es donde index.js los busca
COPY --from=frontend-builder /app/frontend/out ./backend/public

# Exponer el puerto del backend
EXPOSE 3001

WORKDIR /app/backend
CMD ["npm", "start"]
