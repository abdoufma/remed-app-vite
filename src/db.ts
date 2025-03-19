import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { app } from 'electron';
import { DatabaseSync } from 'node:sqlite';


// Determine user data directory (where our database will be stored)
const getUserDataPath = () => {
  const userDataPath = app.getPath('userData');
  const dbDir = join(userDataPath, 'database');

  // Ensure the directory exists
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true });
  }

  return join(dbDir, 'app.db');
};

let db: DatabaseSync | null = null;

export const initDatabase = () => {
  if (db) return db; // Return existing database if already initialized

  try {
    const dbPath = getUserDataPath();
    console.log(`Initializing database at: ${dbPath}`);

    // Open the database (creates it if it doesn't exist)
    // db = new BetterSqlite3(dbPath);
    db = new DatabaseSync(dbPath, {});

    db.exec('PRAGMA journal_mode = WAL');
    // Enable foreign keys
    db.exec('PRAGMA foreign_keys = ON');

    // Create your tables
    setupTables();

    return db;
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
};

export const getDatabase = () => {
  if (!db) throw new Error('Database not initialized. Call initDatabase() first.');
  return db;
};

// Set up your database schema
const setupTables = () => {
  if (!db) return;

  // Check if todos table already exists
  const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='todos'").get();

  // Create the table if it doesn't exist
  if (!tableExists) {
    db.exec(`
      CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT 0
        );
    `);

    // Only insert sample data if the table was just created
    const statement = db.prepare(`INSERT INTO todos (text, completed) VALUES (?, ?)`);

    statement.run('Learn SQL', 0);
    statement.run('Learn Rust', 0);
    statement.run('Learn TypeScript', 0);
    statement.run('Learn Go', 0);
  }
};

export const closeDatabase = () => {
  if (db) {
    console.log('Closing database connection');
    db.close();
    db = null;
  }
};

interface Todo { id: number; text: string; completed: boolean; }

const decodeTodo = (todo: Omit<Todo, "completed"> & { completed: number }) => ({
  ...todo,
  completed: todo.completed ? true : false
});

export function getTodoById(id: number) {
  if (!db) throw new Error('Database not initialized');
  const foundTodo = db.prepare(`SELECT * FROM todos WHERE id = ?`).get(id);
  if (!foundTodo) throw new Error("Todo not found");
  return decodeTodo(foundTodo as Todo & { completed: number });
}

export function saveTodo(todo: Omit<Todo, 'id'>) {
  if (!db) throw new Error('Database not initialized');
  console.log("saving new todo: `%s`", todo.text);
  return db.prepare(`INSERT INTO todos (text, completed) VALUES (?, ?)`).run(todo.text, todo.completed ? 1 : 0);
}

export function getTodos() {
  if (!db) throw new Error('Database not initialized');
  return db
    .prepare(`SELECT * FROM todos`)
    .all()
    .map(todo => decodeTodo(todo as Todo & { completed: number }));
}

export function updateTodo(id: number, todo: Omit<Todo, 'id'>) {
  if (!db) throw new Error('Database not initialized');
  return db.prepare(`UPDATE todos SET text = ?, completed = ? WHERE id = ?`).run(todo.text, todo.completed ? 1 : 0, id);
}

export function deleteTodo(id: number) {
  if (!db) throw new Error('Database not initialized');
  return db.prepare(`DELETE FROM todos WHERE id = ?`).run(id);
}

export default db;