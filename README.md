# 🖥️ Server Panel - Panel de Control del Servidor

Panel de control profesional para gestionar instancias Odoo y monitorear el servidor Ubuntu.

## 🚀 Características

### Dashboard de Métricas
- **CPU**: Uso en tiempo real, cores, frecuencia
- **RAM**: Memoria usada/total, porcentaje, swap
- **Disco**: Uso por partición, espacio disponible
- **Red**: Tráfico entrante/saliente, velocidad
- **Uptime**: Tiempo de actividad del servidor
- **Gráficos históricos**: Últimos 60 minutos

### Gestión de Instancias Odoo
- **Listar instancias**: Producción y desarrollo
- **Crear instancias dev**: Clonadas desde producción
- **Actualizar BD**: Sincronizar con producción
- **Actualizar archivos**: Sincronizar código
- **Reiniciar instancias**: Control de servicios
- **Eliminar instancias**: Limpieza completa
- **Ver logs en tiempo real**: Por instancia

### Logs Centralizados
- **Historial de acciones**: Todas las operaciones
- **Filtros**: Por instancia, acción, período
- **Estadísticas**: Éxito/errores, gráficos
- **Auditoría**: Usuario, timestamp, detalles

### Autenticación y Seguridad
- **Login con JWT**: Tokens seguros
- **Roles**: Admin, Developer, Viewer
- **Sesiones**: Control de acceso
- **Logs de auditoría**: Todas las acciones

## 📁 Estructura del Proyecto

```
/home/go/api/
├── backend/                    # Flask API
│   ├── app.py                 # Aplicación principal
│   ├── config.py              # Configuración
│   ├── models.py              # Modelos de BD
│   ├── wsgi.py                # Entry point para Gunicorn
│   ├── routes/                # Endpoints
│   │   ├── auth.py           # Autenticación
│   │   ├── metrics.py        # Métricas del sistema
│   │   ├── instances.py      # Gestión de instancias
│   │   └── logs.py           # Logs de acciones
│   ├── services/              # Lógica de negocio
│   │   ├── system_monitor.py # Monitor del sistema
│   │   └── instance_manager.py # Gestor de instancias
│   ├── requirements.txt       # Dependencias Python
│   ├── .env                   # Variables de entorno
│   └── .env.example           # Ejemplo de .env
├── frontend/                   # React + Vite
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   │   ├── Login.jsx     # Pantalla de login
│   │   │   ├── Dashboard.jsx # Dashboard principal
│   │   │   ├── Instances.jsx # Gestión de instancias
│   │   │   ├── Logs.jsx      # Logs de acciones
│   │   │   └── Layout.jsx    # Layout principal
│   │   ├── lib/
│   │   │   ├── api.js        # Cliente API (Axios)
│   │   │   └── utils.js      # Utilidades
│   │   ├── App.jsx           # Componente raíz
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Estilos globales
│   ├── package.json           # Dependencias Node
│   ├── vite.config.js         # Configuración Vite
│   └── tailwind.config.js     # Configuración Tailwind
├── deploy.sh                   # Script de despliegue
└── README.md                   # Este archivo
```

## 🛠️ Instalación y Despliegue

### Requisitos Previos

- Ubuntu Server
- Python 3.12
- Node.js 20+
- PostgreSQL
- Nginx
- Certbot

### Despliegue Automático

```bash
cd /home/go/api
chmod +x deploy.sh
./deploy.sh
```

El script automáticamente:
1. Configura DNS en Cloudflare
2. Instala dependencias
3. Crea base de datos PostgreSQL
4. Configura backend con Gunicorn
5. Construye frontend
6. Configura Nginx con SSL
7. Crea servicio systemd
8. Configura cron para métricas

### Acceso

- **URL**: https://api-dev.hospitalprivadosalta.ar
- **Usuario**: admin
- **Contraseña**: admin123 (cambiar después del primer login)

## 🔧 Configuración

### Variables de Entorno (Backend)

Editar `/home/go/api/backend/.env`:

