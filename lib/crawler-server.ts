// Server-side only crawler import
// This file should never be imported on the client side

import { TaskSettings } from '@/types/task';
import path from 'path';

export async function crawl(url: string, settings: TaskSettings, outputDir: string, onProgress?: (progress: any) => void) {
	try {
		// Create output directory based on domain
		const urlObj = new URL(url);
		const baseDomain = urlObj.hostname;
		const baseDirName = baseDomain.replace(/\./g, '_');
		
		// Create output directory structure: data/tasks/domain/date_time/
		let finalOutputDir = outputDir;
		if (!finalOutputDir) {
			const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19); // Format: YYYY-MM-DDTHH-MM-SS
			finalOutputDir = path.join('data', 'tasks', baseDirName, timestamp);
		}
		
		// TODO: Implement alternative crawler logic here
		// For now, return a placeholder result
		const result = {
			domain: baseDomain,
			totalPages: 0,
			successfulPages: 0,
			failedPages: 0,
			downloadedImages: 0,
			outputDir: finalOutputDir,
			scrapingTime: 0,
			sitemap: []
		};
		
		return result;
		
	} catch (error) {
		console.error('Failed to start crawler:', error);
		throw error;
	}
}

// Export the old crawl function for backward compatibility
export { crawl as crawlLegacy };
