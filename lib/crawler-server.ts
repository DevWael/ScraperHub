// Server-side only crawler import
// This file should never be imported on the client side

let crawlFunction: any = null;

try {
  // Use dynamic import to avoid bundling issues
  const crawlerModule = require('./crawler');
  crawlFunction = crawlerModule.crawl;
} catch (error) {
  // Failed to load crawler module
  throw new Error('Failed to load crawler module');
}

export const crawl = crawlFunction;
