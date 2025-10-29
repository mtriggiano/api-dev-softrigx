# 🛠️ Comandos Útiles - Server Panel

## 🚀 Despliegue

```bash
# Despliegue completo
cd /home/go/api
./deploy.sh

# Solo backend
cd /home/go/api/backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart server-panel-api

# Solo frontend
cd /home/go/api/frontend
npm install
npm run build
sudo systemctl reload nginx
```

---

## 🔍 Monitoreo

### Backend

```bash
# Estado del servicio
sudo systemctl status server-panel-api

# Logs en tiempo real
sudo journalctl -u server-panel-api -f

# Últimas 100 líneas
sudo journalctl -u server-panel-api -n 100 --no-pager

# Reiniciar servicio
sudo systemctl restart server-panel-api

# Detener servicio
sudo systemctl stop server-panel-api

# Iniciar servicio
sudo systemctl start server-panel-api
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs de error
sudo tail -f /var/log/nginx/error.log

# Ver logs de acceso
sudo tail -f /var/log/nginx/access.log
```

### Base de Datos

```bash
# Conectar a PostgreSQL
sudo -u postgres psql -d server_panel

# Ver tablas
\dt

# Ver usuarios
SELECT * FROM users;

# Ver logs recientes
SELECT * FROM action_logs ORDER BY timestamp DESC LIMIT 10;

# Ver métricas recientes
SELECT * FROM metrics_history ORDER BY timestamp DESC LIMIT 10;

# Contar registros
SELECT COUNT(*) FROM action_logs;
SELECT COUNT(*) FROM metrics_history;

# Salir
\q
```

---

## 🧪 Testing

### Backend

```bash
# Test health check
curl http://localhost:5000/health

# Test API (sin auth)
curl http://localhost:5000/

# Test login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Test métricas (con token)
TOKEN="tu-token-aqui"
curl http://localhost:5000/api/metrics/current \
  -H "Authorization: Bearer $TOKEN"
```

### Frontend

```bash
# Desarrollo local
cd /home/go/api/frontend
npm run dev
# Acceder a http://localhost:5173

# Build
npm run build

# Preview del build
npm run preview
```

---

## 🗄️ Base de Datos

### Backup

```bash
# Crear backup
sudo -u postgres pg_dump server_panel > backup_$(date +%Y%m%d_%H%M%S).sql

# Restaurar backup
sudo -u postgres psql -d server_panel < backup_20251028_120000.sql
```

### Mantenimiento

```bash
# Limpiar logs antiguos (más de 30 días)
sudo -u postgres psql -d server_panel -c "DELETE FROM action_logs WHERE timestamp < NOW() - INTERVAL '30 days';"

# Limpiar métricas antiguas (más de 7 días)
sudo -u postgres psql -d server_panel -c "DELETE FROM metrics_history WHERE timestamp < NOW() - INTERVAL '7 days';"

# Vacuum (optimizar BD)
sudo -u postgres psql -d server_panel -c "VACUUM ANALYZE;"
```

### Recrear BD

```bash
# Eliminar BD
sudo -u postgres dropdb server_panel

# Crear BD
sudo -u postgres createdb server_panel -O go --encoding='UTF8'

# Inicializar
cd /home/go/api/backend
source venv/bin/activate
python3 -c "from app import create_app, init_db; app = create_app(); init_db(app)"
```

---

## 👥 Gestión de Usuarios

### Crear Usuario (Python)

```bash
cd /home/go/api/backend
source venv/bin/activate
python3
```

```python
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    # Crear usuario developer
    user = User(username='juan', role='developer')
    user.set_password('password123')
    db.session.add(user)
    db.session.commit()
    print(f"Usuario {user.username} creado")
```

### Cambiar Contraseña

```python
from app import create_app
from models import db, User

app = create_app()
with app.app_context():
    user = User.query.filter_by(username='admin').first()
    user.set_password('nueva_password')
    db.session.commit()
    print("Contraseña actualizada")
```

### Listar Usuarios

```bash
sudo -u postgres psql -d server_panel -c "SELECT id, username, role, created_at FROM users;"
```

---

