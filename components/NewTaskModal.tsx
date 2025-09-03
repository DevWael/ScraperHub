'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Globe, Settings, Download, FileText, Image, Filter } from 'lucide-react';
import { TaskSettings } from '@/types/task';

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (url: string, settings: TaskSettings) => void;
}

const defaultSettings: TaskSettings = {
  // Scraping settings
  concurrency: 5,
  timeout: 10000,
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 60000,
  maxPages: 1000,
  
  // Output settings
  format: 'md',
  includeMetadata: true,
  includeTimestamps: true,
  downloadImages: false,
  
  // Content filtering
  excludePatterns: [
    '/admin/',
    '/api/',
    '/login/',
    '/wp-admin/',
    '.pdf',
    '.doc',
    '.docx'
  ],
  removeElements: [
    'nav',
    'footer',
    '.ad',
    '.social',
    '.comments'
  ],
  
  // Image processing
  convertImagesToLinks: true,
  imageLinkText: 'alt',
  
  // Markdown settings
  markdown: {
    headingStyle: 'atx',
    codeBlockStyle: 'fenced',
    emDelimiter: '*',
    bulletListMarker: '-',
    strongDelimiter: '**'
  },
  
  // Progress and state
  showProgress: true,
  saveStateInterval: 10,
  logErrors: true,
  continueOnError: true,
  
  // Headers
  headers: {
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1'
  },
  
  // Crawlee settings
  crawlerType: 'cheerio' as 'cheerio' | 'playwright' | 'puppeteer',
  usePlaywright: false,
  usePuppeteer: false,
  headless: true,
  waitForSelector: '',
  waitForTimeout: 5000,
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  viewport: { width: 1920, height: 1080 },
  maxRequestsPerCrawl: 1000,
  requestHandlerTimeoutSecs: 60,
  maxConcurrency: 5,
  maxRequestRetries: 3,
  additionalMimeTypes: ['text/plain']
};

