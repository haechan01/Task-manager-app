from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from models import db, User
from flask_cors import cross_origin
import jwt
from functools import wraps
from datetime import datetime, timedelta
from flask import current_app

auth_blueprint = Blueprint('auth', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')

        if auth_header and auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                return jsonify({'message': 'Invalid token'}), 401
        except:
            return jsonify({'message': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)
    return decorated

@auth_blueprint.route('/signup', methods=['POST'])
@cross_origin()
def signup():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'message': 'No input data provided'}), 400
            
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400

        if len(username) < 3:
            return jsonify({'message': 'Username must be at least 3 characters long'}), 400
            
        if len(password) < 6:
            return jsonify({'message': 'Password must be at least 6 characters long'}), 400

        if User.query.filter_by(username=username).first():
            return jsonify({'message': 'Username already exists'}), 400

        new_user = User(
            username=username,
            password_hash=generate_password_hash(password)
        )
        
        db.session.add(new_user)
        db.session.commit()

        token = jwt.encode({
            'user_id': new_user.id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, current_app.config['SECRET_KEY'])

        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': {'id': new_user.id, 'username': new_user.username}
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'message': str(e)}), 500

@auth_blueprint.route('/login', methods=['POST'])
@cross_origin()
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return jsonify({'message': 'Username and password are required'}), 400

        user = User.query.filter_by(username=username).first()

        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({'message': 'Invalid username or password'}), 401

        token = jwt.encode({
            'user_id': user.id,
            'exp': datetime.utcnow() + timedelta(days=1)
        }, current_app.config['SECRET_KEY'])

        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {'id': user.id, 'username': user.username}
        }), 200

    except Exception as e:
        return jsonify({'message': str(e)}), 500

@auth_blueprint.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'username': current_user.username
    }), 200

@auth_blueprint.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    return jsonify({'message': 'Successfully logged out'}), 200