## 📊 Métricas

### Guardar Métricas Manualmente

```bash
curl -X POST http://localhost:5000/api/metrics/save
```

### Ver Cron Job

```bash
# Ver cron jobs
crontab -l

# Editar cron jobs
crontab -e

# Ver logs de cron
grep CRON /var/log/syslog | tail -20
```

---

## 🔐 SSL/Certificados

### Ver Certificados

```bash
sudo certbot certificates
```

### Renovar Certificado

```bash
sudo certbot renew
```

### Renovar Certificado Específico

```bash
sudo certbot renew --cert-name api-dev.hospitalprivadosalta.ar
```

### Eliminar Certificado

```bash
sudo certbot delete --cert-name api-dev.hospitalprivadosalta.ar
```

---

## 🧹 Limpieza

### Logs del Sistema

```bash
# Limpiar logs de systemd (mantener últimos 3 días)
sudo journalctl --vacuum-time=3d

# Limpiar logs de Nginx
sudo truncate -s 0 /var/log/nginx/access.log
sudo truncate -s 0 /var/log/nginx/error.log
```

### Archivos Temporales

```bash
# Limpiar archivos temporales de Python
find /home/go/api/backend -type d -name "__pycache__" -exec rm -rf {} +
find /home/go/api/backend -type f -name "*.pyc" -delete

# Limpiar node_modules (si es necesario)
rm -rf /home/go/api/frontend/node_modules
```

---

## 🔄 Actualización

### Actualizar Backend

```bash
cd /home/go/api/backend
git pull  # Si usas git
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart server-panel-api
```

### Actualizar Frontend

```bash
cd /home/go/api/frontend
git pull  # Si usas git
npm install
npm run build
sudo systemctl reload nginx
```

---

## 🐛 Debug

### Ver Variables de Entorno

```bash
cat /home/go/api/backend/.env
```

### Ver Configuración Nginx

```bash
cat /etc/nginx/sites-available/server-panel
```

### Ver Servicio Systemd

```bash
cat /etc/systemd/system/server-panel-api.service
```

### Verificar Puerto 5000

```bash
# Ver qué usa el puerto
sudo lsof -i :5000

# Ver procesos Python
ps aux | grep python

# Matar proceso
sudo kill -9 <PID>
```

### Verificar Permisos

```bash
# Ver permisos de archivos
ls -la /home/go/api/

# Ajustar permisos
sudo chown -R go:go /home/go/api
```

---

## 📦 Reinstalación

### Reinstalar Backend

```bash
cd /home/go/api/backend
rm -rf venv
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart server-panel-api
```

### Reinstalar Frontend

```bash
cd /home/go/api/frontend
rm -rf node_modules dist
npm install
npm run build
sudo systemctl reload nginx
```

---

## 🗑️ Desinstalación Completa

```bash
# Detener servicios
sudo systemctl stop server-panel-api
sudo systemctl disable server-panel-api

# Eliminar servicio
sudo rm /etc/systemd/system/server-panel-api.service
sudo systemctl daemon-reload

# Eliminar Nginx config
sudo rm /etc/nginx/sites-enabled/server-panel
sudo rm /etc/nginx/sites-available/server-panel
sudo systemctl reload nginx

# Eliminar certificado
sudo certbot delete --cert-name api-dev.hospitalprivadosalta.ar

# Eliminar BD
sudo -u postgres dropdb server_panel

# Eliminar archivos
rm -rf /home/go/api

# Eliminar cron job
crontab -e  # Eliminar línea de métricas
```

---

## 💡 Tips

### Desarrollo Local

```bash
# Backend en modo desarrollo
cd /home/go/api/backend
source venv/bin/activate
python3 app.py  # Corre en puerto 5000

# Frontend en modo desarrollo
cd /home/go/api/frontend
npm run dev  # Corre en puerto 5173
```

### Ver Uso de Recursos

```bash
# CPU y RAM
htop

# Espacio en disco
df -h

# Procesos Python
ps aux | grep python

# Conexiones de red
sudo netstat -tlnp
```

---

**Tip**: Guarda este archivo para referencia rápida! 📌
