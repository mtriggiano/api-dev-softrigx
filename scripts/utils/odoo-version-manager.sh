#!/bin/bash

# 🔧 Gestor de Versiones de Odoo
# Funciones para manejar múltiples versiones y ediciones de Odoo

VERSIONS_CONFIG="${VERSIONS_CONFIG:-/home/mtg/api-dev/config/odoo-versions.conf}"

# Función para listar versiones disponibles
list_odoo_versions() {
    echo "📦 Versiones de Odoo disponibles:"
    echo ""
    local index=1
    while IFS='|' read -r version edition repo_path service_prefix python_bin; do
        # Ignorar comentarios y líneas vacías
        [[ "$version" =~ ^#.*$ ]] || [[ -z "$version" ]] && continue
        
        # Verificar si el archivo existe
        if [[ -f "$repo_path" ]]; then
            echo "  $index) Odoo $version $(echo $edition | tr '[:lower:]' '[:upper:]') ✅"
        else
            echo "  $index) Odoo $version $(echo $edition | tr '[:lower:]' '[:upper:]') ❌ (archivo no encontrado)"
        fi
        ((index++))
    done < "$VERSIONS_CONFIG"
    echo ""
}

# Función para obtener configuración de una versión específica
get_odoo_version_config() {
    local requested_version="$1"
    local requested_edition="$2"
    
    while IFS='|' read -r version edition repo_path service_prefix python_bin; do
        # Ignorar comentarios y líneas vacías
        [[ "$version" =~ ^#.*$ ]] || [[ -z "$version" ]] && continue
        
        if [[ "$version" == "$requested_version" ]] && [[ "$edition" == "$requested_edition" ]]; then
            echo "$version|$edition|$repo_path|$service_prefix|$python_bin"
            return 0
        fi
    done < "$VERSIONS_CONFIG"
    
    return 1
}

# Función para validar que una versión existe y está disponible
validate_odoo_version() {
    local version="$1"
    local edition="$2"
    
    local config=$(get_odoo_version_config "$version" "$edition")
    if [[ -z "$config" ]]; then
        echo "❌ ERROR: Versión Odoo $version $edition no está configurada."
        echo ""
        list_odoo_versions
        return 1
    fi
    
    local repo_path=$(echo "$config" | cut -d'|' -f3)
    if [[ ! -f "$repo_path" ]]; then
        echo "❌ ERROR: Archivo de Odoo no encontrado: $repo_path"
        echo "   Por favor descarga Odoo $version $edition y colócalo en esa ruta."
        return 1
    fi
    
    return 0
}

# Función para obtener el prefijo de servicio
get_service_prefix() {
    local version="$1"
    local edition="$2"
    
    local config=$(get_odoo_version_config "$version" "$edition")
    if [[ -n "$config" ]]; then
        echo "$config" | cut -d'|' -f4
    fi
}

# Función para obtener la ruta del repositorio
get_repo_path() {
    local version="$1"
    local edition="$2"
    
    local config=$(get_odoo_version_config "$version" "$edition")
    if [[ -n "$config" ]]; then
        echo "$config" | cut -d'|' -f3
    fi
}

# Función para obtener el binario de Python
get_python_bin() {
    local version="$1"
    local edition="$2"
    
    local config=$(get_odoo_version_config "$version" "$edition")
    if [[ -n "$config" ]]; then
        echo "$config" | cut -d'|' -f5
    fi
}

# Función para selector interactivo de versión
select_odoo_version_interactive() {
    echo "🎯 Selecciona la versión de Odoo:"
    echo ""
    
    local versions=()
    local index=1
    
    while IFS='|' read -r version edition repo_path service_prefix python_bin; do
        # Ignorar comentarios y líneas vacías
        [[ "$version" =~ ^#.*$ ]] || [[ -z "$version" ]] && continue
        
        versions+=("$version|$edition")
        
        local status="❌"
        [[ -f "$repo_path" ]] && status="✅"
        
        echo "  $index) Odoo $version $(echo $edition | tr '[:lower:]' '[:upper:]') $status"
        ((index++))
    done < "$VERSIONS_CONFIG"
    
    echo ""
    read -p "Selecciona una opción (1-$((index-1))): " selection
    
    if [[ ! "$selection" =~ ^[0-9]+$ ]] || [[ "$selection" -lt 1 ]] || [[ "$selection" -ge "$index" ]]; then
        echo "❌ Selección inválida"
        return 1
    fi
    
    local selected="${versions[$((selection-1))]}"
    echo "$selected"
    return 0
}

# Exportar funciones
export -f list_odoo_versions
export -f get_odoo_version_config
export -f validate_odoo_version
export -f get_service_prefix
export -f get_repo_path
export -f get_python_bin
export -f select_odoo_version_interactive
