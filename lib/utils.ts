import path from 'path';
import fs from 'fs';
import { Task, TaskStatus } from '@/types/task';

/**
 * Utility functions for the web scraper application
 */

export interface TaskProgress {
  progress: number;
  totalUrls: number;
  scrapedUrls: number;
  failedUrls: number;
  downloadedImages: number;
  currentUrl: string;
  elapsed: number;
  estimatedRemaining: number;
}

/**
 * Ensure a directory exists, creating it if necessary
 */
export function ensureDirectoryExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Get the output directory path for a task
 */
export function getTaskOutputDir(taskId: string, runNumber: number): string {
  return path.join(process.cwd(), 'data', 'tasks', `${taskId}_run_${runNumber}`);
}

/**
 * Get the downloads directory path
 */
export function getDownloadsDir(): string {
  return path.join(process.cwd(), 'data', 'downloads');
}

/**
 * Validate if a URL is valid
 */
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return url.startsWith('http');
  } catch {
    return false;
  }
}

/**
 * Format a URL for display (show hostname + pathname)
 */
export function formatUrlForDisplay(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch {
    return url;
  }
}

/**
 * Calculate progress percentage with bounds checking
 */
export function calculateProgress(progress: number): number {
  return Math.min(Math.max(progress, 0), 100);
}

/**
 * Get status color classes for UI
 */
export function getStatusColor(status: TaskStatus): string {
  switch (status) {
    case 'running': return 'text-success-600 bg-success-50 border-success-200';
    case 'completed': return 'text-success-600 bg-success-50 border-success-200';
    case 'failed': return 'text-error-600 bg-error-50 border-error-200';
    case 'paused': return 'text-warning-600 bg-warning-50 border-warning-200';
    case 'stopped': return 'text-gray-600 bg-gray-50 border-gray-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

/**
 * Get status text for display
 */
export function getStatusText(status: TaskStatus): string {
  switch (status) {
    case 'running': return 'Running';
    case 'completed': return 'Completed';
    case 'failed': return 'Failed';
    case 'paused': return 'Paused';
    case 'stopped': return 'Stopped';
    case 'pending': return 'Pending';
    default: return 'Unknown';
  }
}

/**
 * Calculate estimated time remaining
 */
export function calculateEstimatedTime(
  startTime: string,
  progress: number,
  currentTime: number = Date.now()
): number | null {
  if (progress === 0) return null;
  
  const elapsed = currentTime - new Date(startTime).getTime();
  const estimatedTotal = (elapsed / progress) * 100;
  const remaining = estimatedTotal - elapsed;
  
  return Math.round(remaining / 1000);
}

/**
 * Parse progress data from crawler output
 */
export function parseProgressData(line: string): TaskProgress | null {
  if (!line.startsWith('PROGRESS_UPDATE:')) {
    return null;
  }

  try {
    const jsonStr = line.replace('PROGRESS_UPDATE:', '');
    const data = JSON.parse(jsonStr);
    
    return {
      progress: calculateProgress(data.progress || 0),
      totalUrls: data.totalUrls || 0,
      scrapedUrls: data.scrapedUrls || 0,
      failedUrls: data.failedUrls || 0,
      downloadedImages: data.downloadedImages || 0,
      currentUrl: data.currentUrl || '',
      elapsed: data.elapsed || 0,
      estimatedRemaining: data.estimatedRemaining || 0
    };
  } catch (error) {
    // Failed to parse progress data
    return null;
  }
}

/**
 * Generate a unique task ID
 */
export function generateTaskId(): string {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
}

/**
 * Generate a unique run ID
 */
export function generateRunId(): string {
  const { v4: uuidv4 } = require('uuid');
  return uuidv4();
}

/**
 * Get current timestamp in ISO format
 */
export function getCurrentTimestamp(): string {
  return new Date().toISOString();
}

/**
 * Check if a task can be downloaded (completed and has output)
 */
export function canDownloadTask(task: Task): boolean {
  return task.status === 'completed' && 
         !!task.outputDir && 
         fs.existsSync(task.outputDir);
}

/**
 * Create a zip file from a directory
 */
export async function createZipFromDirectory(
  sourceDir: string, 
  outputPath: string
): Promise<void> {
  return new Promise((resolve, reject) => {
    const archiver = require('archiver');
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });

    output.on('close', () => {
      // Archive created
      resolve();
    });

    archive.on('error', (err: any) => {
      reject(err);
    });

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Clean up old task files (older than specified days)
 */
export function cleanupOldTasks(daysToKeep: number = 30): void {
  const tasksDir = path.join(process.cwd(), 'data', 'tasks');
  const downloadsDir = path.join(process.cwd(), 'data', 'downloads');
  
  if (!fs.existsSync(tasksDir)) return;
  
  const cutoffTime = Date.now() - (daysToKeep * 24 * 60 * 60 * 1000);
  
  // Clean up task directories
  const taskDirs = fs.readdirSync(tasksDir);
  taskDirs.forEach(dir => {
    const dirPath = path.join(tasksDir, dir);
    const stats = fs.statSync(dirPath);
    
    if (stats.isDirectory() && stats.mtime.getTime() < cutoffTime) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      // Cleaned up old task directory
    }
  });
  
  // Clean up download files
  if (fs.existsSync(downloadsDir)) {
    const downloadFiles = fs.readdirSync(downloadsDir);
    downloadFiles.forEach(file => {
      const filePath = path.join(downloadsDir, file);
      const stats = fs.statSync(filePath);
      
      if (stats.isFile() && stats.mtime.getTime() < cutoffTime) {
        fs.unlinkSync(filePath);
        // Cleaned up old download file
      }
    });
  }
}
