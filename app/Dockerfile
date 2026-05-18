# ==========================================
# EXPO / REACT NATIVE DEVELOPMENT DOCKERFILE (BUN)
# ==========================================
FROM oven/bun:1-alpine

# Instalar dependencias necesarias del sistema (bash, git y nodejs para compatibilidad de Expo CLI)
RUN apk add --no-cache bash git nodejs

WORKDIR /app

# Copiar archivos de dependencias y bun.lock para optimizar la caché de Docker
COPY package.json bun.lock ./

# Instalar dependencias ultra rápido con Bun
RUN bun install

# Copiar el resto del código del proyecto
COPY . .

# Puerto por defecto del Metro Bundler de Expo (a partir de SDK 49 sirve tanto iOS, Android como Web)
EXPOSE 8081

# Iniciar la app de Expo en modo interactivo usando Bun
CMD ["bunx", "expo", "start"]

