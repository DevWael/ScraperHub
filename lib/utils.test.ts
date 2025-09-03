import {
  isValidUrl,
  formatUrlForDisplay,
  calculateProgress,
  getStatusColor,
  getStatusText,
  calculateEstimatedTime,
  parseProgressData,
  generateTaskId,
  generateRunId,
  getCurrentTimestamp,
  canDownloadTask,
  cleanupOldTasks
} from './utils';
import { TaskStatus } from '@/types/task';
import fs from 'fs';
import path from 'path';

// Mock fs and path modules
jest.mock('fs');
jest.mock('path');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockPath = path as jest.Mocked<typeof path>;

describe('URL Utilities', () => {
  describe('isValidUrl', () => {
    it('should return true for valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true);
      expect(isValidUrl('https://example.com')).toBe(true);
      expect(isValidUrl('https://example.com/path')).toBe(true);
      expect(isValidUrl('https://example.com/path?param=value')).toBe(true);
    });

    it('should return false for invalid URLs', () => {
      expect(isValidUrl('')).toBe(false);
      expect(isValidUrl('not-a-url')).toBe(false);
      expect(isValidUrl('ftp://example.com')).toBe(false);
      expect(isValidUrl('file:///path/to/file')).toBe(false);
    });

    it('should return false for non-string inputs', () => {
      expect(isValidUrl(null as any)).toBe(false);
      expect(isValidUrl(undefined as any)).toBe(false);
      expect(isValidUrl(123 as any)).toBe(false);
    });
  });

  describe('formatUrlForDisplay', () => {
    it('should format URLs correctly', () => {
      expect(formatUrlForDisplay('https://example.com')).toBe('example.com/');
      expect(formatUrlForDisplay('https://example.com/path')).toBe('example.com/path');
      expect(formatUrlForDisplay('https://sub.example.com/path')).toBe('sub.example.com/path');
    });

    it('should handle invalid URLs gracefully', () => {
      expect(formatUrlForDisplay('invalid-url')).toBe('invalid-url');
      expect(formatUrlForDisplay('')).toBe('');
    });
  });
});

describe('Progress Utilities', () => {
  describe('calculateProgress', () => {
    it('should return progress within bounds', () => {
      expect(calculateProgress(50)).toBe(50);
      expect(calculateProgress(0)).toBe(0);
      expect(calculateProgress(100)).toBe(100);
    });

    it('should clamp values outside bounds', () => {
      expect(calculateProgress(-10)).toBe(0);
      expect(calculateProgress(150)).toBe(100);
    });

    it('should handle decimal values', () => {
      expect(calculateProgress(25.5)).toBe(25.5);
      expect(calculateProgress(99.9)).toBe(99.9);
    });
  });

  describe('calculateEstimatedTime', () => {
    const mockStartTime = '2023-01-01T10:00:00.000Z';
    const mockCurrentTime = new Date('2023-01-01T10:01:00.000Z').getTime(); // 60 seconds later

    it('should calculate estimated time correctly', () => {
      const result = calculateEstimatedTime(mockStartTime, 50, mockCurrentTime);
      expect(result).toBe(60); // 60 seconds remaining for 50% progress
    });

    it('should return null for zero progress', () => {
      const result = calculateEstimatedTime(mockStartTime, 0, mockCurrentTime);
      expect(result).toBeNull();
    });

    it('should handle edge cases', () => {
      const result = calculateEstimatedTime(mockStartTime, 100, mockCurrentTime);
      expect(result).toBe(0); // No time remaining for 100% progress
    });
  });
});

describe('Status Utilities', () => {
  describe('getStatusColor', () => {
    it('should return correct colors for each status', () => {
      expect(getStatusColor('running')).toContain('success');
      expect(getStatusColor('completed')).toContain('success');
      expect(getStatusColor('failed')).toContain('error');
      expect(getStatusColor('paused')).toContain('warning');
      expect(getStatusColor('stopped')).toContain('gray');
    });

    it('should handle unknown status', () => {
      expect(getStatusColor('unknown' as TaskStatus)).toContain('gray');
    });
  });

  describe('getStatusText', () => {
    it('should return correct text for each status', () => {
      expect(getStatusText('running')).toBe('Running');
      expect(getStatusText('completed')).toBe('Completed');
      expect(getStatusText('failed')).toBe('Failed');
      expect(getStatusText('paused')).toBe('Paused');
      expect(getStatusText('stopped')).toBe('Stopped');
      expect(getStatusText('pending')).toBe('Pending');
    });

    it('should handle unknown status', () => {
      expect(getStatusText('unknown' as TaskStatus)).toBe('Unknown');
    });
  });
});

