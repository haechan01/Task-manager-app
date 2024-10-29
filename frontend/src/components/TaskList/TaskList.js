import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Task from '../Task/Task';
import './TaskList.css';

const TaskList = ({ 
  listId, 
  title, 
  tasks = [], 
  onTaskCreate,
  onTaskToggle,
  onTaskComplete,
  onTaskEdit,
  onTaskDelete,
  onAddSubtask,
  onTaskMove,
  onCompleteSubtask
}) => {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onTaskCreate(listId, newTaskTitle);
      setNewTaskTitle('');
      setIsAddingTask(false);
    }
  };

  return (
    <div className="task-list">
      <div className="list-header">
        <h2>{title}</h2>
        <span className="task-count">{tasks?.length || 0}</span>
      </div>

      <div className="tasks-container">
        {Array.isArray(tasks) && tasks.map(task => (
          <Task
            key={task.id}
            task={task}
            level={0}
            onToggle={onTaskToggle}
            onComplete={onTaskComplete}
            onEdit={onTaskEdit}
            onDelete={onTaskDelete}
            onAddSubtask={onAddSubtask}
            onMove={onTaskMove}
            listId={listId}
            onSubtaskComplete={onCompleteSubtask}
          />
        ))}
      </div>

      {isAddingTask ? (
        <form onSubmit={handleSubmit} className="add-task-form">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Enter task title"
            className="add-task-input"
            autoFocus
          />
          <div className="form-buttons">
            <button type="submit" className="save-button">Add Task</button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={() => {
                setIsAddingTask(false);
                setNewTaskTitle('');
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <button 
          onClick={() => setIsAddingTask(true)}
          className="add-task-button"
        >
          + Add Task
        </button>
      )}
    </div>
  );
};

TaskList.propTypes = {
  listId: PropTypes.number,
  title: PropTypes.string.isRequired,
  tasks: PropTypes.array,
  onTaskCreate: PropTypes.func.isRequired,
  onTaskToggle: PropTypes.func.isRequired,
  onTaskComplete: PropTypes.func.isRequired,
  onTaskEdit: PropTypes.func.isRequired,
  onTaskDelete: PropTypes.func.isRequired,
  onAddSubtask: PropTypes.func,
  onTaskMove: PropTypes.func,
  onCompleteSubtask: PropTypes.func.isRequired
};

TaskList.defaultProps = {
  tasks: [],
  onAddSubtask: () => {},
  onTaskMove: () => {}
};

export default TaskList;