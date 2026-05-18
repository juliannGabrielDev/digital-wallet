# Usamos Python 3.13-slim para estar más cerca de tu entorno de Arch/Fedora
FROM python:3.13-slim

# Evitar que Python genere archivos .pyc y asegurar logs en tiempo real
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias esenciales del sistema
# Se incluyen herramientas para compilar extensiones de C y soporte para PostgreSQL
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    python3-dev \
    libpq-dev \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Instalación de pipenv (tu gestor de paquetes preferido)
RUN pip install --no-cache-dir pipenv

# Copiar archivos de dependencias primero para aprovechar la caché de Docker
COPY Pipfile Pipfile.lock /app/

# Instalar dependencias directamente en el sistema del contenedor (sin venv interno)
RUN pipenv install --system --deploy

# Copiar el resto del código fuente del microservicio
COPY . /app/

# Puerto por defecto para Django (ms_users: 8000, ms_wallet: 8001, etc.)
EXPOSE 8000

# Comando para iniciar el servidor de desarrollo de Django
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
