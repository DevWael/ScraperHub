const axios = require('axios');
const cheerio = require('cheerio');
const Turndown = require('turndown');
const fs = require('fs-extra');
const { URL } = require('url');
const path = require('path');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');

// Load configuration
const CONFIG = require('./config');

// Parse command line arguments
const argv = yargs(hideBin(process.argv))
  .option('url', {
    alias: 'u',
    type: 'string',
    description: 'URL to scrape'
  })
  .option('output', {
    alias: 'o',
    type: 'string',
    description: 'Output directory'
  })
  .option('format', {
    alias: 'f',
    type: 'string',
    choices: ['md', 'html', 'json'],
    default: 'md',
    description: 'Output format'
  })
  .option('download-images', {
    type: 'boolean',
    default: false,
    description: 'Download images locally'
  })
  .option('max-pages', {
    type: 'number',
    description: 'Maximum pages to scrape'
  })
  .option('concurrency', {
    type: 'number',
    description: 'Number of concurrent requests'
  })
  .option('webhook', {
    type: 'string',
    description: 'Webhook URL for notifications'
  })
  .option('debug', {
    type: 'boolean',
    default: false,
    description: 'Enable debug mode'
  })
  .option('dry-run', {
    type: 'boolean',
    default: false,
    description: 'Dry run mode (no actual scraping)'
  })
  .help()
  .argv;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function sanitizeFilename(url) {
  const urlObj = new URL(url);
  let filename = urlObj.pathname;
  
  // Remove trailing slash
  if (filename.endsWith('/')) {
    filename = filename.slice(0, -1);
  }
  
  // If empty path, use 'index'
  if (!filename || filename === '/') {
    filename = 'index';
  }
  
  // Remove leading slash
  if (filename.startsWith('/')) {
    filename = filename.slice(1);
  }
  
  // Replace invalid characters
  filename = filename
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\.\./g, '_')
    .replace(/__+/g, '_')
    .replace(/^_+|_+$/g, '');
  
  // Limit length
  if (filename.length > 200) {
    const ext = path.extname(filename);
    const name = path.basename(filename, ext);
    filename = name.substring(0, 200 - ext.length) + ext;
  }
  
  return filename || 'index';
}

function shouldExcludeUrl(url) {
  return CONFIG.excludePatterns.some(pattern => pattern.test(url));
}

function extractPageMetadata($, url) {
  const metadata = {
    url: url,
    title: '',
    description: '',
    keywords: '',
    author: '',
    date: '',
    lastModified: '',
    language: '',
    canonical: '',
    ogImage: '',
    ogTitle: '',
    ogDescription: '',
    twitterCard: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: ''
  };

  // Extract title
  metadata.title = $('title').text().trim() || 
                   $('h1').first().text().trim() || 
                   'Untitled Page';

  // Extract meta tags
  $('meta').each((i, el) => {
    const name = $(el).attr('name') || $(el).attr('property');
    const content = $(el).attr('content');
    
    if (name && content) {
      switch (name.toLowerCase()) {
        case 'description':
          metadata.description = content;
          break;
        case 'keywords':
          metadata.keywords = content;
          break;
        case 'author':
          metadata.author = content;
          break;
        case 'og:title':
          metadata.ogTitle = content;
          if (!metadata.title) metadata.title = content;
          break;
        case 'og:description':
          metadata.ogDescription = content;
          if (!metadata.description) metadata.description = content;
          break;
        case 'og:image':
          metadata.ogImage = content;
          break;
        case 'twitter:card':
          metadata.twitterCard = content;
          break;
        case 'twitter:title':
          metadata.twitterTitle = content;
          break;
        case 'twitter:description':
          metadata.twitterDescription = content;
          break;
        case 'twitter:image':
          metadata.twitterImage = content;
          break;
      }
    }
  });

  // Extract canonical URL
  metadata.canonical = $('link[rel="canonical"]').attr('href') || url;

  // Extract language
  metadata.language = $('html').attr('lang') || 'en';

  return metadata;
}

async function downloadImage(imageUrl, outputDir) {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': CONFIG.userAgent
      }
    });

    const urlObj = new URL(imageUrl);
    const filename = path.basename(urlObj.pathname) || 'image.jpg';
    const filePath = path.join(outputDir, 'assets', filename);
    
    await fs.ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, response.data);
    
    return filename;
  } catch (error) {
    		// Failed to download image
    return null;
  }
}

