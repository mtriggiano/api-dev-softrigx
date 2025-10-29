from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from datetime import datetime, timedelta
from services.system_monitor import SystemMonitor
from models import db, MetricsHistory

metrics_bp = Blueprint('metrics', __name__)
monitor = SystemMonitor()

@metrics_bp.route('/current', methods=['GET'])
@jwt_required()
def get_current_metrics():
    """Obtiene las métricas actuales del sistema"""
    try:
        metrics = monitor.get_all_metrics()
        return jsonify(metrics), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@metrics_bp.route('/history', methods=['GET'])
@jwt_required()
def get_metrics_history():
    """Obtiene el historial de métricas"""
    try:
        # Parámetros
        minutes = request.args.get('minutes', default=60, type=int)
        limit = min(minutes, 1440)  # Máximo 24 horas
        
        # Calcular timestamp de inicio
        start_time = datetime.utcnow() - timedelta(minutes=limit)
        
        # Consultar historial
        metrics = MetricsHistory.query.filter(
            MetricsHistory.timestamp >= start_time
        ).order_by(MetricsHistory.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'metrics': [m.to_dict() for m in reversed(metrics)],
            'count': len(metrics)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@metrics_bp.route('/save', methods=['POST'])
def save_current_metrics():
    """Guarda las métricas actuales en el historial (llamado por cron)"""
    try:
        metrics = monitor.get_all_metrics()
        
        # Crear registro
        history = MetricsHistory(
            cpu_percent=metrics['cpu']['percent'],
            ram_percent=metrics['memory']['percent'],
            ram_used_gb=metrics['memory']['used_gb'],
            ram_total_gb=metrics['memory']['total_gb'],
            disk_percent=metrics['disk'][0]['percent'] if metrics['disk'] else None,
            disk_used_gb=metrics['disk'][0]['used_gb'] if metrics['disk'] else None,
            disk_total_gb=metrics['disk'][0]['total_gb'] if metrics['disk'] else None,
            network_sent_mb=metrics['network']['mb_sent'],
            network_recv_mb=metrics['network']['mb_recv']
        )
        
        db.session.add(history)
        db.session.commit()
        
        return jsonify({'message': 'Métricas guardadas', 'id': history.id}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500
