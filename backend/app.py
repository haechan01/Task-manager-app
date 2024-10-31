from flask import Flask
from flask_cors import CORS
from models import db
from routes.auth_routes import auth_blueprint
from routes.task_routes import tasks
import os

# Create Flask application instance
app = Flask(__name__)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
instance_dir = os.path.join(basedir, 'instance')
if not os.path.exists(instance_dir):
    os.makedirs(instance_dir, mode=0o777)

db_path = os.path.join(instance_dir, 'todo.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = 'your-secret-key-here'

# Enable CORS
CORS(app)

# Initialize database
db.init_app(app)

# Register blueprints for authentication and task routes
app.register_blueprint(auth_blueprint, url_prefix='/api/auth')
app.register_blueprint(tasks, url_prefix='/api/tasks')

# Create database tables if they do not exist
with app.app_context():
    if not os.path.exists(db_path):
        db.create_all()
        os.chmod(db_path, 0o666)

# Print all registered routes for debugging
print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(rule)

# Run the application
if __name__ == '__main__':
    app.run(debug=True)
