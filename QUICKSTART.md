# 🚀 Quick Start - Server Panel

## Despliegue en 3 Pasos

### 1️⃣ Ejecutar Script de Despliegue

```bash
cd /home/go/api
chmod +x deploy.sh
./deploy.sh
```

⏱️ **Tiempo estimado**: 5-10 minutos

### 2️⃣ Acceder al Panel

Abre tu navegador en: **https://api-dev.hospitalprivadosalta.ar**

### 3️⃣ Login

- **Usuario**: `admin`
- **Contraseña**: `admin123`

⚠️ **Importante**: Cambia la contraseña después del primer login

---

## ✅ Verificación Rápida

```bash
# Backend funcionando?
sudo systemctl status server-panel-api

# Ver logs
sudo journalctl -u server-panel-api -f

# Test API
curl http://localhost:5000/health
```

---

## 🎯 Primeros Pasos

### Dashboard
- Ve métricas en tiempo real de CPU, RAM, Disco y Red
- Observa gráficos históricos

### Instancias
- Lista todas las instancias Odoo (producción y desarrollo)
- Crea una nueva instancia dev con un click
- Actualiza BD o archivos desde producción
- Reinicia o elimina instancias

### Logs
- Revisa el historial de todas las acciones
- Filtra por instancia, acción o período
- Ve estadísticas de éxito/errores

---

## 🆘 Problemas?

### Backend no inicia
```bash
sudo journalctl -u server-panel-api -n 50
```

### Error 502
```bash
sudo systemctl restart server-panel-api
sudo systemctl reload nginx
```

### No puedo acceder
- Verifica DNS en Cloudflare
- Espera 2-3 minutos para propagación
- Verifica certificado SSL: `sudo certbot certificates`

---

## 📚 Más Información

- **Guía completa**: [README.md](README.md)
- **Instalación manual**: [INSTALL.md](INSTALL.md)
- **API Endpoints**: Ver sección API en README.md

---

**¿Todo listo?** ¡Empieza a gestionar tu servidor! 🎉