export default function NewTaskModal({ isOpen, onClose, onSubmit }: NewTaskModalProps) {
  const [url, setUrl] = useState('');
  const [settings, setSettings] = useState<TaskSettings>(defaultSettings);
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'content' | 'output'>('basic');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    try {
      await onSubmit(url.trim(), settings);
      setUrl('');
      setSettings(defaultSettings);
    } catch (error) {
      // Error creating task
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = <K extends keyof TaskSettings>(
    key: K,
    value: TaskSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateMarkdownSetting = <K extends keyof TaskSettings['markdown']>(
    key: K,
    value: TaskSettings['markdown'][K]
  ) => {
    setSettings(prev => ({
      ...prev,
      markdown: { ...prev.markdown, [key]: value }
    }));
  };

  const addExcludePattern = (pattern: string) => {
    if (pattern && !settings.excludePatterns.includes(pattern)) {
      setSettings(prev => ({
        ...prev,
        excludePatterns: [...prev.excludePatterns, pattern]
      }));
    }
  };

  const removeExcludePattern = (index: number) => {
    setSettings(prev => ({
      ...prev,
      excludePatterns: prev.excludePatterns.filter((_, i) => i !== index)
    }));
  };

  const addRemoveElement = (element: string) => {
    if (element && !settings.removeElements.includes(element)) {
      setSettings(prev => ({
        ...prev,
        removeElements: [...prev.removeElements, element]
      }));
    }
  };

  const removeElement = (index: number) => {
    setSettings(prev => ({
      ...prev,
      removeElements: prev.removeElements.filter((_, i) => i !== index)
    }));
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
                    <Globe className="w-6 h-6 text-primary-600" />
                    <h3 className="text-lg font-medium text-gray-900">Create New Scraping Task</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* URL Input */}
                  <div>
                    <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                      Website URL
                    </label>
                    <input
                      type="url"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="input-field"
                      required
                    />
                  </div>

                  {/* Settings Tabs */}
                  <div>
                    <div className="border-b border-gray-200">
                      <nav className="-mb-px flex space-x-8">
                        {[
                          { id: 'basic', label: 'Basic', icon: Globe },
                          { id: 'advanced', label: 'Advanced', icon: Settings },
                          { id: 'content', label: 'Content', icon: Filter },
                          { id: 'output', label: 'Output', icon: FileText },
                        ].map((tab) => (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              setActiveTab(tab.id as any);
                            }}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                              activeTab === tab.id
                                ? 'border-primary-500 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <tab.icon className="w-4 h-4" />
                            <span>{tab.label}</span>
                          </button>
                        ))}
                      </nav>
                    </div>

                    <div className="mt-6">
                      {/* Basic Settings */}
                      {activeTab === 'basic' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Concurrency
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="20"
                              value={settings.concurrency}
                              onChange={(e) => updateSetting('concurrency', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Max Pages
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="10000"
                              value={settings.maxPages}
                              onChange={(e) => updateSetting('maxPages', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Timeout (ms)
                            </label>
                            <input
                              type="number"
                              min="1000"
                              max="60000"
                              value={settings.timeout}
                              onChange={(e) => updateSetting('timeout', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Initial Delay (ms)
                            </label>
                            <input
                              type="number"
                              min="0"
                              max="10000"
                              value={settings.initialDelay}
                              onChange={(e) => updateSetting('initialDelay', parseInt(e.target.value))}
                              className="input-field"
                            />
                          </div>
                        </div>
                      )}

                      {/* Advanced Settings */}
                      {activeTab === 'advanced' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Retries
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="10"
                                value={settings.maxRetries}
                                onChange={(e) => updateSetting('maxRetries', parseInt(e.target.value))}
                                className="input-field"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Max Delay (ms)
                              </label>
                              <input
                                type="number"
                                min="1000"
                                max="300000"
                                value={settings.maxDelay}
                                onChange={(e) => updateSetting('maxDelay', parseInt(e.target.value))}
                                className="input-field"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Save State Interval
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="100"
                                value={settings.saveStateInterval}
                                onChange={(e) => updateSetting('saveStateInterval', parseInt(e.target.value))}
                                className="input-field"
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.logErrors}
                                onChange={(e) => updateSetting('logErrors', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Log errors</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.continueOnError}
                                onChange={(e) => updateSetting('continueOnError', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Continue on error</span>
                            </label>
                          </div>
                        </div>
                      )}

                      {/* Content Settings */}
                      {activeTab === 'content' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Exclude Patterns
                            </label>
                            <div className="space-y-2">
                              {settings.excludePatterns.map((pattern, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={pattern}
                                    onChange={(e) => {
                                      const newPatterns = [...settings.excludePatterns];
                                      newPatterns[index] = e.target.value;
                                      updateSetting('excludePatterns', newPatterns);
                                    }}
                                    className="input-field flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeExcludePattern(index)}
                                    className="text-error-600 hover:text-error-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addExcludePattern('')}
                                className="text-sm text-primary-600 hover:text-primary-700"
                              >
                                + Add pattern
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Remove Elements
                            </label>
                            <div className="space-y-2">
                              {settings.removeElements.map((element, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <input
                                    type="text"
                                    value={element}
                                    onChange={(e) => {
                                      const newElements = [...settings.removeElements];
                                      newElements[index] = e.target.value;
                                      updateSetting('removeElements', newElements);
                                    }}
                                    className="input-field flex-1"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeElement(index)}
                                    className="text-error-600 hover:text-error-700"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => addRemoveElement('')}
                                className="text-sm text-primary-600 hover:text-primary-700"
                              >
                                + Add element
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Output Settings */}
                      {activeTab === 'output' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Output Format
                            </label>
                            <select
                              value={settings.format}
                              onChange={(e) => updateSetting('format', e.target.value as any)}
                              className="input-field"
                            >
                              <option value="md">Markdown</option>
                              <option value="html">HTML</option>
                              <option value="json">JSON</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.includeMetadata}
                                onChange={(e) => updateSetting('includeMetadata', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Include metadata</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.includeTimestamps}
                                onChange={(e) => updateSetting('includeTimestamps', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Include timestamps</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.downloadImages}
                                onChange={(e) => updateSetting('downloadImages', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Download images</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={settings.convertImagesToLinks}
                                onChange={(e) => updateSetting('convertImagesToLinks', e.target.checked)}
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Convert images to links</span>
                            </label>
                          </div>
                          {settings.convertImagesToLinks && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Image Link Text
                              </label>
                              <select
                                value={settings.imageLinkText}
                                onChange={(e) => updateSetting('imageLinkText', e.target.value as any)}
                                className="input-field"
                              >
                                <option value="alt">Alt text</option>
                                <option value="title">Title</option>
                                <option value="filename">Filename</option>
                                <option value="url">URL</option>
                              </select>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!url.trim() || isLoading}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Creating...' : 'Create Task'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="btn-secondary sm:mr-3"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
