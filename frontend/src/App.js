import React, { useEffect, useState } from 'react';

function App() {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');

  const API = 'http://localhost:3001/api/tasks';

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
    <div style={{ maxWidth: 400, margin: '40px auto', fontFamily: 'Arial' }}>
      <h2>To-Do List (React + API)</h2>
      <input
        value={newTask}
        onChange={e => setNewTask(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && addTask()}
        placeholder="Add a new task..."
        style={{ width: '100%', padding: '10px' }}
      />
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {tasks.map(task => (
          <li key={task.id} style={{
            background: '#eee',
            padding: '10px',
            margin: '5px 0',
            textDecoration: task.done ? 'line-through' : '',
            display: 'flex', justifyContent: 'space-between'
          }}>
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

export default App;
