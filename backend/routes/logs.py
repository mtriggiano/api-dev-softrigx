from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from models import db, ActionLog
from datetime import datetime, timedelta

logs_bp = Blueprint('logs', __name__)

@logs_bp.route('', methods=['GET'])
@jwt_required()
def get_logs():
    """Obtiene los logs de acciones"""
    try:
        # Parámetros de filtrado
        instance = request.args.get('instance')
        action = request.args.get('action')
        user_id = request.args.get('user_id', type=int)
        hours = request.args.get('hours', default=24, type=int)
        limit = request.args.get('limit', default=100, type=int)
        
        # Limitar máximos
        hours = min(hours, 168)  # Máximo 7 días
        limit = min(limit, 500)
        
        # Construir query
        query = ActionLog.query
        
        # Filtros
        if instance:
            query = query.filter(ActionLog.instance_name == instance)
        if action:
            query = query.filter(ActionLog.action == action)
        if user_id:
            query = query.filter(ActionLog.user_id == user_id)
        
        # Filtro de tiempo
        start_time = datetime.utcnow() - timedelta(hours=hours)
        query = query.filter(ActionLog.timestamp >= start_time)
        
        # Ordenar y limitar
        logs = query.order_by(ActionLog.timestamp.desc()).limit(limit).all()
        
        return jsonify({
            'logs': [log.to_dict() for log in logs],
            'count': len(logs)
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@logs_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_log_stats():
    """Obtiene estadísticas de logs"""
    try:
        hours = request.args.get('hours', default=24, type=int)
        hours = min(hours, 168)
        
        start_time = datetime.utcnow() - timedelta(hours=hours)
        
        # Total de acciones
        total = ActionLog.query.filter(ActionLog.timestamp >= start_time).count()
        
        # Acciones exitosas vs errores
        success = ActionLog.query.filter(
            ActionLog.timestamp >= start_time,
            ActionLog.status == 'success'
        ).count()
        
        errors = ActionLog.query.filter(
            ActionLog.timestamp >= start_time,
            ActionLog.status == 'error'
        ).count()
        
        # Acciones por tipo
        from sqlalchemy import func
        actions_by_type = db.session.query(
            ActionLog.action,
            func.count(ActionLog.id).label('count')
        ).filter(
            ActionLog.timestamp >= start_time
        ).group_by(ActionLog.action).all()
        
        return jsonify({
            'total': total,
            'success': success,
            'errors': errors,
            'by_type': [{'action': a[0], 'count': a[1]} for a in actions_by_type]
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
