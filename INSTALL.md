# 📦 Guía de Instalación - Server Panel

## Instalación Rápida

```bash
cd /home/go/api
chmod +x deploy.sh
./deploy.sh
```

Espera 5-10 minutos y accede a: **https://api-dev.hospitalprivadosalta.ar**

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## Instalación Manual (Paso a Paso)

### 1. Verificar Requisitos

```bash
# Python 3.12
python3.12 --version

# Node.js 20+
node --version
npm --version

# PostgreSQL
sudo -u postgres psql --version

# Nginx
nginx -v

# Certbot
certbot --version
```

### 2. Configurar Backend

```bash
cd /home/go/api/backend

# Crear entorno virtual
python3.12 -m venv venv
source venv/bin/activate

# Instalar dependencias
pip install --upgrade pip
pip install -r requirements.txt

# Crear archivo .env
cp .env.example .env
nano .env  # Editar configuración
```

### 3. Crear Base de Datos

```bash
# Crear BD
sudo -u postgres createdb server_panel -O go --encoding='UTF8'

# Inicializar tablas y usuario admin
cd /home/go/api/backend
source venv/bin/activate
python3 -c "from app import create_app, init_db; app = create_app(); init_db(app)"
```

### 4. Configurar Servicio Systemd

```bash
sudo nano /etc/systemd/system/server-panel-api.service
```

Contenido:

```ini
[Unit]
Description=Server Panel API
After=network.target

[Service]
Type=simple
User=go
WorkingDirectory=/home/go/api/backend
Environment="PATH=/home/go/api/backend/venv/bin"
ExecStart=/home/go/api/backend/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 wsgi:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar e iniciar servicio
sudo systemctl daemon-reload
sudo systemctl enable server-panel-api
sudo systemctl start server-panel-api
sudo systemctl status server-panel-api
```

### 5. Configurar Frontend

```bash
cd /home/go/api/frontend

# Instalar dependencias
npm install

# Crear archivo .env.production
echo "VITE_API_URL=https://api-dev.hospitalprivadosalta.ar" > .env.production

# Build
npm run build
```

### 6. Configurar Nginx

```bash
sudo nano /etc/nginx/sites-available/server-panel
```

Contenido:

```nginx
server {
    listen 80;
    server_name api-dev.hospitalprivadosalta.ar;

    # Frontend
    location / {
        root /home/go/api/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/server-panel /etc/nginx/sites-enabled/

# Verificar y recargar
sudo nginx -t
sudo systemctl reload nginx
```

### 7. Configurar SSL con Certbot

```bash
sudo certbot --nginx -d api-dev.hospitalprivadosalta.ar --non-interactive --agree-tos -m admin@hospitalprivadosalta.ar --redirect
```

### 8. Configurar Cron para Métricas

```bash
# Editar crontab
crontab -e

# Agregar línea:
* * * * * curl -X POST http://localhost:5000/api/metrics/save >/dev/null 2>&1
```

### 9. Configurar DNS en Cloudflare

Agregar registro A:
- **Tipo**: A
- **Nombre**: api-dev
- **Contenido**: 200.69.140.2
- **Proxy**: Activado
- **TTL**: Auto

---

## Verificación

### Backend

```bash
# Estado del servicio
sudo systemctl status server-panel-api

# Logs en tiempo real
sudo journalctl -u server-panel-api -f

# Test API
curl http://localhost:5000/health
```

### Frontend

```bash
# Verificar archivos
ls -la /home/go/api/frontend/dist/

# Test desde navegador
curl https://api-dev.hospitalprivadosalta.ar
```

### Base de Datos

```bash
# Conectar
sudo -u postgres psql -d server_panel

# Ver tablas
\dt

# Ver usuario admin
SELECT * FROM users;

# Salir
\q
```

---

## Troubleshooting

### Error: Puerto 5000 ocupado

```bash
# Ver qué usa el puerto
sudo lsof -i :5000

# Matar proceso si es necesario
sudo kill -9 <PID>
```

### Error: Permisos en archivos

```bash
# Ajustar permisos
sudo chown -R go:go /home/go/api
chmod +x /home/go/api/deploy.sh
```

### Error: Base de datos no existe

```bash
# Recrear BD
sudo -u postgres dropdb server_panel
sudo -u postgres createdb server_panel -O go --encoding='UTF8'
cd /home/go/api/backend
source venv/bin/activate
python3 -c "from app import create_app, init_db; app = create_app(); init_db(app)"
```

### Error: Nginx 502 Bad Gateway

```bash
# Verificar backend
sudo systemctl status server-panel-api

# Reiniciar backend
sudo systemctl restart server-panel-api

# Ver logs
sudo tail -f /var/log/nginx/error.log
```

---

## Desinstalación

```bash
# Detener y eliminar servicio
sudo systemctl stop server-panel-api
sudo systemctl disable server-panel-api
sudo rm /etc/systemd/system/server-panel-api.service
sudo systemctl daemon-reload

# Eliminar configuración Nginx
sudo rm /etc/nginx/sites-enabled/server-panel
sudo rm /etc/nginx/sites-available/server-panel
sudo systemctl reload nginx

# Eliminar certificado SSL
sudo certbot delete --cert-name api-dev.hospitalprivadosalta.ar

# Eliminar base de datos
sudo -u postgres dropdb server_panel

# Eliminar archivos
rm -rf /home/go/api

# Eliminar cron job
crontab -e  # Eliminar línea de métricas
```

---

## Siguiente Paso

Una vez instalado, lee el [README.md](README.md) para conocer todas las funcionalidades.
