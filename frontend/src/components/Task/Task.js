import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ChevronRight, ChevronDown, Check, Edit2, Trash2, Plus, Move } from 'lucide-react';
import './Task.css';

const Task = ({ 
  task, 
  level = 0, 
  onToggle, 
  onComplete,
  onEdit, 
  onDelete, 
  onAddSubtask,
  onMove,
  listId,
  onSubtaskComplete
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Calculate completion fraction for parent tasks
  const calculateCompletion = () => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return null;
    }
    const completedCount = task.subtasks.filter(subtask => subtask.completed).length;
    return `${completedCount}/${task.subtasks.length}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editedTitle.trim()) {
      onEdit(task.id, editedTitle);
      setIsEditing(false);
    }
  };

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      // Check if we've reached maximum nesting level (3)
      if (level >= 2) {
        alert('Maximum nesting level reached');
        return;
      }
      onAddSubtask(task.id, newSubtaskTitle);
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const handleCheckboxClick = (e) => {
    e.stopPropagation();  // Prevent event bubbling
    if (level === 0) {
      // If it's a top-level task, delete it
      onComplete(task.id);
    } else if (onSubtaskComplete) {  // Check if handler exists
      // If it's a subtask, mark it as complete
      onSubtaskComplete(task.parent_id, task.id);
    }
  };

  return (
    <div className="task-container">
      <div className={`task-card ${level > 0 ? 'subtask' : ''} ${task.completed ? 'completed' : ''}`}>
        <div className="task-content">
          <div className="task-left">
            {task.subtasks?.length > 0 && (
              <button 
                onClick={() => onToggle(task.id)} 
                className={`toggle-button ${task.is_expanded ? 'expanded' : ''}`}
              >
                {task.is_expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}

            <div className="task-info">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={handleCheckboxClick}
                className="task-checkbox"
              />
              {!isEditing ? (
                <span className={`task-title ${task.completed ? 'completed' : ''}`}>
                  {task.title}
                </span>
              ) : (
                <form onSubmit={handleSubmit} className="edit-form">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="edit-input"
                    autoFocus
                  />
                  <div className="edit-buttons">
                    <button type="submit" className="save-button">
                      <Check size={16} />
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsEditing(false)}
                      className="cancel-button"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="task-right">
            {task.subtasks?.length > 0 && (
              <span className="task-completion">
                {calculateCompletion()}
              </span>
            )}
            
            <div className="task-actions">
              <button 
                onClick={() => setIsEditing(true)} 
                className="action-button"
              >
                <Edit2 size={16} />
              </button>

              {level === 0 && (
                <button 
                  onClick={() => onMove(task.id, listId)} 
                  className="action-button"
                >
                  <Move size={16} />
                </button>
              )}

              <button 
                onClick={() => setIsAddingSubtask(true)} 
                className="action-button"
              >
                <Plus size={16} />
              </button>

              <button 
                onClick={() => onDelete(task.id)} 
                className="action-button delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>

        {isAddingSubtask && (
          <form onSubmit={handleAddSubtask} className="add-subtask-form">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="New subtask"
              className="subtask-input"
              autoFocus
            />
            <div className="subtask-buttons">
              <button type="submit" className="save-button">Add</button>
              <button 
                type="button" 
                onClick={() => setIsAddingSubtask(false)}
                className="cancel-button"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      
      {task.is_expanded && task.subtasks?.length > 0 && (
        <div className="subtasks-container">
          {task.subtasks.map(subtask => (
            <Task
              key={subtask.id}
              task={subtask}
              level={level + 1}
              onToggle={onToggle}
              onComplete={onComplete}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubtask={onAddSubtask}
              onMove={onMove}
              listId={listId}
              onSubtaskComplete={onSubtaskComplete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

Task.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.number.isRequired,
    title: PropTypes.string.isRequired,
    completed: PropTypes.bool,
    is_expanded: PropTypes.bool,
    subtasks: PropTypes.array,
    parent_id: PropTypes.number
  }).isRequired,
  level: PropTypes.number,
  onToggle: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSubtask: PropTypes.func,
  onMove: PropTypes.func,
  listId: PropTypes.number,
  onSubtaskComplete: PropTypes.func.isRequired
};

Task.defaultProps = {
  level: 0,
  onAddSubtask: () => {},
  onMove: () => {},
  listId: null
};

export default Task;