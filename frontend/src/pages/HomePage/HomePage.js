import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import TaskList from '../../components/TaskList/TaskList';
import { DragDropContext } from 'react-beautiful-dnd';
import './HomePage.css';

// Constants
const DEFAULT_LISTS = [
  { title: 'To Do', type: 'todo' },
  { title: 'In Progress', type: 'in_progress' },
  { title: 'Done', type: 'done' }
];

const MAX_SUBTASK_LEVEL = 3; // Maximum nesting level for subtasks

/**
 * HomePage Component - Main container for the task management application
 */
const HomePage = () => {
  const [lists, setLists] = useState([]);
  const token = localStorage.getItem('token');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchLists();
  }, []);

  // Helper Functions
  const findTaskInArray = (tasks, taskId) => {
    if (!tasks) return null;
    for (const task of tasks) {
      if (task.id === taskId) return task;
      if (task.subtasks) {
        const found = findTaskInArray(task.subtasks, taskId);
        if (found) return found;
      }
    }
    return null;
  };

  const findTaskInLists = (lists, taskId) => {
    for (const list of lists) {
      const task = findTaskInArray(list.tasks, taskId);
      if (task) return task;
    }
    return null;
  };

  const updateTaskInList = (tasks, taskId, updatedTask) => {
    return tasks.map(task => {
      if (task.id === taskId) {
        return { ...task, ...updatedTask };
      }
      if (task.subtasks) {
        return {
          ...task,
          subtasks: updateTaskInList(task.subtasks, taskId, updatedTask)
        };
      }
      return task;
    });
  };

  const updateTaskWithNewSubtask = (tasks, parentId, newSubtask) => {
    return tasks.map(task => {
      if (task.id === parentId) {
        return {
          ...task,
          is_expanded: true,
          subtasks: [...(task.subtasks || []), newSubtask]
        };
      } else if (task.subtasks && task.subtasks.length > 0) {
        return {
          ...task,
          subtasks: updateTaskWithNewSubtask([...task.subtasks], parentId, newSubtask)
        };
      }
      return task;
    });
  };
  

  const removeTaskAndSubtasks = (tasks, taskId) => {
    return tasks.filter(task => {
      if (task.id === taskId) return false;
      if (task.subtasks) {
        task.subtasks = removeTaskAndSubtasks(task.subtasks, taskId);
      }
      return true;
    });
  };

  const updateSubtaskInList = (tasks, taskId, subtaskId, updateFn) => {
    return tasks.map(task => {
      if (task.id === taskId && task.subtasks) {
        return {
          ...task,
          subtasks: updateFn(task.subtasks)
        };
      }
      if (task.subtasks) {
        return {
          ...task,
          subtasks: updateSubtaskInList(task.subtasks, taskId, subtaskId, updateFn)
        };
      }
      return task;
    });
  };

  const getTaskLevel = task => {
    let level = 0;
    while (task.parent_id) {
      task = findTaskInLists(lists, task.parent_id);
      if (!task) break;
      level += 1;
    }
    return level;
  };

  const canAddSubtask = taskId => {
    const task = findTaskInLists(lists, taskId);
    if (!task) return false;
    const level = getTaskLevel(task);
    return level < MAX_SUBTASK_LEVEL - 1;
  };

  /**
   * Fetches all task lists for the current user
   */
  const fetchLists = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://127.0.0.1:5000/api/tasks/lists', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!data || data.length === 0) {
        await createDefaultLists();
      } else {
        // Only use the first three lists that match our default types
        const organizedLists = DEFAULT_LISTS.map(defaultList => {
          const existingList =
            data.find(l => l.title === defaultList.title) ||
            { id: null, title: defaultList.title, tasks: [] };
          return existingList;
        });
        setLists(organizedLists);
      }
    } catch (error) {
      console.error('Error fetching lists:', error);
      setError('Failed to load task lists');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Creates default lists if none exist
   */
  const createDefaultLists = async () => {
    try {
      const createdLists = await Promise.all(
        DEFAULT_LISTS.map(async list => {
          const response = await fetch('http://127.0.0.1:5000/api/tasks/lists', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ title: list.title })
          });
          if (!response.ok) {
            throw new Error(`Failed to create list: ${list.title}`);
          }
          return response.json();
        })
      );

      setLists(createdLists);
    } catch (error) {
      console.error('Error creating default lists:', error);
      setError('Failed to create default lists');
    }
  };

  /**
   * Creates a new task in a specific list
   */
  const handleCreateTask = async (listId, title) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/lists/${listId}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const newTask = await response.json();

    // Initialize subtasks as an empty array if undefined
    newTask.subtasks = newTask.subtasks || [];

    setLists(currentLists =>
      currentLists.map(list =>
        list.id === listId
          ? { ...list, tasks: [...(list.tasks || []), newTask] }
          : list
      )
    );
  } catch (error) {
    console.error('Error creating task:', error);
  }
};

  /**
   * Toggles task expansion (show/hide subtasks)
   */
  const handleToggleTask = async taskId => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/toggle/${taskId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to toggle task');

      const updatedTask = await response.json();
      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: updateTaskInList(list.tasks, taskId, {
            ...updatedTask,
            isExpanded: !updatedTask.isExpanded
          })
        }))
      );
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  /**
   * Marks a task as complete (deletes the task)
   */
  const handleCompleteTask = async taskId => {
    try {
      const task = findTaskInLists(lists, taskId);
      if (!task) {
        console.error('Task not found');
        return;
      }

      // For top-level tasks, we delete them when completed
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/delete/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete completed task');
      }

      // Remove task from UI
      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: removeTaskAndSubtasks(list.tasks, taskId)
        }))
      );
    } catch (error) {
      console.error('Error completing/deleting task:', error);
    }
  };

  /**
   * Marks a subtask as complete/incomplete
   */
  const handleCompleteSubtask = async (parentTaskId, subtaskId) => {
    try {
      // Find the subtask to get its current completed status
      const parentTask = findTaskInLists(lists, parentTaskId);
      const subtask = parentTask?.subtasks?.find(st => st.id === subtaskId);
      if (!subtask) {
        console.error('Subtask not found in state');
        return;
      }

      const newCompletedState = !subtask.completed; // Toggle the completion status

      // Fetch the updated subtask and parent task from the backend
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/complete/subtask/${subtaskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ completed: newCompletedState })
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subtask completion');
      }
  
      const updatedParentTask = await response.json();
  
      // Update the state with the updated parent task
      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: updateTaskInList(list.tasks, parentTaskId, updatedParentTask)
        }))
      );
    } catch (error) {
      console.error('Error updating subtask completion:', error);
    }
  };

  /**
   * Updates a task's title
   */
  const handleEditTask = async (taskId, newTitle) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/update/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ title: newTitle })
      });

      if (!response.ok) throw new Error('Failed to edit task');

      const updatedTask = await response.json();
      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: updateTaskInList(list.tasks, taskId, updatedTask)
        }))
      );
    } catch (error) {
      console.error('Error editing task:', error);
    }
  };

  /**
   * Deletes a task and all its subtasks
   */
  const handleDeleteTask = async taskId => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/delete/${taskId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task');
      }

      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: removeTaskAndSubtasks(list.tasks, taskId)
        }))
      );
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  /**
   * Adds a subtask to a task if nesting level allows
   */
  const handleAddSubtask = async (taskId, title) => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/tasks/add/${taskId}/subtasks/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title,
          description: ''
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server error:', errorData);  // Debug log
        throw new Error(errorData.error || 'Failed to add subtask');
      }
  
      const newSubtask = await response.json();
  
      // Initialize subtasks as an empty array if undefined
      newSubtask.subtasks = newSubtask.subtasks || [];
  
      // Update state with new subtask
      setLists(currentLists => {
        const updatedLists = currentLists.map(list => ({
          ...list,
          tasks: updateTaskWithNewSubtask(list.tasks, taskId, newSubtask)
        }));
      
        return updatedLists;
      });

    } catch (error) {
      console.error('Error adding subtask:', error);
    }
  };
  

  /**
   * Updates the completion status of a task and all its subtasks
   */
  const updateTaskCompletionFraction = taskId => {
    const task = findTaskInLists(lists, taskId);
    if (!task) return;

    const completedSubtasks = task.subtasks?.filter(subtask => subtask.completed).length || 0;
    const totalSubtasks = task.subtasks?.length || 0;

    // Update UI with new completion fraction
    setLists(currentLists =>
      currentLists.map(list => ({
        ...list,
        tasks: updateTaskInList(list.tasks, taskId, {
          ...task,
          completionFraction: totalSubtasks > 0 ? `${completedSubtasks}/${totalSubtasks}` : null
        })
      }))
    );
  };

  /**
   * Updates a subtask's title
   */
  const handleUpdateSubtask = async (taskId, subtaskId, newTitle) => {
    try {

      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/update/${taskId}/subtasks/update/${subtaskId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ title: newTitle })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update subtask');
      }

      const updatedSubtask = await response.json();

      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: updateTaskInList(list.tasks, taskId, {
            ...findTaskInLists(currentLists, taskId),
            subtasks: (findTaskInLists(currentLists, taskId)?.subtasks || []).map(subtask =>
              subtask.id === subtaskId ? updatedSubtask : subtask
            )
          })
        }))
      );
    } catch (error) {
      console.error('Error updating subtask:', error);
    }
  };

  /**
   * Deletes a subtask
   */
  const handleDeleteSubtask = async (taskId, subtaskId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/delete/${taskId}/subtasks/delete/${subtaskId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete subtask');
      }

      setLists(currentLists =>
        currentLists.map(list => ({
          ...list,
          tasks: updateSubtaskInList(
            list.tasks,
            taskId,
            subtaskId,
            subtasks => subtasks.filter(subtask => subtask.id !== subtaskId)
          )
        }))
      );
    } catch (error) {
      console.error('Error deleting subtask:', error);
    }
  };

  const handleMoveTaskLeft = (taskId, currentListId) => {
    const currentIndex = lists.findIndex((list) => list.id === currentListId);
    if (currentIndex > 0) {
      const destinationListId = lists[currentIndex - 1].id;
      handleMoveTask(taskId, currentListId, destinationListId);
    }
  };
  
  const handleMoveTaskRight = (taskId, currentListId) => {
    const currentIndex = lists.findIndex((list) => list.id === currentListId);
    if (currentIndex < lists.length - 1) {
      const destinationListId = lists[currentIndex + 1].id;
      handleMoveTask(taskId, currentListId, destinationListId);
    }
  };

  /**
   * Moves a task and all its subtasks to a different list
   */
  const handleMoveTask = async (taskId, sourceListId, destinationListId) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/api/tasks/move/${taskId}/to/${destinationListId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move task');
      }
  
      const movedTask = await response.json();
  
      setLists((currentLists) => {
        const updatedLists = currentLists.map((list) => {
          if (list.id === sourceListId) {
            return {
              ...list,
              tasks: removeTaskAndSubtasks(list.tasks, taskId),
            };
          } else if (list.id === destinationListId) {
            return {
              ...list,
              tasks: [...(list.tasks || []), movedTask],
            };
          }
          return list;
        });
  
        return updatedLists;
      });
    } catch (error) {
      console.error('Error moving task:', error);
    }
  };
  

  /**
   * Handles the end of a drag event
   */
  const onDragEnd = result => {
    const { destination, source, draggableId } = result;

    // If there's no destination, the item was dropped outside any list
    if (!destination) {
      return;
    }

    // If the item was dropped back to its original place
    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Move the task
    const taskId = parseInt(draggableId);
    const sourceListId = parseInt(source.droppableId);
    const destinationListId = parseInt(destination.droppableId);

    handleMoveTask(taskId, sourceListId, destinationListId);
  };

  if (error) {
    return (
      <div className="home-page">
        <div className="error-state">
          {error}
          <button
            onClick={fetchLists}
            className="retry-button"
            style={{ marginLeft: '10px' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <header className="header">
        <h1>Task Management</h1>
      </header>

      {loading ? (
        <div className="loading-state">Loading tasks...</div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="lists-container">
            {lists.map(list => (
              <TaskList
                key={list.id || list.title}
                listId={list.id}
                title={list.title}
                tasks={list.tasks || []}
                onTaskCreate={handleCreateTask}
                onTaskToggle={handleToggleTask}
                onTaskComplete={handleCompleteTask}
                onTaskEdit={handleEditTask}
                onTaskDelete={handleDeleteTask}
                onSubtaskAdd={handleAddSubtask}
                onSubtaskUpdate={handleUpdateSubtask}
                onSubtaskDelete={handleDeleteSubtask}
                canAddSubtask={canAddSubtask}
                onCompleteSubtask={handleCompleteSubtask}
                onMoveLeft={(taskId) => handleMoveTaskLeft(taskId, list.id)}
                onMoveRight={(taskId) => handleMoveTaskRight(taskId, list.id)}
              />
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
};
// PropTypes for type checking
HomePage.propTypes = {
  // Add PropTypes if you want to use them
};

export default HomePage;
