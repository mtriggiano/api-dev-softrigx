#!/usr/bin/env python3
"""
Script para eliminar la configuración de GitHub de la base de datos
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app
from models import db, GitHubConfig

def delete_config():
    app = create_app()
    with app.app_context():
        instance_name = 'dev-mtg'
        
        configs = GitHubConfig.query.filter_by(instance_name=instance_name).all()
        
        if not configs:
            print(f"❌ No se encontró configuración para {instance_name}")
            return False
        
        for config in configs:
            db.session.delete(config)
        
        db.session.commit()
        
        print(f"✅ Configuración eliminada para {instance_name}")
        print(f"   Total eliminados: {len(configs)}")
        
        return True

if __name__ == '__main__':
    success = delete_config()
    sys.exit(0 if success else 1)
