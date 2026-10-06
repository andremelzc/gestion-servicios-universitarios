# Etapa 1: Compilacion del Frontend
FROM node:20-alpine AS build
WORKDIR /app

# Aprovechar cache de capas para dependencias
COPY package*.json ./
RUN npm ci

COPY . .

# Argumento para la URL base de la API backend (VITE_API_URL)
ARG VITE_API_URL=/api/v1
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Etapa 2: Servidor Web Nginx (Servir SPA y API Gateway)
FROM nginx:1.27-alpine
WORKDIR /usr/share/nginx/html

# Limpiar archivos por defecto y copiar build
RUN rm -rf ./*
COPY --from=build /app/dist ./

# Configurar Nginx (reverse proxy, seguridad, rate limit)
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

# Healthcheck nativo con wget de Alpine
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
