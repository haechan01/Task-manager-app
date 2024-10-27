from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from routes.auth_routes import auth_blueprint
from routes.task_routes import tasks
import os

app = Flask(__name__)

# Create instance directory if it doesn't exist
basedir = os.path.abspath(os.path.dirname(__file__))
instance_dir = os.path.join(basedir, 'instance')
if not os.path.exists(instance_dir):
    os.makedirs(instance_dir, mode=0o777)

# Database configuration
db_path = os.path.join(instance_dir, 'todo.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Configure CORS
CORS(app, 
    resources={r"/api/*": {
        "origins": "http://localhost:3000",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})

# Initialize extensions
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_blueprint, url_prefix='/api/auth')
app.register_blueprint(tasks, url_prefix='/api/tasks')

# Create database tables
def init_db():
    with app.app_context():
        # Create database file with proper permissions
        if not os.path.exists(db_path):
            db.create_all()
            # Set proper permissions
            os.chmod(db_path, 0o666)
            # Set proper permissions for the instance directory
            os.chmod(instance_dir, 0o777)

init_db()

if __name__ == '__main__':
    app.run(debug=True)