function processImages($, baseUrl, outputDir, downloadImages = false) {
  if (!CONFIG.convertImagesToLinks && !downloadImages) return [];
  
  const downloadedImages = [];
  
  $('img').each((i, img) => {
    const src = $(img).attr('src');
    const alt = $(img).attr('alt') || '';
    const title = $(img).attr('title') || '';
    
    if (src) {
      try {
        const absoluteUrl = new URL(src, baseUrl).href;
        let linkText = 'Image';
        
        switch (CONFIG.imageLinkText) {
          case 'alt':
            linkText = alt || title || src.split('/').pop() || 'Image';
            break;
          case 'title':
            linkText = title || alt || src.split('/').pop() || 'Image';
            break;
          case 'filename':
            linkText = src.split('/').pop() || 'Image';
            break;
          case 'url':
            linkText = absoluteUrl;
            break;
          default:
            linkText = alt || title || src.split('/').pop() || 'Image';
        }
        
        if (downloadImages) {
          // Download image and update link
          downloadImage(absoluteUrl, outputDir).then(filename => {
            if (filename) {
              downloadedImages.push({ original: absoluteUrl, local: filename });
              $(img).replaceWith(`[${linkText}](./assets/${filename})`);
            } else {
              $(img).replaceWith(`[${linkText}](${absoluteUrl})`);
            }
          });
        } else {
          $(img).replaceWith(`[${linkText}](${absoluteUrl})`);
        }
      		} catch (err) {
			// Invalid image URL
		}
    }
  });
  
  return downloadedImages;
}

function cleanHtml($) {
  // Remove script tags
  $('script').remove();
  
  // Remove style tags
  $('style').remove();
  
  // Remove inline styles
  $('[style]').removeAttr('style');
  
  // Remove elements based on configuration
  CONFIG.removeElements.forEach(selector => {
    $(selector).remove();
  });
}

function extractContentStatistics($, markdownContent) {
  const text = $.text();
  const words = text.trim().split(/\s+/).length;
  const characters = text.length;
  const images = $('img').length;
  const links = $('a').length;
  const headings = $('h1, h2, h3, h4, h5, h6').length;
  const paragraphs = $('p').length;
  const lists = $('ul, ol').length;
  const tables = $('table').length;
  
  return {
    words,
    characters,
    images,
    links,
    headings,
    paragraphs,
    lists,
    tables,
    markdownLength: markdownContent.length
  };
}

async function sendWebhookNotification(webhookUrl, data) {
  try {
    await axios.post(webhookUrl, {
      event: 'scraping_completed',
      timestamp: new Date().toISOString(),
      ...data
    }, {
      timeout: 5000
    });
  	} catch (error) {
		// Failed to send webhook notification
	}
}

