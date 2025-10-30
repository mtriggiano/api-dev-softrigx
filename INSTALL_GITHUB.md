# 🚀 Instalación de la Integración GitHub

Esta guía te ayudará a instalar y configurar la integración GitHub en tu servidor.

## ✅ Pasos de Instalación

### 1. Actualizar la Base de Datos

Ejecuta el script de migración para crear la nueva tabla:

```bash
cd /home/go/api/backend
source venv/bin/activate
python3 migrate_github.py
```

**Salida esperada:**
```
============================================================
MIGRACIÓN: Integración GitHub
============================================================
🔄 Creando tabla github_configs...
✅ Tabla github_configs creada exitosamente
✅ Migración completada

✅ La base de datos está lista para usar la integración GitHub
```

### 2. Reiniciar el Servicio

```bash
sudo systemctl restart server-panel-api
```

### 3. Verificar que el Servicio Está Corriendo

```bash
sudo systemctl status server-panel-api
```

### 4. Verificar los Endpoints

```bash
# Verificar que el endpoint de GitHub está disponible
curl http://localhost:5000/api/ | jq
```

Deberías ver `github: /api/github` en la lista de endpoints.

## 🔧 Configuración Inicial

### 1. Crear Personal Access Token en GitHub

1. Ve a GitHub → Settings → Developer settings → Personal access tokens
2. Click en "Generate new token (classic)"
3. Dale un nombre descriptivo (ej: "Server Panel - Dev Instance")
4. Selecciona los siguientes scopes:
   - ✅ `repo` (Full control of private repositories)
   - ✅ `user:email` (Access user email addresses)
5. Click en "Generate token"
6. **IMPORTANTE:** Copia el token y guárdalo en un lugar seguro

### 2. Probar la Integración

```bash
# Primero obtén tu JWT token haciendo login
JWT_TOKEN="tu_jwt_token_aqui"

# Verifica tu token de GitHub
curl -X POST http://localhost:5000/api/github/verify-token \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "token": "ghp_tu_token_de_github"
  }'
```

Si todo está bien, deberías ver tu información de GitHub:

```json
{
  "success": true,
  "username": "tu-usuario",
  "name": "Tu Nombre",
  "email": "tu@email.com",
  "avatar_url": "https://avatars.githubusercontent.com/..."
}
```

## 📋 Verificación de Archivos

Asegúrate de que los siguientes archivos existen:

```bash
# Verificar archivos creados
ls -la /home/go/api/backend/models.py
ls -la /home/go/api/backend/services/git_manager.py
ls -la /home/go/api/backend/routes/github.py
ls -la /home/go/api/GITHUB_INTEGRATION.md
```

## 🔍 Verificar Logs

Si algo no funciona, revisa los logs:

```bash
# Ver logs en tiempo real
sudo journalctl -u server-panel-api -f

# Ver últimas 50 líneas
sudo journalctl -u server-panel-api -n 50
```

## 🐛 Solución de Problemas

### Error: "ModuleNotFoundError: No module named 'requests'"

```bash
cd /home/go/api/backend
source venv/bin/activate
pip install requests
sudo systemctl restart server-panel-api
```

### Error: "Table 'github_configs' doesn't exist"

```bash
cd /home/go/api/backend
source venv/bin/activate
python3 migrate_github.py
sudo systemctl restart server-panel-api
```

### Error: "ImportError: cannot import name 'GitHubConfig'"

Verifica que el archivo `models.py` tiene la clase `GitHubConfig`. Si no, revisa que los cambios se aplicaron correctamente.

### El servicio no inicia

```bash
# Ver error específico
sudo journalctl -u server-panel-api -n 100 --no-pager

# Verificar sintaxis Python
cd /home/go/api/backend
source venv/bin/activate
python3 -m py_compile app.py
python3 -m py_compile models.py
python3 -m py_compile services/git_manager.py
python3 -m py_compile routes/github.py
```

## ✨ Próximos Pasos

Una vez instalado:

1. **Lee la documentación completa:** [GITHUB_INTEGRATION.md](GITHUB_INTEGRATION.md)
2. **Crea un repositorio** en GitHub para tus custom addons
3. **Vincula tu cuenta** desde el frontend o usando la API
4. **Empieza a hacer commits** de tus desarrollos

## 📚 Recursos

- [Documentación de uso](GITHUB_INTEGRATION.md)
- [README principal](README.md)
- [Documentación GitHub API](https://docs.github.com/en/rest)

---

**¿Necesitas ayuda?** Revisa los logs del servicio o consulta la documentación completa.
