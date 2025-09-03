const { CheerioCrawler, PlaywrightCrawler, PuppeteerCrawler, createCheerioRouter, createPlaywrightRouter, createPuppeteerRouter } = require('crawlee');
const fs = require('fs-extra');
const path = require('path');
const { URL } = require('url');
const Turndown = require('turndown');

class CrawleeCrawler {
	constructor(options) {
		this.options = options;
		this.startTime = Date.now();
		this.turndown = new Turndown({
			headingStyle: options.settings.markdown.headingStyle,
			codeBlockStyle: options.settings.markdown.codeBlockStyle,
			emDelimiter: options.settings.markdown.emDelimiter,
			bulletListMarker: options.settings.markdown.bulletListMarker,
			strongDelimiter: options.settings.markdown.strongDelimiter,
		});
		this.sitemap = [];
		this.successfulPages = 0;
		this.failedPages = 0;
		this.downloadedImages = 0;
	}

	async start() {
		try {
			// Create output directories
			await this.createOutputDirectories();

			// Choose crawler type based on settings
			if (this.options.settings.usePlaywright) {
				return await this.runPlaywrightCrawler();
			} else if (this.options.settings.usePuppeteer) {
				return await this.runPuppeteerCrawler();
			} else {
				return await this.runCheerioCrawler();
			}
		} catch (error) {
			if (this.options.onError) {
				this.options.onError(error);
			}
			throw error;
		}
	}

	async createOutputDirectories() {
		await fs.ensureDir(this.options.outputDir);
		await fs.ensureDir(path.join(this.options.outputDir, 'pages'));
		await fs.ensureDir(path.join(this.options.outputDir, 'assets'));
	}

	async runCheerioCrawler() {
		const router = createCheerioRouter();

		router.addDefaultHandler(async ({ request, $, enqueueLinks, log }) => {
			try {
				await this.processPage(request.url, $, 'cheerio');
				this.successfulPages++;
				
				// Enqueue links for further crawling
				if (this.successfulPages + this.failedPages < this.options.settings.maxPages) {
					await enqueueLinks({
						globs: [`${new URL(this.options.url).origin}/**`],
						exclude: this.options.settings.excludePatterns,
					});
				}

				this.updateProgress();
			} catch (error) {
				this.failedPages++;
				log.error(`Failed to process ${request.url}:`, error);
				this.updateProgress();
			}
		});

		const crawler = new CheerioCrawler({
			requestHandler: router,
			maxRequestsPerCrawl: this.options.settings.maxPages,
			maxConcurrency: this.options.settings.concurrency,
			requestHandlerTimeoutSecs: this.options.settings.timeout / 1000,
			maxRequestRetries: this.options.settings.maxRetries,
			additionalMimeTypes: ['text/plain'],
			preNavigationHooks: [
				async ({ request }) => {
					// Add custom headers
					request.headers = {
						...request.headers,
						...this.options.settings.headers,
					};
				},
			],
		});

		await crawler.run([this.options.url]);
		return this.generateResult();
	}