describe('Progress Data Parsing', () => {
  describe('parseProgressData', () => {
    it('should parse valid progress data', () => {
      const validLine = 'PROGRESS_UPDATE:{"progress":50,"totalUrls":100,"scrapedUrls":50,"failedUrls":0,"downloadedImages":10,"currentUrl":"https://example.com","elapsed":60,"estimatedRemaining":60}';
      const result = parseProgressData(validLine);
      
      expect(result).toEqual({
        progress: 50,
        totalUrls: 100,
        scrapedUrls: 50,
        failedUrls: 0,
        downloadedImages: 10,
        currentUrl: 'https://example.com',
        elapsed: 60,
        estimatedRemaining: 60
      });
    });

    it('should return null for invalid lines', () => {
      expect(parseProgressData('INVALID_LINE')).toBeNull();
      expect(parseProgressData('')).toBeNull();
      expect(parseProgressData('PROGRESS_UPDATE:invalid-json')).toBeNull();
    });

    it('should handle missing fields gracefully', () => {
      const partialLine = 'PROGRESS_UPDATE:{"progress":50}';
      const result = parseProgressData(partialLine);
      
      expect(result).toEqual({
        progress: 50,
        totalUrls: 0,
        scrapedUrls: 0,
        failedUrls: 0,
        downloadedImages: 0,
        currentUrl: '',
        elapsed: 0,
        estimatedRemaining: 0
      });
    });
  });
});

describe('ID Generation', () => {
  describe('generateTaskId', () => {
    it('should generate unique task IDs', () => {
      const id1 = generateTaskId();
      const id2 = generateTaskId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });

  describe('generateRunId', () => {
    it('should generate unique run IDs', () => {
      const id1 = generateRunId();
      const id2 = generateRunId();
      
      expect(id1).toBeDefined();
      expect(id2).toBeDefined();
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
    });
  });
});

describe('Timestamp Utilities', () => {
  describe('getCurrentTimestamp', () => {
    it('should return ISO timestamp', () => {
      const timestamp = getCurrentTimestamp();
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});

describe('Task Utilities', () => {
  describe('canDownloadTask', () => {
    const mockTask = {
      id: 'test-id',
      url: 'https://example.com',
      settings: {} as any,
      status: 'completed' as const,
      progress: 100,
      startTime: '2023-01-01T10:00:00.000Z',
      endTime: '2023-01-01T10:01:00.000Z',
      pagesScraped: 10,
      pagesFailed: 0,
      imagesDownloaded: 5,
      totalUrls: 10,
      outputDir: '/test/output',
      createdAt: '2023-01-01T10:00:00.000Z',
      updatedAt: '2023-01-01T10:01:00.000Z'
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return true for downloadable task', () => {
      mockFs.existsSync.mockReturnValue(true);
      expect(canDownloadTask(mockTask)).toBe(true);
    });

    it('should return false for non-completed task', () => {
      const runningTask = { ...mockTask, status: 'running' as const };
      expect(canDownloadTask(runningTask)).toBe(false);
    });

    it('should return false when output directory does not exist', () => {
      mockFs.existsSync.mockReturnValue(false);
      expect(canDownloadTask(mockTask)).toBe(false);
    });

    it('should return false when output directory is empty', () => {
      const taskWithoutOutput = { ...mockTask, outputDir: '' };
      mockFs.existsSync.mockReturnValue(false);
      expect(canDownloadTask(taskWithoutOutput)).toBe(false);
    });
  });
});

describe('File System Utilities', () => {
  describe('cleanupOldTasks', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      mockPath.join.mockImplementation((...args) => args.join('/'));
    });

    it('should clean up old task directories', () => {
      const mockTaskDirs = ['old_task_1', 'old_task_2', 'recent_task'];
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date(Date.now() - 40 * 24 * 60 * 60 * 1000) // 40 days old
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockTaskDirs as any);
      mockFs.statSync.mockReturnValue(mockStats as any);
      
      cleanupOldTasks(30);
      
      expect(mockFs.rmSync).toHaveBeenCalledTimes(3);
    });

    it('should not clean up recent task directories', () => {
      const mockTaskDirs = ['recent_task'];
      const mockStats = {
        isDirectory: () => true,
        isFile: () => false,
        mtime: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) // 10 days old
      };
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(mockTaskDirs as any);
      mockFs.statSync.mockReturnValue(mockStats as any);
      
      cleanupOldTasks(30);
      
      expect(mockFs.rmSync).not.toHaveBeenCalled();
    });

    it('should handle non-existent directories gracefully', () => {
      mockFs.existsSync.mockReturnValue(false);
      
      expect(() => cleanupOldTasks(30)).not.toThrow();
    });
  });
});
