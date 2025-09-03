module.exports = {
  // Scraping settings
  concurrency: 5,           // Number of concurrent requests
  timeout: 10000,           // Request timeout in milliseconds
  maxRetries: 3,            // Maximum retry attempts for failed requests
  initialDelay: 1000,       // Initial delay between requests (ms)
  maxDelay: 60000,          // Maximum delay between requests (ms)
  maxPages: 5000,           // Maximum number of pages to scrape (increased from 1000)
  
  // User agent and headers
  userAgent: 'Mozilla/5.0 (compatible; WebScraper/1.0)',
  
  // Output settings
  outputFormats: ['md'],    // Can be extended to ['md', 'html', 'json']
  includeMetadata: true,    // Include page metadata in markdown files
  includeTimestamps: true,  // Include timestamps in output
  
  // URL filtering
  excludePatterns: [
    // File extensions to exclude
    /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|exe|dmg|mp4|avi|mov|wmv|flv|webm|mp3|wav|ogg|flac)$/i,
    
    // Paths to exclude
    /\/admin\//i,
    /\/login\//i,
    /\/api\//i,
    /\/wp-admin\//i,
    /\/wp-content\/uploads\//i,
    /\/wp-includes\//i,
    /\/cgi-bin\//i,
    /\/tmp\//i,
    /\/temp\//i,
    /\/cache\//i,
    /\/logs\//i,
    
    // Common unwanted paths
    /\/search\//i,
    /\/tag\//i,
    /\/category\//i,
    /\/author\//i,
    /\/date\//i,
    /\/page\//i,
    /\/feed\//i,
    /\/rss\//i,
    /\/atom\//i,
    /\/xml\//i,
    /\/json\//i,
    
    // Social media and external links
    /facebook\.com/i,
    /twitter\.com/i,
    /instagram\.com/i,
    /linkedin\.com/i,
    /youtube\.com/i,
    /vimeo\.com/i,
    
    // Analytics and tracking
    /google-analytics/i,
    /googletagmanager/i,
    /facebook\.net/i,
    /doubleclick\.net/i,
    /googlesyndication/i
  ],
  
  // Content cleaning settings
  removeElements: [
    // Navigation and menus
    'nav', '.navbar', '.menu', '.navigation', '[role="navigation"]', '.nav', '.header-nav',
    
    // Headers and footers
    'header', 'footer', '.footer', '.site-footer', '.site-header',
    
    // Sidebars and widgets
    'aside', '.sidebar', '.side-nav', '.widget', '.widget-area',
    
    // Advertising
    '.ad', '.ads', '.advertisement', '.banner', '.promo', '.sponsored',
    
    // Social media
    '.social', '.social-media', '.share-buttons', '.social-share',
    
    // Comments and user content
    '.comments', '.comment-section', '#comments', '.user-content',
    
    // Breadcrumbs and pagination
    '.breadcrumb', '.breadcrumbs', '.pagination', '.pager',
    
    // Forms and interactive elements
    'form[role="search"]', '.search-form', '.newsletter', '.email-signup', '.subscribe',
    
    // Notices and popups
    '.cookie-notice', '.cookie-banner', '.gdpr-notice', '.popup', '.modal', '.overlay', '.lightbox',
    
    // Tracking and analytics
    'img[width="1"]', 'img[height="1"]', '.analytics', '.tracking',
    
    // Empty elements
    'div:empty', 'p:empty', 'span:empty'
  ],
  
  // Image processing
  convertImagesToLinks: true,
  imageLinkText: 'alt', // 'alt', 'title', 'filename', or 'url'
  
  // Markdown settings
  markdown: {
    headingStyle: 'atx',        // 'atx' or 'setext'
    codeBlockStyle: 'fenced',   // 'fenced' or 'indented'
    emDelimiter: '*',           // '*' or '_'
    bulletListMarker: '-',      // '-', '+', or '*'
    strongDelimiter: '**'       // '**' or '__'
  },
  
  // Progress display
  showProgress: true,
  progressUpdateInterval: 1000, // Update progress every N milliseconds
  
  // State management
  saveStateInterval: 10,        // Save state every N successful scrapes
  
  // Error handling
  logErrors: true,
  continueOnError: true,
  
  // Custom headers for requests
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  }
};
