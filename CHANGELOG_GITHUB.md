# 📝 Changelog - Integración GitHub

## [1.1.0] - 2025-10-30

### ✨ Nueva Funcionalidad: Integración GitHub

Se ha implementado una integración completa con GitHub para permitir a los desarrolladores gestionar el control de versiones de sus custom addons directamente desde el panel.

### 🎯 Características Principales

#### 1. **Gestión de Configuraciones**
- Vincular cuenta de GitHub con Personal Access Token
- Configurar repositorio por instancia de desarrollo
- Seleccionar carpeta local de custom addons
- Soporte para múltiples configuraciones (una por instancia)

#### 2. **Operaciones Git**
- **Init**: Inicializar repositorio Git en carpeta existente
- **Status**: Ver estado del repositorio y archivos modificados
- **Commit**: Crear commits con mensaje personalizado
- **Push**: Subir cambios al repositorio remoto
- **Pull**: Descargar cambios del repositorio remoto
- **History**: Ver historial de commits
- **Diff**: Visualizar diferencias en archivos

#### 3. **Integración con GitHub API**
- Verificar tokens de acceso
- Listar repositorios del usuario
- Autenticación automática para operaciones remotas

### 📦 Archivos Nuevos

#### Backend
- `backend/models.py` - Modelo `GitHubConfig` agregado
- `backend/services/git_manager.py` - Servicio para operaciones Git y GitHub API
- `backend/routes/github.py` - Endpoints API para GitHub
- `backend/migrate_github.py` - Script de migración de base de datos

#### Documentación
- `GITHUB_INTEGRATION.md` - Guía completa de uso
- `INSTALL_GITHUB.md` - Guía de instalación
- `CHANGELOG_GITHUB.md` - Este archivo

### 🔧 Archivos Modificados

- `backend/app.py` - Registrado blueprint de GitHub
- `backend/config.py` - Agregadas configuraciones de GitHub OAuth
- `README.md` - Actualizado con información de integración GitHub

### 🔌 Nuevos Endpoints API

```
POST   /api/github/verify-token           - Verificar token de GitHub
GET    /api/github/repos                  - Listar repositorios
GET    /api/github/config                 - Listar configuraciones
GET    /api/github/config/:instance       - Obtener configuración
POST   /api/github/config                 - Crear/actualizar configuración
DELETE /api/github/config/:instance       - Eliminar configuración
POST   /api/github/init-repo              - Inicializar repositorio
GET    /api/github/status/:instance       - Estado del repositorio
POST   /api/github/commit                 - Crear commit
POST   /api/github/push                   - Push al remoto
POST   /api/github/pull                   - Pull del remoto
GET    /api/github/history/:instance      - Historial de commits
GET    /api/github/diff/:instance         - Diff de cambios
```

### 🗄️ Cambios en Base de Datos

#### Nueva Tabla: `github_configs`

```sql
CREATE TABLE github_configs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    instance_name VARCHAR(100) NOT NULL,
    github_username VARCHAR(100),
    github_access_token VARCHAR(255),
    repo_owner VARCHAR(100),
    repo_name VARCHAR(100),
    repo_branch VARCHAR(100) DEFAULT 'main',
    local_path VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, instance_name)
);
```

### 🔐 Permisos

- **Admin**: ✅ Acceso completo a todas las funciones de GitHub
- **Developer**: ✅ Acceso completo a todas las funciones de GitHub
- **Viewer**: ❌ Sin acceso a funciones de GitHub

### 📊 Logging

Todas las operaciones Git se registran en la tabla `action_logs`:
- `verify_github_token`
- `create_github_config`
- `update_github_config`
- `delete_github_config`
- `init_git_repo`
- `git_commit`
- `git_push`
- `git_pull`

### 🔒 Seguridad

#### Implementado
- ✅ Autenticación JWT requerida para todos los endpoints
- ✅ Verificación de roles (admin/developer)
- ✅ Validación de tokens de GitHub
- ✅ Logging de todas las operaciones
- ✅ Constraint único por usuario/instancia

#### Recomendaciones para Producción
- ⚠️ Encriptar tokens antes de almacenar en BD
- ⚠️ Usar servicio de gestión de secretos
- ⚠️ Implementar rotación automática de tokens
- ⚠️ Habilitar 2FA en cuentas de GitHub

### 📋 Requisitos

#### Dependencias Python
- `requests==2.31.0` (ya incluida en requirements.txt)
- `Flask==3.0.0`
- `Flask-SQLAlchemy==3.1.1`

#### Sistema
- Git instalado en el servidor
- Acceso a GitHub API
- Permisos de escritura en carpetas de custom addons

### 🚀 Instalación

```bash
# 1. Actualizar base de datos
cd /home/go/api/backend
source venv/bin/activate
python3 migrate_github.py

# 2. Reiniciar servicio
sudo systemctl restart server-panel-api

# 3. Verificar
sudo systemctl status server-panel-api
```

Ver [INSTALL_GITHUB.md](INSTALL_GITHUB.md) para instrucciones detalladas.

### 📖 Uso

Ver [GITHUB_INTEGRATION.md](GITHUB_INTEGRATION.md) para guía completa de uso.

### 🐛 Problemas Conocidos

Ninguno reportado hasta el momento.

### 🔮 Futuras Mejoras

- [ ] Implementar OAuth flow completo de GitHub
- [ ] Soporte para SSH keys además de HTTPS
- [ ] Interfaz visual para resolver conflictos de merge
- [ ] Webhooks de GitHub para sincronización automática
- [ ] Soporte para múltiples ramas
- [ ] Integración con GitHub Actions
- [ ] Encriptación de tokens en base de datos
- [ ] Gestión de .gitignore desde el panel

### 👥 Contribuciones

Desarrollado por el equipo de Hospital Privado de Salta.

### 📄 Licencia

Uso interno - Hospital Privado de Salta

---

**Fecha de Release:** 2025-10-30  
**Versión:** 1.1.0  
**Autor:** Sistema de Desarrollo HPS
