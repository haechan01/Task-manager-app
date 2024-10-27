from flask import Blueprint, request, jsonify
from models import db, Task, TodoList
from flask_cors import cross_origin
from .auth_routes import token_required

tasks = Blueprint('tasks', __name__)

@tasks.route('/lists', methods=['GET'])
@token_required
def get_lists(current_user):
    try:
        lists = TodoList.query.filter_by(user_id=current_user.id).all()
        return jsonify([{
            'id': lst.id,
            'title': lst.title,
            'tasks': [task.to_dict() for task in lst.tasks]
        } for lst in lists])
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@tasks.route('/lists', methods=['POST'])
@token_required
def create_list(current_user):
    try:
        data = request.get_json()
        new_list = TodoList(
            title=data['title'],
            user_id=current_user.id
        )
        db.session.add(new_list)
        db.session.commit()
        return jsonify({
            'id': new_list.id,
            'title': new_list.title,
            'tasks': []
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/lists/<int:list_id>', methods=['PUT'])
@token_required
def update_list(current_user, list_id):
    try:
        todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        if 'title' in data:
            todo_list.title = data['title']
            
        db.session.commit()
        return jsonify({
            'id': todo_list.id,
            'title': todo_list.title,
            'tasks': [task.to_dict() for task in todo_list.tasks]
        })
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/lists/<int:list_id>', methods=['DELETE'])
@token_required
def delete_list(current_user, list_id):
    try:
        todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first_or_404()
        db.session.delete(todo_list)
        db.session.commit()
        return jsonify({'message': 'List deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/lists/<int:list_id>/tasks', methods=['GET'])
@token_required
def get_tasks(current_user, list_id):
    try:
        todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first_or_404()
        return jsonify([task.to_dict() for task in todo_list.tasks])
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@tasks.route('/lists/<int:list_id>/tasks', methods=['POST', 'OPTIONS'])
@token_required
def create_task(current_user, list_id):
    if request.method == 'OPTIONS':
        return jsonify({}), 200
        
    try:
        todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        new_task = Task(
            title=data['title'],
            description=data.get('description', ''),
            list_id=list_id,
            parent_id=data.get('parent_id'),
            user_id=current_user.id,
            is_expanded=True
        )
        
        db.session.add(new_task)
        db.session.commit()
        
        return jsonify(new_task.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/tasks/<int:task_id>', methods=['GET'])
@token_required
def get_task(current_user, task_id):
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        return jsonify(task.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@tasks.route('/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, task_id):
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'completed' in data:
            task.completed = data['completed']
        if 'is_expanded' in data:
            task.is_expanded = data['is_expanded']
        if 'list_id' in data:
            # Verify the new list belongs to the user
            new_list = TodoList.query.filter_by(id=data['list_id'], user_id=current_user.id).first_or_404()
            task.list_id = new_list.id
            
        db.session.commit()
        return jsonify(task.to_dict())
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/tasks/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        db.session.delete(task)
        db.session.commit()
        return jsonify({'message': 'Task deleted successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/tasks/<int:task_id>/toggle', methods=['PUT'])
@token_required
def toggle_task(current_user, task_id):
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        task.is_expanded = not task.is_expanded
        db.session.commit()
        return jsonify(task.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/tasks/<int:task_id>/subtasks', methods=['POST'])
@token_required
def create_subtask(current_user, task_id):
    try:
        parent_task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        subtask = Task(
            title=data['title'],
            description=data.get('description', ''),
            list_id=parent_task.list_id,
            parent_id=task_id,
            user_id=current_user.id,
            is_expanded=True
        )
        
        db.session.add(subtask)
        db.session.commit()
        
        return jsonify(subtask.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/tasks/move/<int:task_id>', methods=['PUT'])
@token_required
def move_task(current_user, task_id):
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        # Verify the target list belongs to the user
        target_list = TodoList.query.filter_by(id=data['list_id'], user_id=current_user.id).first_or_404()
        
        # Only allow moving top-level tasks
        if task.parent_id is None:
            task.list_id = target_list.id
            db.session.commit()
            return jsonify(task.to_dict())
        else:
            return jsonify({'error': 'Can only move top-level tasks'}), 400
            
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Error handlers
@tasks.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Resource not found'}), 404

@tasks.errorhandler(400)
def bad_request_error(error):
    return jsonify({'error': 'Bad request'}), 400

@tasks.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500