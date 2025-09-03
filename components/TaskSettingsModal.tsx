'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Settings } from 'lucide-react';
import { Task, TaskSettings } from '@/types/task';

interface TaskSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onUpdate: (taskId: string, settings: TaskSettings) => void;
}

export default function TaskSettingsModal({ isOpen, onClose, task, onUpdate }: TaskSettingsModalProps) {
  const [settings, setSettings] = useState<TaskSettings>(task.settings);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(task.id, settings);
  };

  const updateSetting = <K extends keyof TaskSettings>(
    key: K,
    value: TaskSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
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
              className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full relative z-50"
            >
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <Settings className="w-6 h-6 text-primary-600" />
                    <h3 className="text-lg font-medium text-gray-900">Task Settings</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
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
                  </div>

                  <div className="space-y-2">
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
                </form>
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="btn-primary"
                >
                  Update Settings
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
