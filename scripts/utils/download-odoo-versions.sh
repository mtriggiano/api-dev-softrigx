#!/bin/bash

# 📥 Script para descargar versiones de Odoo

set -e

REPO_DIR="/home/mtg/apps/repo"
mkdir -p "$REPO_DIR"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📥 Descarga de Versiones de Odoo"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Función para descargar y empaquetar Odoo Community
download_community() {
    local version=$1
    local filename="odoo${version}c.zip"
    local filepath="$REPO_DIR/$filename"
    
    if [ -f "$filepath" ]; then
        echo "✅ $filename ya existe"
        return 0
    fi
    
    echo "📦 Descargando Odoo $version Community..."
    cd "$REPO_DIR"
    
    # Clonar repositorio
    if [ -d "odoo-${version}-temp" ]; then
        rm -rf "odoo-${version}-temp"
    fi
    
    git clone --depth 1 --branch ${version}.0 https://github.com/odoo/odoo.git "odoo-${version}-temp"
    
    # Crear ZIP
    echo "📦 Empaquetando..."
    cd "odoo-${version}-temp"
    zip -r "../$filename" . -q
    
    # Limpiar
    cd "$REPO_DIR"
    rm -rf "odoo-${version}-temp"
    
    echo "✅ $filename descargado: $(du -h $filepath | cut -f1)"
}

# Menú interactivo
echo "Selecciona qué versiones descargar:"
echo ""
echo "1) Odoo 19 Community"
echo "2) Odoo 18 Community"
echo "3) Ambas versiones"
echo "4) Salir"
echo ""
read -p "Opción (1-4): " option

case $option in
    1)
        download_community 19
        ;;
    2)
        download_community 18
        ;;
    3)
        download_community 19
        download_community 18
        ;;
    4)
        echo "👋 Saliendo..."
        exit 0
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Descarga completada"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📂 Archivos en $REPO_DIR:"
ls -lh "$REPO_DIR"/*.zip 2>/dev/null || echo "No hay archivos ZIP"
echo ""
echo "🔍 Verificar versiones disponibles:"
echo "   source /home/mtg/api-dev/scripts/utils/odoo-version-manager.sh"
echo "   list_odoo_versions"
