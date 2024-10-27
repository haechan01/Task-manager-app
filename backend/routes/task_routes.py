# backend/routes/task_routes.py

from flask import Blueprint, jsonify, request
from models import db, Task

task_blueprint = Blueprint('tasks', __name__)

@task_blueprint.route('/', methods=['GET'])
def get_tasks():
    tasks = Task.query.all()
    task_list = [task.to_dict() for task in tasks]
    return jsonify(task_list)

@task_blueprint.route('/', methods=['POST'])
def create_task():
    data = request.json
    new_task = Task(title=data['title'], user_id=data['user_id'])
    db.session.add(new_task)
    db.session.commit()
    return jsonify(new_task.to_dict()), 201

@task_blueprint.route('/<int:task_id>', methods=['PUT'])
def update_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.json
    task.title = data.get('title', task.title)
    db.session.commit()
    return jsonify(task.to_dict())

@task_blueprint.route('/<int:task_id>', methods=['DELETE'])
def delete_task(task_id):
    task = Task.query.get(task_id)
    if task is None:
        return jsonify({'error': 'Task not found'}), 404

    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})
