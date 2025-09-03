import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure data directory exists
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'scraper.db');
const db = new Database(dbPath);

// Initialize database tables
export function initializeDatabase() {
  try {
    // Create tasks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        url TEXT NOT NULL,
        settings TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        progress REAL DEFAULT 0,
        startTime TEXT,
        endTime TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        totalUrls INTEGER DEFAULT 0,
        scrapedUrls INTEGER DEFAULT 0,
        failedUrls INTEGER DEFAULT 0,
        downloadedImages INTEGER DEFAULT 0,
        outputDir TEXT,
        error TEXT
      )
    `);

    // Create task runs table for history
    db.exec(`
      CREATE TABLE IF NOT EXISTS task_runs (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        runNumber INTEGER NOT NULL,
        status TEXT NOT NULL,
        startTime TEXT NOT NULL,
        endTime TEXT,
        progress REAL DEFAULT 0,
        totalUrls INTEGER DEFAULT 0,
        scrapedUrls INTEGER DEFAULT 0,
        failedUrls INTEGER DEFAULT 0,
        downloadedImages INTEGER DEFAULT 0,
        outputDir TEXT,
        result TEXT,
        error TEXT,
        FOREIGN KEY (taskId) REFERENCES tasks (id)
      )
    `);

    // Create scraped pages table
    db.exec(`
      CREATE TABLE IF NOT EXISTS scraped_pages (
        id TEXT PRIMARY KEY,
        taskId TEXT NOT NULL,
        runId TEXT NOT NULL,
        url TEXT NOT NULL,
        title TEXT,
        description TEXT,
        filename TEXT,
        filePath TEXT,
        scrapedAt TEXT NOT NULL,
        wordCount INTEGER DEFAULT 0,
        imageCount INTEGER DEFAULT 0,
        linkCount INTEGER DEFAULT 0,
        status TEXT DEFAULT 'success',
        error TEXT,
        FOREIGN KEY (taskId) REFERENCES tasks (id),
        FOREIGN KEY (runId) REFERENCES task_runs (id)
      )
    `);

    // Create indexes for better performance
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
      CREATE INDEX IF NOT EXISTS idx_task_runs_taskId ON task_runs (taskId);
      CREATE INDEX IF NOT EXISTS idx_scraped_pages_taskId ON scraped_pages (taskId);
      CREATE INDEX IF NOT EXISTS idx_scraped_pages_runId ON scraped_pages (runId);
    `);

  } catch (error) {
    throw error;
  }
}

// Initialize database first
initializeDatabase();

// Task operations
export const taskOperations = {
  create: db.prepare(`
    INSERT INTO tasks (id, url, settings, status, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  update: db.prepare(`
    UPDATE tasks 
    SET status = ?, progress = ?, startTime = ?, endTime = ?, 
        totalUrls = ?, scrapedUrls = ?, failedUrls = ?, downloadedImages = ?,
        outputDir = ?, error = ?, updatedAt = ?
    WHERE id = ?
  `),

  getById: db.prepare('SELECT * FROM tasks WHERE id = ?'),
  
  getAll: db.prepare('SELECT * FROM tasks ORDER BY createdAt DESC'),
  
  getByStatus: db.prepare('SELECT * FROM tasks WHERE status = ? ORDER BY createdAt DESC'),
  
  delete: db.prepare('DELETE FROM tasks WHERE id = ?')
};

// Task run operations
export const taskRunOperations = {
  create: db.prepare(`
    INSERT INTO task_runs (id, taskId, runNumber, status, startTime, progress)
    VALUES (?, ?, ?, ?, ?, ?)
  `),

  update: db.prepare(`
    UPDATE task_runs 
    SET status = ?, endTime = ?, progress = ?, totalUrls = ?, scrapedUrls = ?, 
        failedUrls = ?, downloadedImages = ?, outputDir = ?, result = ?, error = ?
    WHERE id = ?
  `),

  getByTaskId: db.prepare('SELECT * FROM task_runs WHERE taskId = ? ORDER BY runNumber DESC'),
  
  getLatestRun: db.prepare('SELECT * FROM task_runs WHERE taskId = ? ORDER BY runNumber DESC LIMIT 1'),
  
  getRunCount: db.prepare('SELECT COUNT(*) as count FROM task_runs WHERE taskId = ?')
};

// Scraped pages operations
export const scrapedPageOperations = {
  create: db.prepare(`
    INSERT INTO scraped_pages (id, taskId, runId, url, title, description, filename, 
                              filePath, scrapedAt, wordCount, imageCount, linkCount, status, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),

  getByTaskId: db.prepare('SELECT * FROM scraped_pages WHERE taskId = ? ORDER BY scrapedAt DESC'),
  
  getByRunId: db.prepare('SELECT * FROM scraped_pages WHERE runId = ? ORDER BY scrapedAt DESC'),
  
  getStats: db.prepare(`
    SELECT 
      COUNT(*) as total,
      SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
      SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
      SUM(wordCount) as totalWords,
      SUM(imageCount) as totalImages,
      SUM(linkCount) as totalLinks
    FROM scraped_pages 
    WHERE taskId = ?
  `)
};

export { db };
