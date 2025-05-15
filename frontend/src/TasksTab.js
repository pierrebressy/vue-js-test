import React, { useEffect, useState } from 'react';

const API = 'http://localhost:3001/api/tasks';

export default function TasksTab() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const fetchTasks = async () => {
    const res = await fetch(API);
    const data = await res.json();
    setTasks(data);
  };

  const addTask = async () => {
    if (!newTask.trim()) return;
    const res = await fetch(API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: newTask })
    });
    const task = await res.json();
    setTasks(prev => [...prev, task]);
    setNewTask('');
  };

  const toggleTask = async (id) => {
    const res = await fetch(`${API}/${id}`, { method: 'PUT' });
    const updated = await res.json();
    setTasks(tasks.map(t => (t.id === id ? updated : t)));
  };

  const deleteTask = async (id) => {
    await fetch(`${API}/${id}`, { method: 'DELETE' });
    setTasks(tasks.filter(t => t.id !== id));
  };

  useEffect(() => { fetchTasks(); }, []);

  return (
    <div>
      <input
        value={newTask}
        onChange={e => setNewTask(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addTask()}
        placeholder="Add a new task..."
        style={{ width: '100%', padding: '10px' }}
      />
<ul className="custom-list">
        {tasks.map(task => (
    <li
      key={task.id}
      className={`card-item ${task.done ? 'done' : ''}`}
    >
            <span onClick={() => toggleTask(task.id)} style={{ cursor: 'pointer' }}>
              {task.text}
            </span>
            <button onClick={() => deleteTask(task.id)}>🗑</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
