from flask import Flask
from flask_cors import CORS
from models import db
from routes.auth_routes import auth_blueprint
from routes.task_routes import tasks
import os

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

# Simple CORS configuration
CORS(app)

# Initialize extensions
db.init_app(app)

# Register blueprints
app.register_blueprint(auth_blueprint, url_prefix='/api/auth')
app.register_blueprint(tasks, url_prefix='/api/tasks')

# Create database tables
with app.app_context():
    if not os.path.exists(db_path):
        db.create_all()
        os.chmod(db_path, 0o666)
# Near the end of app.py, add this debug print
print("Registered routes:")
for rule in app.url_map.iter_rules():
    print(rule)
    
if __name__ == '__main__':
    app.run(debug=True)