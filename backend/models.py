from datetime import datetime
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import relationship

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    lists = relationship('TodoList', backref='user', lazy=True)

class TodoList(db.Model):
    __tablename__ = 'todo_lists'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    tasks = relationship('Task', backref='todo_list', 
                        primaryjoin="and_(TodoList.id==Task.list_id, Task.parent_id==None)",
                        lazy=True)

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    completed = db.Column(db.Boolean, default=False)
    list_id = db.Column(db.Integer, db.ForeignKey('todo_lists.id'), nullable=False)
    parent_id = db.Column(db.Integer, db.ForeignKey('tasks.id'))
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_expanded = db.Column(db.Boolean, default=True)
    
    subtasks = relationship('Task', 
                          backref=db.backref('parent', remote_side=[id]),
                          cascade='all, delete-orphan')
    
    def to_dict(self, include_subtasks=True):
        result = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'completed': self.completed,
            'list_id': self.list_id,
            'is_expanded': self.is_expanded,
            'created_at': self.created_at.isoformat()
        }
        if include_subtasks and self.subtasks:
            result['subtasks'] = [subtask.to_dict() for subtask in self.subtasks]
        return result