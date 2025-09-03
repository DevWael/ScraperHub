// Server-side only crawler import
// This file should never be imported on the client side

import CrawleeCrawler from './crawlee-crawler';
import { TaskSettings } from '@/types/task';
import path from 'path';

export async function crawl(url: string, settings: TaskSettings, outputDir: string, onProgress?: (progress: any) => void) {
	try {
		// Create output directory based on domain
		const urlObj = new URL(url);
		const baseDomain = urlObj.hostname;
		const baseDirName = baseDomain.replace(/\./g, '_');
		
		// Create output directory structure
		let finalOutputDir = outputDir || path.join('output', baseDirName);
		let dirSuffix = 0;
		const fs = require('fs-extra');
		
		while (await fs.pathExists(finalOutputDir)) {
			dirSuffix++;
			finalOutputDir = outputDir || path.join('output', `${baseDirName}-${dirSuffix}`);
		}
		
		// Initialize the Crawlee crawler
		const crawler = new CrawleeCrawler({
			url,
			settings,
			outputDir: finalOutputDir,
			onProgress,
			onComplete: (result) => {
				console.log('Crawling completed:', result);
			},
			onError: (error) => {
				console.error('Crawling error:', error);
			}
		});
		
		// Start crawling
		const result = await crawler.start();
		return result;
		
	} catch (error) {
		console.error('Failed to start crawler:', error);
		throw error;
	}
}

// Export the old crawl function for backward compatibility
export { crawl as crawlLegacy };