async function crawl(startUrl, options = {}) {
  const Queue = (await import('queue')).default;
  const turndown = new Turndown(CONFIG.markdown);
  
  // Merge options with command line arguments and config
  const finalOptions = {
    ...CONFIG,
    ...options,
    ...argv
  };
  
  const baseUrl = new URL(startUrl);
  const baseDomain = baseUrl.hostname;
  const baseDirName = baseDomain.replace(/\./g, '_');
  
  // Create output directory structure: data/tasks/domain/date_time/
  let outputDir = finalOptions.output;
  if (!outputDir) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // Format: YYYY-MM-DDTHH-MM-SS
    outputDir = path.join('data', 'tasks', baseDirName, timestamp);
  }
  
  await fs.ensureDir(outputDir);
  await fs.ensureDir(path.join(outputDir, 'pages'));
  await fs.ensureDir(path.join(outputDir, 'assets'));

  let visited = new Set();
  let toVisit = [];
  let sitemap = [];
  let delay = finalOptions.initialDelay;
  let totalPages = 0;
  let successfulPages = 0;
  let failedPages = 0;
  let startTime = Date.now();
  let downloadedImages = [];
  let uniqueUrlsDiscovered = new Set(); // Track unique URLs discovered

  // Load state from files if they exist
  const statePath = path.join(outputDir, 'state.json');
  if (await fs.pathExists(statePath)) {
    const state = await fs.readJson(statePath);
    visited = new Set(state.visited || []);
    toVisit = state.toVisit || [];
    sitemap = state.sitemap || [];
    totalPages = state.totalPages || 0;
    successfulPages = state.successfulPages || 0;
    failedPages = state.failedPages || 0;
    // Initialize uniqueUrlsDiscovered from state to prevent progress reset
    if (state.uniqueUrlsDiscovered) {
      uniqueUrlsDiscovered = new Set(state.uniqueUrlsDiscovered);
    }
  }

  if (!toVisit.includes(startUrl) && !visited.has(startUrl)) {
    toVisit.push(startUrl);
    uniqueUrlsDiscovered.add(startUrl); // Add initial URL to unique set
  }

  // Progress tracking
  let currentUrl = '';
  
  const printProgress = () => {
    if (!finalOptions.showProgress) return;
    
    // Calculate progress based on actual scraped pages vs unique discovered URLs
    // Use unique URLs since we only add new ones to the queue
    const totalUniqueUrls = uniqueUrlsDiscovered.size;
    const totalScraped = successfulPages + failedPages;
    
    // Calculate progress based on completed work vs total unique work
    let progress;
    if (totalUniqueUrls === 0) {
      progress = 0;
    } else if (toVisit.length === 0 && totalScraped > 0) {
      // All unique URLs have been processed, we're at 100%
      progress = 100;
    } else {
      // Calculate progress based on processed vs unique discovered, but cap it at 95% until completely done
      const rawProgress = (totalScraped / totalUniqueUrls) * 100;
      progress = Math.min(rawProgress, 95);
    }
    
    const barLength = 30;
    const filled = Math.round(barLength * progress / 100);
    const bar = '█'.repeat(filled) + '░'.repeat(barLength - filled);
    
    const elapsed = Date.now() - startTime;
    const avgTimePerPage = successfulPages > 0 ? elapsed / successfulPages : 0;
    const remainingPages = toVisit.length;
    const estimatedTime = remainingPages * avgTimePerPage;
    
    	// Clear console and display progress
	// Scraping progress display
	// Progress bar and statistics
	// Queue status
	// Time information
	// Output directory
	// Images downloaded
	
	// Send progress update with unique URL counts
	process.stdout.write(`PROGRESS_UPDATE:${JSON.stringify({
      progress: Math.round(progress),
      totalUrls: totalUniqueUrls, // Use unique URLs discovered
      scrapedUrls: successfulPages,
      failedUrls: failedPages,
      downloadedImages: downloadedImages.length,
      queueLength: toVisit.length,
      visitedCount: visited.size,
      elapsed: Math.round(elapsed / 1000),
      estimatedRemaining: Math.round(estimatedTime / 1000),
      currentUrl: currentUrl || ''
    })}`);
  };

  // Parallel queue setup
  const q = new Queue({ concurrency: finalOptions.concurrency, autostart: true });

  async function scrapePage(url, retryCount = 0) {
    if (visited.has(url) || shouldExcludeUrl(url)) return;
    visited.add(url);
    currentUrl = url;

    try {
      if (finalOptions.dryRun) {
        // Would scrape URL in dry run mode
        return;
      }

      await sleep(delay);
      
      const { data } = await axios.get(url, {
        timeout: finalOptions.timeout,
        headers: {
          'User-Agent': finalOptions.userAgent,
          ...finalOptions.headers
        }
      });

      const $ = cheerio.load(data);
      
      // Clean HTML
      cleanHtml($);
      
      // Process images
      const pageImages = await processImages($, url, outputDir, finalOptions.downloadImages);
      downloadedImages.push(...pageImages);
      
      // Extract metadata
      const metadata = extractPageMetadata($, url);
      
      // Convert to markdown
      const bodyContent = $('body').html() || '';
      const markdownContent = turndown.turndown(bodyContent);
      
      // Extract content statistics
      const stats = extractContentStatistics($, markdownContent);
      
      // Create output content based on format
      let outputContent = '';
      const filename = sanitizeFilename(url);
      
      switch (finalOptions.format) {
        case 'json':
          outputContent = JSON.stringify({
            metadata,
            content: markdownContent,
            statistics: stats,
            scrapedAt: new Date().toISOString()
          }, null, 2);
          break;
        case 'html':
          outputContent = `<!DOCTYPE html>
<html lang="${metadata.language}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${metadata.title}</title>
    <meta name="description" content="${metadata.description}">
    <meta name="keywords" content="${metadata.keywords}">
    <meta name="author" content="${metadata.author}">
    <link rel="canonical" href="${metadata.canonical}">
</head>
<body>
    <h1>${metadata.title}</h1>
    <div class="metadata">
        <p><strong>URL:</strong> <a href="${metadata.url}">${metadata.url}</a></p>
        <p><strong>Scraped:</strong> ${new Date().toISOString()}</p>
    </div>
    <div class="content">
        ${bodyContent}
    </div>
</body>
</html>`;
          break;
        default: // markdown
          outputContent = `# ${metadata.title}\n\n`;
          
          if (finalOptions.includeMetadata) {
            outputContent += `**URL:** ${metadata.url}  
**Canonical:** ${metadata.canonical}  
**Language:** ${metadata.language}  
${metadata.description ? `**Description:** ${metadata.description}\n` : ''}
${metadata.author ? `**Author:** ${metadata.author}\n` : ''}
${metadata.keywords ? `**Keywords:** ${metadata.keywords}\n` : ''}
${metadata.ogImage ? `**OG Image:** ${metadata.ogImage}\n` : ''}

---
\n`;
          }
          
          outputContent += markdownContent;
          
          if (finalOptions.includeTimestamps) {
            outputContent += `\n\n---\n\n*Scraped on: ${new Date().toISOString()}*`;
          }
      }

      // Save file
      const fileExtension = finalOptions.format === 'json' ? 'json' : finalOptions.format === 'html' ? 'html' : 'md';
      const filePath = path.join(outputDir, 'pages', `${filename}.${fileExtension}`);
      await fs.writeFile(filePath, outputContent);

      // Add to sitemap
      sitemap.push({
        url: metadata.url,
        title: metadata.title,
        description: metadata.description,
        filename: `${filename}.${fileExtension}`,
        statistics: stats,
        scrapedAt: new Date().toISOString()
      });

      // Find new links
      $('a[href]').each((i, link) => {
        const href = $(link).attr('href');
        if (!href) return;
        
        try {
          const absUrl = new URL(href, url).href;
          const urlObj = new URL(absUrl);
          
          // Only follow links from same domain
          if (urlObj.hostname === baseDomain && 
              !visited.has(absUrl) && 
              !toVisit.includes(absUrl) &&
              !shouldExcludeUrl(absUrl) &&
              visited.size + toVisit.length < finalOptions.maxPages) {
            toVisit.push(absUrl);
            uniqueUrlsDiscovered.add(absUrl); // Track unique URLs discovered
            q.push(async () => await scrapePage(absUrl));
          }
        } catch (err) {
          // Invalid URL, skip
        }
      });

      successfulPages++;
      delay = Math.max(delay * 0.9, 100); // Gradually reduce delay
      
      // Save state periodically
      if (successfulPages % finalOptions.saveStateInterval === 0) {
        await saveState();
      }
      
      printProgress();
      
    } catch (err) {
      failedPages++;
      
      if (err.response) {
        if (err.response.status === 429 || err.response.status === 403) {
          delay = Math.min(delay * 2, finalOptions.maxDelay);
          if (finalOptions.debug) {
            // Rate limit detected. Increasing delay
          }
          
          if (retryCount < finalOptions.maxRetries) {
            toVisit.unshift(url); // Add back to front of queue
            q.push(async () => await scrapePage(url, retryCount + 1));
          }
        } else {
          if (finalOptions.debug) {
            // HTTP error response
          }
        }
      } else if (err.code === 'ECONNABORTED') {
        if (finalOptions.debug) {
          // Timeout error
        }
        if (retryCount < finalOptions.maxRetries) {
          toVisit.unshift(url);
          q.push(async () => await scrapePage(url, retryCount + 1));
        }
      } else {
        if (finalOptions.debug) {
          // Error scraping URL
        }
      }
      
      printProgress();
    }
  }

  async function saveState() {
    const state = {
      visited: [...visited],
      toVisit: toVisit,
      sitemap: sitemap,
      totalPages: totalPages,
      successfulPages: successfulPages,
      failedPages: failedPages,
      downloadedImages: downloadedImages,
      uniqueUrlsDiscovered: [...uniqueUrlsDiscovered], // Save unique URLs discovered
      lastUpdated: new Date().toISOString()
    };
    
    await fs.writeJson(statePath, state, { spaces: 2 });
  }

  async function generateSitemap() {
    const sitemapContent = `# Sitemap for ${baseDomain}

Generated on: ${new Date().toISOString()}

## Pages (${sitemap.length})

${sitemap.map(page => `- [${page.title}](${page.url}) - \`${page.filename}\``).join('\n')}

