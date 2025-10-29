from flask import Blueprint, jsonify, request, Response, redirect
from flask_jwt_extended import jwt_required, get_jwt_identity
import requests
import os

backup_bp = Blueprint('backup', __name__)

# URL de la instancia de producción de Odoo
# Usar localhost porque el backend corre en el mismo servidor
# Puerto 2100 es la instancia imac-production
ODOO_PRODUCTION_URL = 'http://localhost:2100'

@backup_bp.route('/manager', methods=['GET', 'POST'])
@jwt_required()
def backup_manager():
    """Proxy al gestor de backups de Odoo en localhost"""
    try:
        # Si es POST, reenviar la petición
        if request.method == 'POST':
            resp = requests.post(
                f"{ODOO_PRODUCTION_URL}/web/database/manager",
                data=request.form,
                files=request.files,
                allow_redirects=False
            )
            return Response(resp.content, resp.status_code, resp.headers.items())
        
        # Si es GET, obtener el HTML del gestor
        resp = requests.get(f"{ODOO_PRODUCTION_URL}/web/database/manager")
        
        if resp.status_code != 200:
            return jsonify({'error': 'No se pudo acceder al gestor de Odoo'}), 500
        
        # Modificar el HTML para que los forms apunten a nuestro proxy
        html = resp.text
        html = html.replace('action="/web/database/', 'action="/api/backup/proxy/web/database/')
        html = html.replace('href="/web/', 'href="/api/backup/proxy/web/')
        html = html.replace('src="/web/', 'src="/api/backup/proxy/web/')
        
        return Response(html, mimetype='text/html')
    except Exception as e:
        # Retornar HTML con información
        html = f'''
    <!DOCTYPE html>
    <html>
    <head>
        <title>Gestor de Backups - Odoo</title>
        <meta charset="UTF-8">
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                margin: 0;
                padding: 20px;
                background: #f3f4f6;
            }}
            .container {{
                max-width: 800px;
                margin: 0 auto;
                background: white;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }}
            h1 {{
                color: #1f2937;
                margin-bottom: 20px;
            }}
            .info {{
                background: #dbeafe;
                border-left: 4px solid #3b82f6;
                padding: 15px;
                margin: 20px 0;
            }}
            .btn {{
                display: inline-block;
                background: #3b82f6;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                margin-top: 20px;
                font-weight: 500;
            }}
            .btn:hover {{
                background: #2563eb;
            }}
            ul {{
                line-height: 1.8;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🗄️ Gestor de Backups de Odoo</h1>
            
            <div class="info">
                <strong>ℹ️ Información Importante:</strong>
                <ul>
                    <li>Esta página te redirigirá al gestor de bases de datos de la instancia de <strong>producción</strong></li>
                    <li>Necesitarás la <strong>contraseña maestra</strong> de Odoo para realizar operaciones</li>
                    <li>Puedes crear backups, restaurar, duplicar y eliminar bases de datos</li>
                    <li>Los backups se descargarán directamente a tu computadora</li>
                </ul>
            </div>
            
            <p><strong>URL del gestor:</strong> <code>{manager_url}</code></p>
            
            <a href="{manager_url}" target="_blank" class="btn">🚀 Abrir Gestor de Backups</a>
        </div>
    </body>
    </html>
    '''
    
        return Response(html, mimetype='text/html')

@backup_bp.route('/proxy/<path:path>', methods=['GET', 'POST'])
@jwt_required()
def backup_proxy(path):
    """Proxy para todas las peticiones del gestor de backups"""
    try:
        url = f"{ODOO_PRODUCTION_URL}/{path}"
        
        if request.method == 'GET':
            resp = requests.get(url, params=request.args)
        else:
            resp = requests.post(
                url,
                data=request.form,
                files=request.files,
                allow_redirects=False
            )
        
        # Si es una redirección, modificar la URL
        if resp.status_code in [301, 302, 303, 307, 308]:
            location = resp.headers.get('Location', '')
            if location.startswith('/web/'):
                location = f"/api/backup/proxy{location}"
                headers = dict(resp.headers)
                headers['Location'] = location
                return Response(resp.content, resp.status_code, headers.items())
        
        return Response(resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@backup_bp.route('/info', methods=['GET'])
@jwt_required()
def backup_info():
    """Retorna información sobre la configuración de backups"""
    return jsonify({
        'production_url': ODOO_PRODUCTION_URL,
        'manager_path': '/web/database/manager',
        'full_url': f"{ODOO_PRODUCTION_URL}/web/database/manager"
    }), 200
