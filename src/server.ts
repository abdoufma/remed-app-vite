import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { app as electronApp } from 'electron';
import { closeDatabase, deleteTodo, getTodoById, getTodos, initDatabase, saveTodo, updateTodo } from './db';
import { logServer } from './utils';
import { parentPort } from 'worker_threads';

const app = express();
const port = process.env.PORT || 3000;

// Determine if we're in development or production
const isDev = process.env.NODE_ENV === 'development';

// Get the correct path to the public directory
// const PUBLIC_DIR = process.env.PUBLIC_DIR!
const PUBLIC_DIR = electronApp.isPackaged ? join(process.resourcesPath, '..', 'dist') : join(__dirname, '../..', 'dist');

console.log('Serving static files from:', PUBLIC_DIR);


app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.get("/hello", (_, res) => res.send("<h2>Hello World!</h2>"));


app.get('/api/todos', (_, res) => {
    try {
        const todos = getTodos();
        res.json(todos);
    } catch (err) {
        res.status(500).json({ message: (err as Error).message });
    }
});

// POST create todo
app.post('/api/todos', async (req, res) => {
    try {
        const saved = saveTodo(req.body);
        res.status(201).json(saved);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// GET todo by ID
app.get('/api/todos/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const todo = getTodoById(id);
        res.json(todo);
    } catch (err) {
        res.status(404).json({ message: (err as Error).message });
    }
});

// PUT update todo
app.put('/api/todos/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const updated = updateTodo(id, req.body);
        res.status(200).json(updated);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});

// DELETE todo
app.delete('/api/todos/:id', (req, res) => {
    try {
        const id = Number(req.params.id);
        const deleted = deleteTodo(id);
        res.status(200).json(deleted);
    } catch (err) {
        res.status(400).json({ message: (err as Error).message });
    }
});


initDatabase();
logServer('Database initialized');

const server = app.listen(port, () => logServer(`Server running on port ${port}`));
// export default server;


// Add a catch-all route for SPA
app.get('*', (_, res) => {
    res.sendFile(join(PUBLIC_DIR, 'index.html'));
});


server.on('close', () => {
    logServer('Express Server closed');
});

parentPort.on('exit', () => {
    logServer('Server Process exited');
});


parentPort.on('message', (m : any) => {
    logServer('[SERVER] got message:', m.toString());
});

process.on("SIGABRT", () => {
    logServer("SIGABRT received");
    closeDatabase();
    server.close();
});