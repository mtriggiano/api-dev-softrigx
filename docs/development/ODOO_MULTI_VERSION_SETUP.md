# 📦 Configuración Multi-Versión de Odoo

## 🎯 Objetivo

Configurar el sistema para soportar múltiples versiones y ediciones de Odoo:
- Odoo 19 Enterprise ✅ (ya instalado)
- Odoo 19 Community
- Odoo 18 Enterprise
- Odoo 18 Community

## 📥 Descargar Versiones de Odoo

### Odoo 19 Community

```bash
cd /home/mtg/apps/repo

# Descargar desde GitHub
wget https://github.com/odoo/odoo/archive/refs/heads/19.0.zip -O odoo19c.zip

# O clonar el repositorio
# git clone --depth 1 --branch 19.0 https://github.com/odoo/odoo.git odoo19c
# cd odoo19c && zip -r ../odoo19c.zip . && cd ..
```

### Odoo 18 Enterprise

```bash
cd /home/mtg/apps/repo

# Necesitas acceso al repositorio enterprise de Odoo
# Opción 1: Si tienes credenciales de Odoo.com
wget --user=TU_USUARIO --password=TU_PASSWORD \
  https://nightly.odoo.com/18.0/nightly/src/odoo_18.0.latest.zip \
  -O odoo18e.zip

# Opción 2: Si tienes el repositorio enterprise
# git clone --depth 1 --branch 18.0 https://github.com/odoo/enterprise.git odoo18e-enterprise
# git clone --depth 1 --branch 18.0 https://github.com/odoo/odoo.git odoo18e
# Combinar ambos y crear ZIP
```

### Odoo 18 Community

```bash
cd /home/mtg/apps/repo

# Descargar desde GitHub
wget https://github.com/odoo/odoo/archive/refs/heads/18.0.zip -O odoo18c.zip

# O clonar el repositorio
# git clone --depth 1 --branch 18.0 https://github.com/odoo/odoo.git odoo18c
# cd odoo18c && zip -r ../odoo18c.zip . && cd ..
```

## 📋 Estructura de Archivos Requerida

Después de descargar, debes tener:

```bash
/home/mtg/apps/repo/
├── odoo19e.zip  ✅ (ya existe)
├── odoo19c.zip  ← Descargar
├── odoo18e.zip  ← Descargar
└── odoo18c.zip  ← Descargar
```

## ✅ Verificar Instalación

```bash
# Listar versiones disponibles
cd /home/mtg/api-dev
source scripts/utils/odoo-version-manager.sh
list_odoo_versions
```

Deberías ver algo como:

```
📦 Versiones de Odoo disponibles:

  1) Odoo 19 ENTERPRISE ✅
  2) Odoo 19 COMMUNITY ✅
  3) Odoo 18 ENTERPRISE ✅
  4) Odoo 18 COMMUNITY ✅
```

## 🚀 Uso

### Crear Instancia con Versión Específica

```bash
# Sintaxis
./scripts/odoo/create-prod-instance.sh NOMBRE [VERSION] [EDITION] [SSL_METHOD]

# Ejemplos:

# Odoo 19 Enterprise (default)
./scripts/odoo/create-prod-instance.sh cliente1

# Odoo 19 Community
./scripts/odoo/create-prod-instance.sh cliente2 19 community

# Odoo 18 Enterprise
./scripts/odoo/create-prod-instance.sh cliente3 18 enterprise

# Odoo 18 Community
./scripts/odoo/create-prod-instance.sh cliente4 18 community

# Con método SSL específico
./scripts/odoo/create-prod-instance.sh cliente5 19 enterprise 2  # Cloudflare
```

### Parámetros

- **NOMBRE**: Nombre de la instancia (será subdominio)
- **VERSION**: `19` o `18` (default: `19`)
- **EDITION**: `enterprise` o `community` (default: `enterprise`)
- **SSL_METHOD**: 
  - `1` = Let's Encrypt (default)
  - `2` = Cloudflare Origin Certificate
  - `3` = HTTP sin SSL

## 📝 Notas Importantes

### Diferencias entre Ediciones

**Enterprise**:
- ✅ Todos los módulos enterprise
- ✅ Soporte oficial de Odoo
- ✅ Actualizaciones automáticas
- ❌ Requiere licencia

**Community**:
- ✅ Código abierto
- ✅ Gratis
- ✅ Módulos base completos
- ❌ Sin módulos enterprise
- ❌ Sin soporte oficial

### Requisitos de Licencia

- **Odoo 19 Enterprise**: Requiere licencia válida de Odoo.com
- **Odoo 18 Enterprise**: Requiere licencia válida de Odoo.com
- **Community**: No requiere licencia

### Compatibilidad

- Todas las versiones usan Python 3.12
- Todas las versiones usan PostgreSQL 16
- Las instancias son independientes y pueden coexistir

## 🔧 Configuración Avanzada

### Agregar Más Versiones

Editar `/home/mtg/api-dev/config/odoo-versions.conf`:

```bash
# Formato: VERSION|EDITION|REPO_PATH|SERVICE_PREFIX|PYTHON_BIN

# Odoo 17 (ejemplo)
17|enterprise|/home/mtg/apps/repo/odoo17e.zip|odoo17e|/usr/bin/python3.12
17|community|/home/mtg/apps/repo/odoo17c.zip|odoo17c|/usr/bin/python3.12
```

### Cambiar Rutas

Si quieres usar rutas diferentes, edita el archivo de configuración:

```bash
nano /home/mtg/api-dev/config/odoo-versions.conf
```

## 🐛 Troubleshooting

### Error: "Archivo de Odoo no encontrado"

```bash
# Verificar que el archivo existe
ls -lh /home/mtg/apps/repo/odoo*.zip

# Si falta alguno, descargarlo según las instrucciones arriba
```

### Error: "Versión no configurada"

```bash
# Verificar configuración
cat /home/mtg/api-dev/config/odoo-versions.conf

# Asegurarse de que la versión está listada
```

### Verificar Integridad de ZIP

```bash
# Probar descomprimir
unzip -t /home/mtg/apps/repo/odoo19c.zip

# Debe mostrar "No errors detected"
```

## 📊 Gestión de Instancias

### Listar Instancias por Versión

```bash
# Ver todas las instancias
cat /home/mtg/api-dev/data/prod-instances.txt

# Formato: NOMBRE|VERSION|EDITION|DOMAIN|PORT
# Ejemplo:
# prod-cliente1|19|enterprise|cliente1.softrigx.com|2100
# prod-cliente2|19|community|cliente2.softrigx.com|2101
# prod-cliente3|18|enterprise|cliente3.softrigx.com|2102
```

### Filtrar por Versión

```bash
# Instancias Odoo 19
grep "|19|" /home/mtg/api-dev/data/prod-instances.txt

# Instancias Community
grep "|community|" /home/mtg/api-dev/data/prod-instances.txt

# Instancias Odoo 18 Enterprise
grep "|18|enterprise|" /home/mtg/api-dev/data/prod-instances.txt
```

## 🎯 Próximos Pasos

1. ✅ Descargar las versiones faltantes
2. ✅ Verificar con `list_odoo_versions`
3. ✅ Crear instancias de prueba
4. ✅ Actualizar frontend para selector de versión
5. ✅ Actualizar backend API

---

**Última actualización**: 2025-11-20
