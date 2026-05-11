FROM node:22-alpine
WORKDIR /app

# Instalar pnpm (usamos la versión 9 estable para evitar políticas de seguridad agresivas)
RUN corepack enable && corepack prepare pnpm@9 --activate

COPY package.json pnpm-lock.yaml ./
COPY prisma ./prisma/

# Evitar que pnpm bloquee la instalación por scripts de terceros
RUN pnpm install --ignore-scripts

COPY . .

# Generar cliente de Prisma manualmente (reemplaza el post-install ignorado arriba)
RUN pnpm prisma generate

RUN pnpm run build

EXPOSE 8002
CMD ["pnpm", "run", "start:prod"]