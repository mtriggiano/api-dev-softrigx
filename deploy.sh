#!/bin/bash

# 🚀 Script de despliegue del Server Panel
# Despliega el backend Flask y el frontend React en api-dev.hospitalprivadosalta.ar

set -e

DOMAIN="api-dev.hospitalprivadosalta.ar"
API_DIR="/home/go/api"
BACKEND_DIR="$API_DIR/backend"
FRONTEND_DIR="$API_DIR/frontend"
USER="go"
PUBLIC_IP="200.69.140.2"
CF_API_TOKEN="JK1cCBg776SHiZX9T6Ky5b2gtjMkpUsNHxVyQ0Vs"
CF_ZONE_NAME="hospitalprivadosalta.ar"

echo "🚀 Iniciando despliegue del Server Panel..."

# Verificar que estamos en el directorio correcto
cd "$API_DIR"

# 1. Configurar DNS en Cloudflare
echo "🌐 Configurando DNS en Cloudflare..."
CF_ZONE_ID=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=$CF_ZONE_NAME" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" | jq -r '.result[0].id')

curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$CF_ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"type":"A","name":"'"$DOMAIN"'","content":"'"$PUBLIC_IP"'","ttl":3600,"proxied":true}' >/dev/null

echo "✅ DNS configurado"

# 2. Instalar dependencias del sistema si es necesario
echo "📦 Verificando dependencias del sistema..."
command -v python3.12 >/dev/null 2>&1 || { echo "❌ Python 3.12 no encontrado"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js no encontrado. Instalando..."; curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs; }
command -v nginx >/dev/null 2>&1 || { echo "❌ Nginx no encontrado"; exit 1; }

# 3. Configurar backend
echo "🐍 Configurando backend..."
cd "$BACKEND_DIR"

# Crear entorno virtual si no existe
if [ ! -d "venv" ]; then
  python3.12 -m venv venv
fi

# Activar y actualizar dependencias
source venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
  echo "📝 Creando archivo .env..."
  cp .env.example .env
  
  # Generar secrets aleatorios
  SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  JWT_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
  
  sed -i "s/your-secret-key-change-this/$SECRET_KEY/" .env
  sed -i "s/your-jwt-secret-key-change-this/$JWT_SECRET_KEY/" .env
fi

# Crear base de datos PostgreSQL
echo "🗄️ Configurando base de datos..."
DB_NAME="server_panel"
DB_USER="go"

# Verificar si la BD ya existe
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
  echo "✅ Base de datos ya existe"
else
  echo "📦 Creando base de datos..."
  sudo -u postgres createdb "$DB_NAME" -O "$DB_USER" --encoding='UTF8'
fi

# Inicializar base de datos
echo "🔧 Inicializando base de datos..."
python3 -c "from app import create_app, init_db; app = create_app(); init_db(app)"

# 4. Crear servicio systemd para el backend
echo "⚙️ Creando servicio systemd..."
sudo tee /etc/systemd/system/server-panel-api.service > /dev/null <<EOF
[Unit]
Description=Server Panel API
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$BACKEND_DIR
Environment="PATH=$BACKEND_DIR/venv/bin"
ExecStart=$BACKEND_DIR/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 wsgi:app
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable server-panel-api
sudo systemctl restart server-panel-api

echo "✅ Servicio backend iniciado"

# 5. Construir frontend
echo "⚛️ Construyendo frontend..."
cd "$FRONTEND_DIR"

# Instalar dependencias
npm install

# Crear archivo .env para producción
echo "VITE_API_URL=https://$DOMAIN" > .env.production

# Build
npm run build

# Ajustar permisos para que Nginx pueda leer los archivos
chmod -R 755 "$FRONTEND_DIR/dist"
chmod 755 /home/$USER /home/$USER/api /home/$USER/api/frontend

echo "✅ Frontend construido"

# 6. Configurar Nginx
echo "🌐 Configurando Nginx..."

# Crear configuración temporal HTTP para obtener certificado
sudo tee /etc/nginx/sites-available/server-panel > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Frontend (archivos estáticos)
    location / {
        root $FRONTEND_DIR/dist;
        try_files \$uri \$uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_http_version 1.1;
        proxy_read_timeout 300s;
    }

    # Health check
    location /health {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
    }
}
EOF

# Habilitar sitio
sudo ln -sf /etc/nginx/sites-available/server-panel /etc/nginx/sites-enabled/server-panel

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx

# 7. Obtener certificado SSL
echo "🔐 Obteniendo certificado SSL..."
if [ ! -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos -m admin@$DOMAIN --redirect
  echo "✅ Certificado SSL obtenido"
else
  echo "✅ Certificado SSL ya existe"
fi

# 8. Crear cron job para guardar métricas cada minuto
echo "⏰ Configurando cron job para métricas..."
CRON_JOB="* * * * * curl -X POST http://localhost:5000/api/metrics/save >/dev/null 2>&1"
(crontab -l 2>/dev/null | grep -v "/api/metrics/save"; echo "$CRON_JOB") | crontab -

echo ""
echo "✅ ¡Despliegue completado con éxito!"
echo ""
echo "📋 Información del despliegue:"
echo "   🌐 URL: https://$DOMAIN"
echo "   👤 Usuario: admin"
echo "   🔑 Contraseña: admin123 (cambiar después del primer login)"
echo ""
echo "📜 Comandos útiles:"
echo "   Ver logs del backend: sudo journalctl -u server-panel-api -f"
echo "   Reiniciar backend: sudo systemctl restart server-panel-api"
echo "   Estado del backend: sudo systemctl status server-panel-api"
echo "   Recargar Nginx: sudo systemctl reload nginx"
echo ""
