import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # JWT
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'dev-jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=8)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # Database
    SQLALCHEMY_DATABASE_URI = f"postgresql://{os.getenv('DB_USER', 'go')}:{os.getenv('DB_PASSWORD', '!Phax3312!IMAC')}@{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/{os.getenv('DB_NAME', 'server_panel')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Server paths
    PROD_ROOT = os.getenv('PROD_ROOT', '/home/go/apps/production/odoo-enterprise')
    DEV_ROOT = os.getenv('DEV_ROOT', '/home/go/apps/develop/odoo-enterprise')
    SCRIPTS_PATH = os.getenv('SCRIPTS_PATH', '/home/go/scripts')
    PUERTOS_FILE = os.getenv('PUERTOS_FILE', '/home/go/puertos_ocupados_odoo.txt')
    DEV_INSTANCES_FILE = os.getenv('DEV_INSTANCES_FILE', '/home/go/dev-instances.txt')
    
    # CORS
    CORS_ORIGINS = [
        'http://localhost:5173',
        'http://localhost:3000',
        'https://api-dev.hospitalprivadosalta.ar',
        'http://api-dev.hospitalprivadosalta.ar'
    ]
    
    # GitHub OAuth (opcional - para futuras mejoras con OAuth flow)
    GITHUB_CLIENT_ID = os.getenv('GITHUB_CLIENT_ID', '')
    GITHUB_CLIENT_SECRET = os.getenv('GITHUB_CLIENT_SECRET', '')
    GITHUB_REDIRECT_URI = os.getenv('GITHUB_REDIRECT_URI', 'http://localhost:5173/auth/github/callback')
