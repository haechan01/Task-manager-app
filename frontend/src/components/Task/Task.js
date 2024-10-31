import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  ChevronRight,
  ChevronDown,
  Check,
  Edit2,
  Trash2,
  Plus,
} from 'lucide-react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import './Task.css';

// Task component
const Task = ({
  task,
  level = 0,
  onToggle,
  onComplete,
  onEdit,
  onDelete,
  onAddSubtask,
  onMoveLeft,
  onMoveRight,
  listId,
  currentListType,
  onSubtaskComplete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(task.title);
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Determine if the task can move left or right
  const canMoveLeft = level === 0 && currentListType !== 'todo';
  const canMoveRight = level === 0 && currentListType !== 'done';

  // Calculate completion fraction for parent tasks
  const calculateCompletion = () => {
    if (!task.subtasks || task.subtasks.length === 0) {
      return null;
    }
    const completedCount = task.subtasks.filter(
      (subtask) => subtask.completed
    ).length;
    return `${completedCount}/${task.subtasks.length}`;
  };

  // Handle form submission for editing task title
  const handleSubmit = (e) => {
    e.preventDefault();
    if (editedTitle.trim()) {
      onEdit(task.id, editedTitle.trim());
      setIsEditing(false);
    }
  };

  // Handle form submission for adding a new subtask
  const handleSubtaskFormSubmit = async (e) => {
    e.preventDefault();

    if (newSubtaskTitle.trim()) {
      if (level >= 2) {
        alert('Maximum nesting level reached');
        return;
      }
      await onAddSubtask(task.id, newSubtaskTitle.trim());
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);

      // Ensure the task is expanded to show the new subtask
      if (!task.is_expanded) {
        onToggle(task.id);
      }
    }
  };

  
  const handleCheckboxClick = (e) => {
    e.stopPropagation();
    if (level === 0) {
      onComplete(task.id);
    } else if (onSubtaskComplete) {
      onSubtaskComplete(task.parent_id, task.id);
    }
  };

  return (
    <div className="task-container">
      <div
        className={`task-card ${level > 0 ? 'subtask' : ''} ${
          task.completed ? 'completed' : ''
        } ${isEditing ? 'editing' : ''}`}
      >
        <div className="task-content">
          <div className="task-left">
            {(task.subtasks?.length > 0 || isAddingSubtask) && (
              <button
                onClick={() => onToggle(task.id)}
                className={`toggle-button ${
                  task.is_expanded ? 'expanded' : ''
                }`}
              >
                {task.is_expanded ? (
                  <ChevronDown size={16} />
                ) : (
                  <ChevronRight size={16} />
                )}
              </button>
            )}

            <div className="task-info">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={handleCheckboxClick}
                className="task-checkbox"
              />
              <div className="task-text">
                {!isEditing ? (
                  <span
                    className={`task-title ${
                      task.completed ? 'completed' : ''
                    }`}
                  >
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

                {/* Completion fraction */}
                {calculateCompletion() && (
                  <span className="task-completion">
                    {calculateCompletion()}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="task-right">
            {/* Conditionally render action buttons */}
            {!isEditing && (
              <div className="task-actions">
                <button
                  onClick={() => setIsEditing(true)}
                  className="action-button"
                >
                  <Edit2 size={16} />
                </button>

                {level === 0 && (
                  <>
                    {/* Left Arrow Button */}
                    {canMoveLeft && (
                      <button
                        onClick={() => onMoveLeft(task.id)}
                        className="action-button"
                      >
                        <ArrowLeft size={16} />
                      </button>
                    )}
                    {/* Right Arrow Button */}
                    {canMoveRight && (
                      <button
                        onClick={() => onMoveRight(task.id)}
                        className="action-button"
                      >
                        <ArrowRight size={16} />
                      </button>
                    )}
                  </>
                )}

                {level < 2 && (
                  <button
                    onClick={() => setIsAddingSubtask(true)}
                    className="action-button"
                  >
                    <Plus size={16} />
                  </button>
                )}

                <button
                  onClick={() => onDelete(task.id)}
                  className="action-button delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        </div>

        {isAddingSubtask && (
          <form
            onSubmit={handleSubtaskFormSubmit}
            className="add-subtask-form"
          >
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              placeholder="New subtask"
              className="subtask-input"
              autoFocus
            />
            <div className="subtask-buttons">
              <button type="submit" className="save-button">
                Add
              </button>
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

      {task.is_expanded && (
        <div className="subtasks-container">
          {task.subtasks &&
            task.subtasks.map((subtask) => (
              <Task
                key={subtask.id}
                task={subtask}
                level={level + 1}
                onToggle={onToggle}
                onComplete={onComplete}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddSubtask={onAddSubtask}
                onMoveLeft={onMoveLeft}
                onMoveRight={onMoveRight}
                currentListType={currentListType}
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
    parent_id: PropTypes.number,
  }).isRequired,
  level: PropTypes.number,
  onToggle: PropTypes.func.isRequired,
  onComplete: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onAddSubtask: PropTypes.func.isRequired,
  onMoveLeft: PropTypes.func.isRequired,
  onMoveRight: PropTypes.func.isRequired,
  currentListType: PropTypes.string.isRequired,
  listId: PropTypes.number,
  onSubtaskComplete: PropTypes.func.isRequired,
};

Task.defaultProps = {
  level: 0,
  onMove: () => {},
  listId: null,
};

export default Task;