## Statistics

- **Total Pages:** ${sitemap.length}
- **Successful Scrapes:** ${successfulPages}
- **Failed Scrapes:** ${failedPages}
- **Images Downloaded:** ${downloadedImages.length}
- **Start URL:** ${startUrl}
- **Base Domain:** ${baseDomain}
- **Output Format:** ${finalOptions.format}
- **Total Scraping Time:** ${Math.round((Date.now() - startTime) / 1000)}s

## Files Structure

\`\`\`
${outputDir}/
├── pages/
│   ├── index.${finalOptions.format}
│   ├── about.${finalOptions.format}
│   └── ...
├── assets/
│   └── (downloaded images)
├── sitemap.md
└── state.json
\`\`\`
`;

    await fs.writeFile(path.join(outputDir, 'sitemap.md'), sitemapContent);
  }

  // Initialize queue with initial URLs
  toVisit.forEach(url => q.push(async () => await scrapePage(url)));

  // Start scraping
  if (!finalOptions.dryRun) {
    // Starting to scrape
    printProgress();
  }

  await new Promise(resolve => q.end(resolve));

  // Final cleanup and reports
  if (!finalOptions.dryRun) {
    // Send final progress update with 100% completion
    const finalProgressData = {
      progress: 100,
      totalUrls: uniqueUrlsDiscovered.size,
      scrapedUrls: successfulPages,
      failedUrls: failedPages,
      downloadedImages: downloadedImages.length,
      queueLength: 0,
      visitedCount: visited.size,
      elapsed: Math.round((Date.now() - startTime) / 1000),
      estimatedRemaining: 0,
      currentUrl: ''
    };
    process.stdout.write(`PROGRESS_UPDATE:${JSON.stringify(finalProgressData)}`);
    
    // Generating final reports
    await saveState();
    await generateSitemap();

    // Send webhook notification if configured
    if (finalOptions.webhook) {
      await sendWebhookNotification(finalOptions.webhook, {
        domain: baseDomain,
        totalPages: sitemap.length,
        successfulPages,
        failedPages,
        downloadedImages: downloadedImages.length,
        outputDir,
        scrapingTime: Math.round((Date.now() - startTime) / 1000)
      });
    }

    // Scraping completed
    		// Scraping completed
		// Output directory
		// Total pages scraped
		// Failed pages
		// Images downloaded
		// Sitemap location
		// Total time
  }

  return {
    domain: baseDomain,
    totalPages: sitemap.length,
    totalUrls: uniqueUrlsDiscovered.size, // Total unique URLs that were discovered
    successfulPages,
    failedPages,
    downloadedImages: downloadedImages.length,
    outputDir,
    scrapingTime: Math.round((Date.now() - startTime) / 1000),
    sitemap
  };
}

