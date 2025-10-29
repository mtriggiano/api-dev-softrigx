from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import bcrypt

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default='viewer')  # admin, developer, viewer
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    
    def set_password(self, password):
        self.password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    def check_password(self, password):
        return bcrypt.checkpw(password.encode('utf-8'), self.password_hash.encode('utf-8'))
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None
        }

class ActionLog(db.Model):
    __tablename__ = 'action_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(100), nullable=False)  # create_instance, delete_instance, update_db, etc.
    instance_name = db.Column(db.String(100))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    details = db.Column(db.Text)
    status = db.Column(db.String(20), default='success')  # success, error
    
    user = db.relationship('User', backref='actions')
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'username': self.user.username if self.user else None,
            'action': self.action,
            'instance_name': self.instance_name,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'details': self.details,
            'status': self.status
        }

class MetricsHistory(db.Model):
    __tablename__ = 'metrics_history'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    cpu_percent = db.Column(db.Float)
    ram_percent = db.Column(db.Float)
    ram_used_gb = db.Column(db.Float)
    ram_total_gb = db.Column(db.Float)
    disk_percent = db.Column(db.Float)
    disk_used_gb = db.Column(db.Float)
    disk_total_gb = db.Column(db.Float)
    network_sent_mb = db.Column(db.Float)
    network_recv_mb = db.Column(db.Float)
    
    def to_dict(self):
        return {
            'timestamp': self.timestamp.isoformat() if self.timestamp else None,
            'cpu_percent': self.cpu_percent,
            'ram_percent': self.ram_percent,
            'ram_used_gb': self.ram_used_gb,
            'ram_total_gb': self.ram_total_gb,
            'disk_percent': self.disk_percent,
            'disk_used_gb': self.disk_used_gb,
            'disk_total_gb': self.disk_total_gb,
            'network_sent_mb': self.network_sent_mb,
            'network_recv_mb': self.network_recv_mb
        }
