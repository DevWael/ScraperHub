export type TaskStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export interface TaskSettings {
	// Scraping settings
	concurrency: number;
	timeout: number;
	maxRetries: number;
	initialDelay: number;
	maxDelay: number;
	maxPages: number;
	
	// Crawler settings
	crawlerType: 'cheerio';
	usePlaywright: false;
	usePuppeteer: false;
	headless: true;
	
	// Advanced crawler options
	maxRequestsPerCrawl: number;
	maxConcurrency: number;
	requestHandlerTimeoutSecs: number;
	maxRequestRetries: number;
	additionalMimeTypes: string[];
	
	// Browser-specific settings (deprecated - kept for compatibility)
	waitForSelector?: string;
	waitForTimeout?: number;
	viewport?: {
		width: number;
		height: number;
	};
	userAgent?: string;
	
	// Output settings
	format: 'md' | 'html' | 'json';
	includeMetadata: boolean;
	includeTimestamps: boolean;
	downloadImages: boolean;
	
	// Content filtering
	excludePatterns: string[];
	removeElements: string[];
	
	// Image processing
	convertImagesToLinks: boolean;
	imageLinkText: 'alt' | 'title' | 'filename' | 'url';
	
	// Markdown settings
	markdown: {
		headingStyle: 'atx' | 'setext';
		codeBlockStyle: 'fenced' | 'indented';
		emDelimiter: '*' | '_';
		bulletListMarker: '-' | '+' | '*';
		strongDelimiter: '**' | '__';
	};
	
	// Progress and state
	showProgress: boolean;
	saveStateInterval: number;
	logErrors: boolean;
	continueOnError: boolean;
	
	// Headers
	headers: Record<string, string>;
	
	// Notifications
	webhook?: string;
}

export interface TaskProgress {
  currentPage: number;
  totalPages: number;
  pagesScraped: number;
  pagesFailed: number;
  imagesDownloaded: number;
  currentUrl: string;
  estimatedTimeRemaining: number;
  elapsedTime: number;
  speed: number; // pages per second
}

export interface TaskResult {
  domain: string;
  totalPages: number;
  successfulPages: number;
  failedPages: number;
  downloadedImages: number;
  outputDir: string;
  scrapingTime: number;
  sitemap: Array<{
    url: string;
    title: string;
    description: string;
    filename: string;
    statistics: {
      words: number;
      characters: number;
      images: number;
      links: number;
      headings: number;
      paragraphs: number;
      lists: number;
      tables: number;
      markdownLength: number;
    };
    scrapedAt: string;
  }>;
}

export interface Task {
  id: string;
  url: string;
  settings: TaskSettings;
  status: TaskStatus;
  progress: number; // 0-100
  startTime: string | null;
  endTime: string | null;
  pagesScraped: number;
  pagesFailed: number;
  imagesDownloaded: number;
  totalUrls: number; // Add missing property
  currentUrl?: string; // Add optional current URL
  outputDir: string;
  createdAt: string;
  updatedAt: string;
  result?: TaskResult;
  error?: string;
}

export interface TaskUpdate {
  taskId: string;
  status?: TaskStatus;
  progress?: number;
  pagesScraped?: number;
  pagesFailed?: number;
  imagesDownloaded?: number;
  currentUrl?: string;
  error?: string;
  result?: TaskResult;
  totalUrls?: number;
  elapsedTime?: number;
  estimatedRemaining?: number;
}

export interface CreateTaskRequest {
  url: string;
  settings: TaskSettings;
}

export interface TaskActionRequest {
  taskId: string;
}

export interface TaskSettingsUpdateRequest {
  taskId: string;
  settings: Partial<TaskSettings>;
}
