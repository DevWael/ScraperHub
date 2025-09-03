'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Download, Globe, Clock, BarChart3, RotateCcw } from 'lucide-react';
import { Task } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';

interface TaskDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onRerun?: () => void;
}

export default function TaskDetailsModal({ isOpen, onClose, task, onRerun }: TaskDetailsModalProps) {
  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname + urlObj.pathname;
    } catch {
      return url;
    }
  };

  const getTimeElapsed = () => {
    if (!task.startTime) return null;
    const start = new Date(task.startTime);
    const end = task.endTime ? new Date(task.endTime) : new Date();
    return formatDistanceToNow(start, { addSuffix: true });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity z-40"
              onClick={onClose}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full relative z-50"
            >
                              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <FileText className="w-6 h-6 text-primary-600" />
                    <h3 className="text-lg font-medium text-gray-900">Task Details</h3>
                  </div>
                  <button
                    onClick={onClose}
                                          className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="card">
                      <div className="flex items-center space-x-2 mb-2">
                        <Globe className="w-4 h-4 text-primary-600" />
                        <h4 className="font-medium text-gray-900">Website</h4>
                      </div>
                      <p className="text-sm text-gray-600">{formatUrl(task.url)}</p>
                      <p className="text-xs text-gray-500 truncate">{task.url}</p>
                    </div>
                    <div className="card">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-primary-600" />
                        <h4 className="font-medium text-gray-900">Duration</h4>
                      </div>
                      <p className="text-sm text-gray-600">{getTimeElapsed()}</p>
                      <p className="text-xs text-gray-500">
                        {task.startTime && new Date(task.startTime).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="card">
                    <div className="flex items-center space-x-2 mb-4">
                      <BarChart3 className="w-4 h-4 text-primary-600" />
                      <h4 className="font-medium text-gray-900">Statistics</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary-600">{task.pagesScraped}</div>
                        <div className="text-xs text-gray-500">Pages Scraped</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-error-600">{task.pagesFailed}</div>
                        <div className="text-xs text-gray-500">Pages Failed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-success-600">{task.imagesDownloaded}</div>
                        <div className="text-xs text-gray-500">Images Downloaded</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-600">{task.progress}%</div>
                        <div className="text-xs text-gray-500">Progress</div>
                      </div>
                    </div>
                  </div>

                  {/* Settings Summary */}
                  <div className="card">
                    <h4 className="font-medium text-gray-900 mb-4">Settings</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Format:</span>
                        <span className="ml-2 font-medium">{task.settings.format.toUpperCase()}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Concurrency:</span>
                        <span className="ml-2 font-medium">{task.settings.concurrency}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Max Pages:</span>
                        <span className="ml-2 font-medium">{task.settings.maxPages}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Download Images:</span>
                        <span className="ml-2 font-medium">{task.settings.downloadImages ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Include Metadata:</span>
                        <span className="ml-2 font-medium">{task.settings.includeMetadata ? 'Yes' : 'No'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Convert Images:</span>
                        <span className="ml-2 font-medium">{task.settings.convertImagesToLinks ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Results */}
                  {task.result && (
                    <div className="card">
                      <h4 className="font-medium text-gray-900 mb-4">Results</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-gray-500">Output Directory:</span>
                          <span className="ml-2 font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                            {task.result.outputDir}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500">Scraping Time:</span>
                          <span className="ml-2 font-medium">{task.result.scrapingTime}s</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Domain:</span>
                          <span className="ml-2 font-medium">{task.result.domain}</span>
                        </div>
                      </div>
                      
                      {task.result.sitemap.length > 0 && (
                        <div className="mt-4">
                          <h5 className="font-medium text-gray-900 mb-2">Pages ({task.result.sitemap.length})</h5>
                          <div className="max-h-40 overflow-y-auto space-y-1">
                            {task.result.sitemap.slice(0, 10).map((page, index) => (
                              <div key={index} className="text-xs text-gray-600 truncate">
                                {page.title} - {page.url}
                              </div>
                            ))}
                            {task.result.sitemap.length > 10 && (
                              <div className="text-xs text-gray-500">
                                ... and {task.result.sitemap.length - 10} more pages
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Error */}
                  {task.error && (
                    <div className="card border-error-200 bg-error-50">
                      <h4 className="font-medium text-error-900 mb-2">Error</h4>
                      <p className="text-sm text-error-700">{task.error}</p>
                    </div>
                  )}
                </div>
              </div>

                              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {task.status === 'completed' && (
                  <>
                    {onRerun && (
                      <button
                        onClick={onRerun}
                        className="btn-primary flex items-center space-x-2 mr-2"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Re-run Task</span>
                      </button>
                    )}
                    <button
                      onClick={() => window.open(`/api/scraper/download/${task.id}`, '_blank')}
                      className="btn-success flex items-center space-x-2 mr-2"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Results</span>
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="btn-secondary"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
