const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'tasks.json');

app.use(express.json());
app.use((_, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});

function readTasks() {
  if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');
  return JSON.parse(fs.readFileSync(DATA_FILE));
}
function writeTasks(tasks) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(tasks, null, 2));
}

app.get('/api/tasks', (_, res) => res.json(readTasks()));
app.post('/api/tasks', (req, res) => {
  const tasks = readTasks();
  const newTask = { id: Date.now(), text: req.body.text, done: false };
  tasks.push(newTask);
  writeTasks(tasks);
  res.status(201).json(newTask);
});
app.put('/api/tasks/:id', (req, res) => {
  const tasks = readTasks();
  const task = tasks.find(t => t.id == req.params.id);
  if (!task) return res.status(404).send('Not found');
  task.done = !task.done;
  writeTasks(tasks);
  res.json(task);
});
app.delete('/api/tasks/:id', (req, res) => {
  const tasks = readTasks().filter(t => t.id != req.params.id);
  writeTasks(tasks);
  res.status(204).send();
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
