import React, { useState } from 'react';

const AddTaskPage = () => {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [taskStatus, setTaskStatus] = useState('backlog');

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTask = {
      name: taskName,
      description: taskDescription,
      status: taskStatus
    };

    fetch('http://127.0.0.1:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newTask)
    })
      .then(response => response.json())
      .then(data => {
        console.log('Task added:', data);
        setTaskName('');
        setTaskDescription('');
        setTaskStatus('backlog');
      })
      .catch(error => console.error('Error adding task:', error));
  };

  return (
    <section id="task-form">
      <h2>Add a New Task</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="task-name">Task Name:</label>
        <input
          type="text"
          id="task-name"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          required
        />

        <label htmlFor="task-description">Task Description:</label>
        <textarea
          id="task-description"
          value={taskDescription}
          onChange={(e) => setTaskDescription(e.target.value)}
          required
        ></textarea>

        <label htmlFor="task-status">Task Status:</label>
        <select
          id="task-status"
          value={taskStatus}
          onChange={(e) => setTaskStatus(e.target.value)}
        >
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>

        <button type="submit">Add Task</button>
      </form>
    </section>
  );
};

export default AddTaskPage;
