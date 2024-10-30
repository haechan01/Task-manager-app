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

@tasks.route('/lists/<int:list_id>/tasks', methods=['POST'])
@token_required
def create_task(current_user, list_id):
    try:
        todo_list = TodoList.query.filter_by(id=list_id, user_id=current_user.id).first()
        
        if not todo_list:
            return jsonify({'error': f'List with id {list_id} not found'}), 404
            
        data = request.get_json()
        if not data or 'title' not in data:
            return jsonify({'error': 'Title is required'}), 400
            
        new_task = Task(
            title=data['title'],
            description=data.get('description', ''),
            list_id=list_id,
            user_id=current_user.id,
            is_expanded=True
        )
        
        db.session.add(new_task)
        db.session.commit()
        
        # Return the created task
        return jsonify(new_task.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Error creating task: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500

@tasks.route('/tasks/<int:task_id>', methods=['GET'])
@token_required
def get_task(current_user, task_id):
    try:
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        return jsonify(task.to_dict())
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@tasks.route('/update/<int:task_id>', methods=['PUT'])
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

@tasks.route('/delete/<int:task_id>', methods=['DELETE'])
@token_required
def delete_task(current_user, task_id):
    try:
        # First, verify the task exists and belongs to the current user
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        
        if not task:
            return jsonify({'error': f'Task with id {task_id} not found'}), 404
            
        # Find the list this task belongs to
        todo_list = TodoList.query.filter_by(id=task.list_id, user_id=current_user.id).first()
        
        if not todo_list:
            return jsonify({'error': 'Associated list not found'}), 404

        # Delete any subtasks first
        if hasattr(task, 'subtasks'):
            for subtask in task.subtasks:
                db.session.delete(subtask)

        # Delete the task
        db.session.delete(task)
        db.session.commit()
        
        # Return success response
        return jsonify({
            'message': 'Task deleted successfully',
            'id': task_id,
            'list_id': task.list_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting task: {str(e)}")  # Debug print
        return jsonify({'error': str(e)}), 500
    
@tasks.route('/toggle/<int:task_id>', methods=['PUT'])
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

# Create subtask (existing route, but renamed for consistency)
@tasks.route('add/<int:task_id>/subtasks/create', methods=['POST'])
@token_required
def create_subtask(current_user, task_id):
    try:
        parent_task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        if not data or 'title' not in data:
            return jsonify({'error': 'Title is required'}), 400
        
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

# Update subtask
@tasks.route('update/<int:task_id>/subtasks/update/<int:subtask_id>', methods=['PUT'])
@token_required
def update_subtask(current_user, task_id, subtask_id):
    try:
        # Verify parent task exists and belongs to user
        parent_task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        
        # Verify subtask exists and belongs to this parent
        subtask = Task.query.filter_by(
            id=subtask_id, 
            user_id=current_user.id,
            parent_id=task_id
        ).first_or_404()

        data = request.get_json()
        if 'title' in data:
            subtask.title = data['title']
        if 'completed' in data:
            subtask.completed = data['completed']
            
        db.session.commit()
        return jsonify(subtask.to_dict())
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

# Delete subtask
@tasks.route('delete/<int:task_id>/subtasks/delete/<int:subtask_id>', methods=['DELETE'])
@token_required
def delete_subtask(current_user, task_id, subtask_id):
    try:
        # Verify parent task exists and belongs to user
        parent_task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        
        # Verify subtask exists and belongs to this parent
        subtask = Task.query.filter_by(
            id=subtask_id, 
            user_id=current_user.id,
            parent_id=task_id
        ).first_or_404()

        db.session.delete(subtask)
        db.session.commit()
        
        return jsonify({
            'message': 'Subtask deleted successfully',
            'id': subtask_id
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@tasks.route('/complete/subtask/<int:subtask_id>', methods=['PUT'])
@token_required
def complete_subtask(current_user, subtask_id):
    try:
        # Find the subtask and verify ownership
        subtask = Task.query.filter_by(id=subtask_id, user_id=current_user.id).first()
        
        if not subtask:
            return jsonify({'error': 'Subtask not found'}), 404

        # Update subtask completion status
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data provided'}), 400

        subtask.completed = data.get('completed', True)
        db.session.commit()

        # Update parent task's completion fraction
        parent_task = None
        if subtask.parent_id:
            parent_task = Task.query.filter_by(id=subtask.parent_id, user_id=current_user.id).first()
            if parent_task:
                # No need to store completion_fraction in DB; calculate on the fly
                # Return the updated parent task with subtasks
                return jsonify(parent_task.to_dict(include_subtasks=True)), 200

        # If no parent task, return the updated subtask
        return jsonify(subtask.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error updating subtask completion: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tasks.route('/tasks/delete/<int:task_id>', methods=['DELETE'])
@token_required
def delete_completed_task(current_user, task_id):
    try:
        # Find the task and verify ownership
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first()
        
        if not task:
            return jsonify({'error': 'Task not found'}), 404

        # Find and delete all subtasks first
        subtasks = Task.query.filter_by(parent_id=task_id).all()
        for subtask in subtasks:
            db.session.delete(subtask)

        # Delete the main task
        db.session.delete(task)
        db.session.commit()

        return jsonify({
            'message': 'Task and its subtasks deleted successfully',
            'id': task_id
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting task: {str(e)}")
        return jsonify({'error': str(e)}), 500

@tasks.route('/move/<int:task_id>', methods=['PUT'])
@token_required
def move_task(current_user, task_id):
    try:
        # Fetch the task to be moved
        task = Task.query.filter_by(id=task_id, user_id=current_user.id).first_or_404()
        data = request.get_json()
        
        # Verify the target list belongs to the user
        target_list = TodoList.query.filter_by(id=data['list_id'], user_id=current_user.id).first_or_404()
        
        # Only allow moving top-level tasks
        if task.parent_id is None:
            # Update the task's list_id
            task.list_id = target_list.id
            
            # Recursively update list_id for all subtasks
            def update_subtasks_list_id(task):
                for subtask in task.subtasks:
                    subtask.list_id = target_list.id
                    update_subtasks_list_id(subtask)
            
            update_subtasks_list_id(task)
            db.session.commit()
            
            # Fetch the updated task with subtasks
            updated_task = Task.query.filter_by(id=task.id).first()
            return jsonify(updated_task.to_dict(include_subtasks=True))
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

# Test route to get all data
@tasks.route('/test/all', methods=['GET'])
def test_get_all():
    try:
        # Get all lists
        lists = TodoList.query.all()
        lists_data = []
        
        for lst in lists:
            tasks = Task.query.filter_by(list_id=lst.id).all()
            lists_data.append({
                'list_id': lst.id,
                'title': lst.title,
                'user_id': lst.user_id,
                'created_at': lst.created_at.isoformat(),
                'tasks': [{
                    'id': task.id,
                    'title': task.title,
                    'completed': task.completed,
                    'created_at': task.created_at.isoformat()
                } for task in tasks]
            })
            
        return jsonify({
            'lists': lists_data
        })
    except Exception as e:
        print(f"Error in test route: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Test route to get a specific task
@tasks.route('/test/task/<int:task_id>', methods=['GET'])
def test_get_task(task_id):
    try:
        task = Task.query.get(task_id)
        if task:
            return jsonify({
                'id': task.id,
                'title': task.title,
                'list_id': task.list_id,
                'user_id': task.user_id,
                'completed': task.completed,
                'created_at': task.created_at.isoformat()
            })
        return jsonify({'message': 'Task not found'}), 404
    except Exception as e:
        print(f"Error in test route: {str(e)}")
        return jsonify({'error': str(e)}), 500
