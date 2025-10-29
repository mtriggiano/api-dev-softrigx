# 🗄️ Acceso al Gestor de Backups de Odoo

## 📋 Método Recomendado: Túnel SSH

Para acceder al gestor de bases de datos de Odoo de forma segura, usa un túnel SSH desde tu computadora.

### 🚀 Paso a Paso:

#### 1. Desde tu computadora local, ejecuta:

```bash
ssh -L 8069:localhost:2100 go@200.69.140.2
```

**Explicación:**
- `-L 8069:localhost:2100`: Crea un túnel del puerto 8069 de tu PC al puerto 2100 del servidor
- `go@200.69.140.2`: Conexión SSH al servidor

#### 2. Mantén la sesión SSH abierta

La terminal debe permanecer abierta mientras uses el gestor.

#### 3. Abre tu navegador y accede a:

```
http://localhost:8069/web/database/manager
```

#### 4. Usa el gestor normalmente:

- 💾 **Crear Backup**: Backup → Selecciona BD → Ingresa contraseña maestra
- 📥 **Restaurar**: Restore Database → Sube archivo → Ingresa contraseña
- 📋 **Duplicar**: Duplicate → Selecciona BD → Nuevo nombre
- 🗑️ **Eliminar**: Delete → Selecciona BD → Confirma

#### 5. Cuando termines:

Cierra la sesión SSH con `Ctrl+C` o `exit`

---

## 🔐 Contraseña Maestra de Odoo

La contraseña maestra está configurada en:
```
/home/go/apps/production/odoo-enterprise/imac-production/odoo.conf
```

Para verla:
```bash
grep admin_passwd /home/go/apps/production/odoo-enterprise/imac-production/odoo.conf
```

---

## ⚡ Comando Rápido (Copia y Pega)

**Windows (PowerShell/CMD):**
```powershell
ssh -L 8069:localhost:2100 go@200.69.140.2
```

**Mac/Linux:**
```bash
ssh -L 8069:localhost:2100 go@200.69.140.2
```

Luego abre: http://localhost:8069/web/database/manager

---

## 📝 Notas Importantes:

- ✅ Método más seguro y confiable
- ✅ No requiere exponer el gestor públicamente
- ✅ Funciona con todos los navegadores
- ✅ Descarga directa de backups a tu computadora
- ⚠️ Requiere mantener la sesión SSH abierta
- ⚠️ Solo una persona puede usar el túnel a la vez

---

## 🆘 Solución de Problemas:

**Error: "bind: Address already in use"**
- Solución: Cierra cualquier aplicación usando el puerto 8069 o usa otro puerto:
  ```bash
  ssh -L 9069:localhost:2100 go@200.69.140.2
  ```
  Luego accede a: http://localhost:9069/web/database/manager

**No puedo conectar por SSH**
- Verifica que tengas acceso SSH al servidor
- Verifica tu clave SSH o contraseña

**El gestor no carga**
- Verifica que Odoo esté corriendo: `systemctl status odoo19e-imac-production`