// Export the crawl function for programmatic use
module.exports = { crawl };

// Run if this file is executed directly
if (require.main === module) {
  const startUrl = argv.url || process.argv[2];
  if (!startUrl) {
    // Usage information
    console.log('Usage: node crawler.js <url> [options]');
    console.log('');
    console.log('Example usage:');
    console.log('  node crawler.js https://example.com');
    console.log('  node crawler.js --url https://example.com --format html');
    console.log('');
    console.log('Options:');
    console.log('  --url, -u          URL to scrape');
    console.log('  --output, -o       Output directory');
    console.log('  --format, -f       Output format (md, html, json)');
    console.log('  --download-images  Download images locally');
    console.log('  --max-pages        Maximum pages to scrape');
    console.log('  --concurrency      Number of concurrent requests');
    console.log('  --webhook          Webhook URL for notifications');
    console.log('  --debug            Enable debug mode');
    console.log('  --dry-run          Dry run mode (no actual scraping)');
    process.exit(1);
  }

  // Validate URL
  try {
    new URL(startUrl);
  } catch (err) {
    console.error('Invalid URL provided:', startUrl);
    process.exit(1);
  }

  // Add error handling to the main execution
  crawl(startUrl).catch(err => {
    console.error('Fatal error in crawler:', err);
    console.error('Stack trace:', err.stack);
    process.exit(1);
  });
}