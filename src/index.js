const express = require('express');
const cors = require('cors');

const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = users.find(user => user.username === username);

  if (!user) {
    return response.status(404).json({ error: "User not found!" });
  }

  request.user = user;

  return next();
}

function checksExistsUserTask(request, response, next) {
  const { id } = request.params;
  const { user } = request;

  const task = user.todos.find(task => task.id === id);

  if (!task) {
    return response.status(404).json({ error: "Task not found!" })
  }

  request.task = task;

  return next();
}

app.post('/users', (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some(
    user => user.username === username
  );

  if (userAlreadyExists) {
    return response.status(400).json({ error: "User already exists!" });
  }

  const newUser = {
    id: uuidv4(),
    name,
    username,
    todos: []
  };

  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request;

  return response.json(user.todos);
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;
  const { user } = request;

  const newTask = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  };

  user.todos.push(newTask);
  
  return response.status(201).json(newTask);
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsUserTask, (request, response) => {
  const { title, deadline } = request.body;
  const { task } = request;

  task.title = title;
  task.deadline = deadline;

  return response.status(201).json({
    title,
    deadline,
    done: task.done
  });
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsUserTask, (request, response) => {
  const { task } = request;

  task.done = true;

  return response.status(201).json(task);
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsUserTask, (request, response) => {
  const { task, user } = request;

  user.todos.splice(task, 1);

  return response.status(204).send();
});

module.exports = app;