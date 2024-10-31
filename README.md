# Hierarchical Todo List

A modern task management application built with React and Flask that allows users to create and manage hierarchical todo lists with nested subtasks.

## Demo video
Here is the link to the App's demo video: 
https://www.loom.com/share/057232bf74134a328771506ef249b411?sid=7cd894ae-88bc-4523-91c0-220fb2a9015e

## Table of Contents

1. [Features](#features)
2. [Project Structure](#project-structure)
3. [Setup Instructions](#setup-instructions)
4. [API Documentation](#api-documentation)
5. [Technology Stack](#technology-stack)
6. [Future Improvements](#future-improvements)
7. [Contributing](#contributing)
8. [License](#license)

---

## Features

### User Authentication

- **Secure Signup and Login**
  - Passwords are hashed and stored securely.
  - User sessions are managed via JWT tokens.
- **JWT-based Authentication**
  - Stateless authentication using JSON Web Tokens.
  - Tokens are stored in HTTP-only cookies for security.
- **Protected Routes**
  - Backend routes are protected and require valid JWT tokens.
  - Frontend routes are guarded using React Router.

### Task Management

- **Multiple Todo Lists**
  - Users can create and manage multiple task lists.
  - Each list is independent and can have its own tasks and subtasks.
- **Task Creation and Editing**
  - Add tasks to any list with a title and optional description.
  - Edit task titles and descriptions.
- **Nested Subtasks**
  - Support for up to 3 levels of subtasks.
  - Subtasks can be expanded or collapsed.
- **Task Completion Tracking**
  - Mark tasks and subtasks as completed.
  - Parent tasks show completion status of their subtasks.
- **Subtask Completion Fraction Display**
  - Visual indicator showing the number of completed subtasks over the total.
- **Task Movement**
  - Move tasks between different lists (e.g., from "Todo" to "In Progress").
- **Task Deletion**
  - Delete tasks and subtasks individually.

### Interactive UI

- **Expand/Collapse Subtasks**
  - Toggle visibility of subtasks to keep the interface clean.
- **Visual Task Hierarchy**
  - Indentation and visual cues indicate task nesting levels.
- **Responsive Design**
  - Works seamlessly on desktop and mobile devices.
- **Smooth Animations**
  - Subtle animations enhance user experience.

---

## Project Structure

project/
├── backend/
│   ├── instance/
│   │   └── todo.db
│   ├── routes/
│   │   ├── auth_routes.py    # Authentication endpoints
│   │   └── task_routes.py    # Task management endpoints
│   ├── app.py               # Flask application setup
│   ├── config.py            # Configuration settings
│   ├── models.py            # Database models
│   └── requirements.txt     # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Task/        # Task component and styling
│   │   │   └── TaskList/    # TaskList component and styling
│   │   ├── pages/
│   │   │   ├── HomePage/    # Main application page
│   │   │   ├── LoginPage/   # User login
│   │   │   └── SignupPage/  # User registration
│   │   ├── services/
│   │   │   └── api.js       # API service functions
│   │   ├── context/
│   │   │   └── AuthContext.js # Authentication context
│   │   └── App.js           # Root component
│   └── package.json         # Frontend dependencies



---

## Setup Instructions

### Prerequisites

- **Backend:**
  - Python 3.7+
  - pip (Python package installer)
- **Frontend:**
  - Node.js 14+
  - npm (Node package manager)

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

### Frontend setup
```bash
cd frontend
npm install
npm start
```

The application will be available at http://localhost:3000


## API Endpoints
### Authentication

POST /api/auth/signup - Create new user account
POST /api/auth/login - Login user
GET /api/auth/me - Get current user info

### Tasks

GET /api/tasks/lists - Get all task lists
POST /api/tasks/lists - Create new list
POST /api/tasks/lists/<list_id>/tasks - Create task
PUT /api/tasks/update/<task_id> - Update task
DELETE /api/tasks/delete/<task_id> - Delete task
POST /api/tasks/add/<task_id>/subtasks/create - Add subtask

## Technologies Used
### Frontend

React
React Router
Lucide React (icons)
JWT for authentication
CSS for styling

### Backend

Flask
SQLAlchemy
Flask-CORS
JWT for authentication
SQLite database

## Features to be Added

Drag and drop for task reordering
Task due dates
Task priorities
Search functionality
Task filters
User preferences
Dark mode