	async runPlaywrightCrawler() {
		const router = createPlaywrightRouter();

		router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
			try {
				await this.processPageWithBrowser(request.url, page, 'playwright');
				this.successfulPages++;
				
				// Enqueue links for further crawling
				if (this.successfulPages + this.failedPages < this.options.settings.maxPages) {
					await enqueueLinks({
						globs: [`${new URL(this.options.url).origin}/**`],
						exclude: this.options.settings.excludePatterns,
					});
				}

				this.updateProgress();
			} catch (error) {
				this.failedPages++;
				log.error(`Failed to process ${request.url}:`, error);
				this.updateProgress();
			}
		});

		const crawler = new PlaywrightCrawler({
			requestHandler: router,
			maxRequestsPerCrawl: this.options.settings.maxPages,
			maxConcurrency: this.options.settings.concurrency,
			requestHandlerTimeoutSecs: this.options.settings.timeout / 1000,
			maxRequestRetries: this.options.settings.maxRetries,
			headless: this.options.settings.headless !== false,
			preNavigationHooks: [
				async ({ request }) => {
					// Add custom headers
					request.headers = {
						...request.headers,
						...this.options.settings.headers,
					};
				},
			],
		});

		await crawler.run([this.options.url]);
		return this.generateResult();
	}

	async runPuppeteerCrawler() {
		const router = createPuppeteerRouter();

		router.addDefaultHandler(async ({ request, page, enqueueLinks, log }) => {
			try {
				await this.processPageWithBrowser(request.url, page, 'puppeteer');
				this.successfulPages++;
				
				// Enqueue links for further crawling
				if (this.successfulPages + this.failedPages < this.options.settings.maxPages) {
					await enqueueLinks({
						globs: [`${new URL(this.options.url).origin}/**`],
						exclude: this.options.settings.excludePatterns,
					});
				}

				this.updateProgress();
			} catch (error) {
				this.failedPages++;
				log.error(`Failed to process ${request.url}:`, error);
				this.updateProgress();
			}
		});

		const crawler = new PuppeteerCrawler({
			requestHandler: router,
			maxRequestsPerCrawl: this.options.settings.maxPages,
			maxConcurrency: this.options.settings.concurrency,
			requestHandlerTimeoutSecs: this.options.settings.timeout / 1000,
			maxRequestRetries: this.options.settings.maxRetries,
			headless: this.options.settings.headless !== false,
			preNavigationHooks: [
				async ({ request }) => {
					// Add custom headers
					request.headers = {
						...request.headers,
						...this.options.settings.headers,
					};
				},
			],
		});

		await crawler.run([this.options.url]);
		return this.generateResult();
	}

	async processPage(url, $, crawlerType) {
		// Clean HTML based on settings
		this.cleanHtml($);
		
		// Process images
		const pageImages = await this.processImages($, url);
		this.downloadedImages += pageImages.length;
		
		// Extract metadata
		const metadata = this.extractPageMetadata($, url);
		
		// Convert to markdown
		const bodyContent = $('body').html() || '';
		const markdownContent = this.turndown.turndown(bodyContent);
		
		// Extract content statistics
		const stats = this.extractContentStatistics($, markdownContent);
		
		// Save content based on format
		await this.saveContent(url, metadata, markdownContent, stats);
		
		// Add to sitemap
		this.sitemap.push({
			url: metadata.url,
			title: metadata.title,
			description: metadata.description,
			filename: this.getFilename(url),
			statistics: stats,
			scrapedAt: new Date().toISOString(),
		});
	}

	async processPageWithBrowser(url, page, crawlerType) {
		// Wait for page to load
		await page.waitForLoadState('networkidle');
		
		// Get page content
		const content = await page.content();
		const $ = require('cheerio').load(content);
		
		// Process the page
		await this.processPage(url, $, crawlerType);
	}

	cleanHtml($) {
		// Remove script tags
		$('script').remove();
		
		// Remove style tags
		$('style').remove();
		
		// Remove inline styles
		$('[style]').removeAttr('style');
		
		// Remove elements based on configuration
		this.options.settings.removeElements.forEach(selector => {
			$(selector).remove();
		});
	}

	async processImages($, baseUrl) {
		const downloadedImages = [];
		
		if (!this.options.settings.convertImagesToLinks && !this.options.settings.downloadImages) {
			return downloadedImages;
		}
		
		$('img').each((i, img) => {
			const src = $(img).attr('src');
			const alt = $(img).attr('alt') || '';
			const title = $(img).attr('title') || '';
			
			if (src) {
				try {
					const absoluteUrl = new URL(src, baseUrl).href;
					let linkText = 'Image';
					
					switch (this.options.settings.imageLinkText) {
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
					
					if (this.options.settings.downloadImages) {
						// Download image logic would go here
						// For now, just convert to link
						$(img).replaceWith(`[${linkText}](${absoluteUrl})`);
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

	extractPageMetadata($, url) {
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

	extractContentStatistics($, markdownContent) {
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

	async saveContent(url, metadata, markdownContent, stats) {
		const filename = this.getFilename(url);
		
		switch (this.options.settings.format) {
			case 'json':
				const jsonContent = JSON.stringify({
					metadata,
					content: markdownContent,
					statistics: stats,
					scrapedAt: new Date().toISOString()
				}, null, 2);
				await fs.writeFile(path.join(this.options.outputDir, 'pages', `${filename}.json`), jsonContent);
				break;
				
			case 'html':
				const htmlContent = `<!DOCTYPE html>
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
        ${markdownContent}
    </div>
</body>
</html>`;
				await fs.writeFile(path.join(this.options.outputDir, 'pages', `${filename}.html`), htmlContent);
				break;
				
			default: // markdown
				let mdContent = `# ${metadata.title}\n\n`;
				
				if (this.options.settings.includeMetadata) {
					mdContent += `**URL:** ${metadata.url}  
**Canonical:** ${metadata.canonical}  
**Language:** ${metadata.language}  
${metadata.description ? `**Description:** ${metadata.description}\n` : ''}
${metadata.author ? `**Author:** ${metadata.author}\n` : ''}
${metadata.keywords ? `**Keywords:** ${metadata.keywords}\n` : ''}
${metadata.ogImage ? `**OG Image:** ${metadata.ogImage}\n` : ''}

---
\n`;
				}
				
				mdContent += markdownContent;
				
				if (this.options.settings.includeTimestamps) {
					mdContent += `\n\n---\n\n*Scraped on: ${new Date().toISOString()}*`;
				}
				
				await fs.writeFile(path.join(this.options.outputDir, 'pages', `${filename}.md`), mdContent);
				break;
		}
	}

	getFilename(url) {
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

	updateProgress() {
		if (this.options.onProgress) {
			const total = this.successfulPages + this.failedPages;
			const progress = Math.min((total / this.options.settings.maxPages) * 100, 100);
			
			this.options.onProgress({
				progress: Math.round(progress),
				totalUrls: this.options.settings.maxPages,
				scrapedUrls: this.successfulPages,
				failedUrls: this.failedPages,
				downloadedImages: this.downloadedImages,
				queueLength: 0,
				visitedCount: total,
				elapsed: Math.round((Date.now() - this.startTime) / 1000),
				estimatedRemaining: 0,
				currentUrl: ''
			});
		}
	}

	generateResult() {
		const domain = new URL(this.options.url).hostname;
		const scrapingTime = Math.round((Date.now() - this.startTime) / 1000);
		
		return {
			domain,
			totalPages: this.sitemap.length,
			successfulPages: this.successfulPages,
			failedPages: this.failedPages,
			downloadedImages: this.downloadedImages,
			outputDir: this.options.outputDir,
			scrapingTime,
			sitemap: this.sitemap
		};
	}
}

module.exports = CrawleeCrawler;