```env
FLASK_ENV=production
SECRET_KEY=tu-secret-key
JWT_SECRET_KEY=tu-jwt-secret-key

# PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_NAME=server_panel
DB_USER=go
DB_PASSWORD=!Phax3312!IMAC

# Rutas del servidor
PROD_ROOT=/home/go/apps/production/odoo-enterprise
DEV_ROOT=/home/go/apps/develop/odoo-enterprise
SCRIPTS_PATH=/home/go/scripts
PUERTOS_FILE=/home/go/puertos_ocupados_odoo.txt
DEV_INSTANCES_FILE=/home/go/dev-instances.txt
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuario actual
- `POST /api/auth/refresh` - Refrescar token

### Métricas
- `GET /api/metrics/current` - Métricas actuales
- `GET /api/metrics/history?minutes=60` - Historial

### Instancias
- `GET /api/instances` - Listar instancias
- `GET /api/instances/:name` - Detalle de instancia
- `POST /api/instances/create` - Crear instancia dev
- `DELETE /api/instances/:name` - Eliminar instancia
- `POST /api/instances/:name/update-db` - Actualizar BD
- `POST /api/instances/:name/update-files` - Actualizar archivos
- `POST /api/instances/:name/restart` - Reiniciar instancia
- `GET /api/instances/:name/logs?lines=100` - Ver logs

### Logs
- `GET /api/logs?instance=&action=&hours=24` - Listar logs
- `GET /api/logs/stats?hours=24` - Estadísticas

## 🔐 Roles y Permisos

### Admin
- ✅ Ver dashboard y métricas
- ✅ Ver instancias
- ✅ Crear instancias dev
- ✅ Actualizar instancias (BD y archivos)
- ✅ Reiniciar instancias
- ✅ Eliminar instancias
- ✅ Ver logs

### Developer
- ✅ Ver dashboard y métricas
- ✅ Ver instancias
- ✅ Crear instancias dev
- ✅ Actualizar instancias (BD y archivos)
- ✅ Reiniciar instancias
- ❌ Eliminar instancias
- ✅ Ver logs

### Viewer
- ✅ Ver dashboard y métricas
- ✅ Ver instancias
- ❌ Crear instancias
- ❌ Actualizar instancias
- ❌ Reiniciar instancias
- ❌ Eliminar instancias
- ✅ Ver logs

## 🛠️ Comandos Útiles

### Backend

```bash
# Ver logs
sudo journalctl -u server-panel-api -f

# Reiniciar servicio
sudo systemctl restart server-panel-api

# Estado del servicio
sudo systemctl status server-panel-api

# Detener servicio
sudo systemctl stop server-panel-api
```

### Frontend

```bash
# Desarrollo local
cd /home/go/api/frontend
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview
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
```

### Nginx

```bash
# Verificar configuración
sudo nginx -t

# Recargar configuración
sudo systemctl reload nginx

# Ver logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

## 🔄 Actualización

Para actualizar el panel después de cambios en el código:

```bash
cd /home/go/api

# Backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart server-panel-api

# Frontend
cd ../frontend
npm install
npm run build
sudo systemctl reload nginx
```

## 🐛 Solución de Problemas

### El backend no inicia

```bash
# Ver logs detallados
sudo journalctl -u server-panel-api -n 100 --no-pager

# Verificar que el puerto 5000 esté libre
sudo netstat -tlnp | grep 5000

# Verificar variables de entorno
cat /home/go/api/backend/.env
```

### Error de conexión a la base de datos

```bash
# Verificar que la BD existe
sudo -u postgres psql -l | grep server_panel

# Verificar permisos
sudo -u postgres psql -c "\du"

# Recrear BD
sudo -u postgres dropdb server_panel
sudo -u postgres createdb server_panel -O go --encoding='UTF8'
cd /home/go/api/backend
source venv/bin/activate
python3 -c "from app import create_app, init_db; app = create_app(); init_db(app)"
```

### Error 502 en Nginx

```bash
# Verificar que el backend esté corriendo
sudo systemctl status server-panel-api

# Verificar configuración de Nginx
sudo nginx -t

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Las métricas no se guardan

```bash
# Verificar cron job
crontab -l | grep metrics

# Probar manualmente
curl -X POST http://localhost:5000/api/metrics/save

# Ver logs del cron
grep CRON /var/log/syslog
```

## 📝 Notas Importantes

1. **Cambiar contraseña por defecto**: Después del primer login, cambiar la contraseña del usuario admin
2. **Backup de BD**: Hacer backups regulares de la base de datos `server_panel`
3. **Logs**: Los logs de acciones se guardan en la BD y pueden crecer. Considerar limpieza periódica
4. **Métricas**: Se guardan cada minuto. Considerar limpieza de métricas antiguas
5. **Permisos sudo**: El usuario `go` necesita permisos sudo para gestionar servicios systemd

## 🆘 Soporte

Para problemas o dudas:
1. Revisar logs del backend: `sudo journalctl -u server-panel-api -f`
2. Revisar logs de Nginx: `sudo tail -f /var/log/nginx/error.log`
3. Verificar estado de servicios: `sudo systemctl status server-panel-api`
4. Revisar este README

---

**Última actualización**: 2025-10-28
