# 🚀 Guía de Deployment - API-DEV

Esta guía explica cómo desplegar API-DEV en un servidor nuevo desde cero.

## 📋 Requisitos Previos

### Sistema Operativo
- Ubuntu Server 22.04 LTS o superior
- Acceso root o sudo
- Conexión a Internet

### Servicios Externos
- **Cloudflare**: Cuenta con API Token
- **GitHub**: Repositorio con el código
- **Dominio**: Configurado en Cloudflare

---

## 🔧 Instalación Automática (Recomendado)

### 1. Clonar Repositorio

```bash
# Como usuario go
cd /home/go
git clone https://github.com/mtriggiano/api-dev.git
cd api-dev
```

### 2. Ejecutar Quickstart

```bash
./quickstart.sh
```

El script te guiará paso a paso:
1. ✅ Verificación de dependencias
2. ⚙️ Configuración de variables de entorno
3. 🔐 Configuración de Cloudflare
4. 📦 Instalación de paquetes
5. 🗄️ Creación de base de datos
6. 🎨 Construcción del frontend
7. 🔒 Configuración de SSL

### 3. Desplegar el Sistema

```bash
./deploy.sh
```

Esto:
- Instala dependencias Python y Node.js
- Crea base de datos PostgreSQL
- Configura backend con Gunicorn
- Construye frontend
- Configura Nginx con SSL
- Crea servicio systemd
- Configura cron para métricas

### 4. Ejecutar Migraciones de Base de Datos

```bash
cd /home/go/api-dev/backend
source venv/bin/activate
python migrations/add_webhook_fields.py
```

### 5. Verificar Instalación

```bash
# Verificar servicio
sudo systemctl status server-panel-api

# Verificar logs
sudo journalctl -u server-panel-api -n 50

# Probar acceso
curl https://tu-dominio.ar/api/health
```

---

## 📦 Instalación Manual

Si prefieres instalar manualmente o el quickstart falla:

### 1. Instalar Dependencias del Sistema

```bash
sudo apt update
sudo apt install -y \
  python3.12 python3.12-venv python3-pip \
  nodejs npm \
  postgresql postgresql-contrib \
  nginx \
  certbot python3-certbot-nginx \
  git \
  curl wget
```

### 2. Configurar PostgreSQL

```bash
# Crear usuario y base de datos
sudo -u postgres psql << EOF
CREATE USER apidev WITH PASSWORD 'tu_password_segura';
CREATE DATABASE apidev_db OWNER apidev;
GRANT ALL PRIVILEGES ON DATABASE apidev_db TO apidev;
EOF
```

### 3. Configurar Variables de Entorno

```bash
cd /home/go/api-dev
cp .env.example .env
nano .env
```

Configurar:
```bash
# Base de datos
DATABASE_URL=postgresql://apidev:tu_password@localhost/apidev_db

# JWT
JWT_SECRET_KEY=tu_secret_jwt_muy_seguro

# Cloudflare
CLOUDFLARE_API_TOKEN=tu_token_cloudflare
CLOUDFLARE_ZONE_ID=tu_zone_id

# Dominio
DOMAIN=tu-dominio.ar
```

### 4. Instalar Backend

```bash
cd /home/go/api-dev/backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Inicializar base de datos
python app.py
```

### 5. Instalar Frontend

```bash
cd /home/go/api-dev/frontend
npm install
npm run build
```

### 6. Configurar Nginx

```bash
sudo cp /home/go/api-dev/config/nginx/api-dev.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/api-dev.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configurar SSL

```bash
sudo certbot --nginx -d tu-dominio.ar
```

### 8. Crear Servicio Systemd

```bash
sudo cp /home/go/api-dev/config/systemd/server-panel-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable server-panel-api
sudo systemctl start server-panel-api
```

---

## 🔐 Post-Instalación

### 1. Crear Usuario Admin

```bash
cd /home/go/api-dev
./scripts/change-password.sh
```

O directamente:
```bash
./reset-password-api-dev.sh
```

Esto crea/actualiza el usuario `admin` con password `go`.

### 2. Configurar Permisos

```bash
# Asegurar que los scripts sean ejecutables
find /home/go/api-dev/scripts -name "*.sh" -exec chmod +x {} \;
chmod +x /home/go/api-dev/*.sh
chmod +x /home/go/api-dev/backend/migrations/*.py
```

### 3. Configurar Cron para Métricas

```bash
# Agregar a crontab del usuario go
crontab -e

# Agregar esta línea:
*/5 * * * * /home/go/api-dev/backend/venv/bin/python /home/go/api-dev/backend/collect_metrics.py >> /home/go/api-dev/logs/metrics.log 2>&1
```

### 4. Configurar Firewall

```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

---

## 🧪 Verificación

### Verificar Servicios

```bash
# API Backend
sudo systemctl status server-panel-api

# Nginx
sudo systemctl status nginx

# PostgreSQL
sudo systemctl status postgresql
```

### Verificar Logs

```bash
# Logs de API
sudo journalctl -u server-panel-api -f

# Logs de Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs de aplicación
tail -f /home/go/api-dev/logs/gunicorn-error.log
```

### Probar Endpoints

```bash
# Health check
curl https://tu-dominio.ar/api/health

# Login
curl -X POST https://tu-dominio.ar/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"go"}'
```

---

## 🔄 Actualización

### Actualizar desde Git

```bash
cd /home/go/api-dev
git pull origin main

# Ejecutar migraciones si hay
cd backend
source venv/bin/activate
python migrations/add_webhook_fields.py

# Reconstruir frontend
cd ../frontend
npm install
npm run build

# Reiniciar servicio
sudo systemctl restart server-panel-api
```

---

## 🐛 Troubleshooting

### Error: "Database connection failed"

```bash
# Verificar PostgreSQL
sudo systemctl status postgresql

# Verificar credenciales en .env
cat /home/go/api-dev/.env | grep DATABASE_URL

# Probar conexión
psql -U apidev -d apidev_db -h localhost
```

### Error: "Git command not found"

```bash
# Verificar Git
which git
git --version

# Si no está en /usr/bin/git
sudo ln -s $(which git) /usr/bin/git
```

### Error: "Permission denied" en scripts

```bash
# Hacer ejecutables todos los scripts
find /home/go/api-dev -name "*.sh" -exec chmod +x {} \;
chmod +x /home/go/api-dev/backend/migrations/*.py
```

### Error: "Webhook signature invalid"

```bash
# Verificar secret en base de datos
cd /home/go/api-dev/backend
source venv/bin/activate
python << EOF
from app import create_app
from models import db, GitHubConfig
app = create_app()
with app.app_context():
    config = GitHubConfig.query.filter_by(instance_name='production').first()
    print(f"Webhook Secret: {config.webhook_secret}")
EOF
```

---

## 📚 Documentación Adicional

- [QUICKSTART.md](QUICKSTART.md) - Guía de inicio rápido
- [GITHUB_INTEGRATION.md](GITHUB_INTEGRATION.md) - Integración con GitHub
- [SSL_CONFIGURATION.md](SSL_CONFIGURATION.md) - Configuración SSL
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Solución de problemas

---

## 🆘 Soporte

Si encuentras problemas:

1. Revisa los logs: `sudo journalctl -u server-panel-api -f`
2. Consulta la documentación
3. Verifica el CHANGELOG.md para cambios recientes
4. Contacta al administrador del sistema

---

**Última actualización:** 2025-11-12  
**Versión:** 2.3.0
