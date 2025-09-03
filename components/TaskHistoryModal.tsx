'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Clock, BarChart3, CheckCircle, XCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { Task } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';

interface TaskRun {
  id: string;
  taskId: string;
  runNumber: number;
  status: string;
  startTime: string;
  endTime?: string;
  progress: number;
  totalUrls: number;
  pagesScraped: number;
  pagesFailed: number;
  imagesDownloaded: number;
  outputDir?: string;
  result?: string;
  error?: string;
}

interface TaskHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task;
  onRerun?: () => void;
}

export default function TaskHistoryModal({ isOpen, onClose, task, onRerun }: TaskHistoryModalProps) {
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && task.id) {
      loadTaskRuns();
    }
  }, [isOpen, task.id]);

  const loadTaskRuns = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tasks/${task.id}/runs`);
      if (response.ok) {
        const data = await response.json();
        setRuns(data.runs || []);
      }
    } catch (error) {
      console.error('Error loading task runs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-error-600" />;
      case 'running':
        return <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse" />;
      case 'paused':
        return <AlertCircle className="w-4 h-4 text-warning-600" />;
      default:
        return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success-100 text-success-800';
      case 'failed':
        return 'bg-error-100 text-error-800';
      case 'running':
        return 'bg-primary-100 text-primary-800';
      case 'paused':
        return 'bg-warning-100 text-warning-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    if (!endTime) return 'Running...';
    const start = new Date(startTime);
    const end = new Date(endTime);
    const duration = end.getTime() - start.getTime();
    const seconds = Math.floor(duration / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const canDownloadRun = (run: TaskRun) => {
    return run.status === 'completed' && run.outputDir;
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
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                    <h3 className="text-lg font-medium text-gray-900">Task History</h3>
                  </div>
                  <button
                    onClick={onClose}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Task Information</h4>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm text-gray-600 truncate">{task.url}</p>
                    <p className="text-xs text-gray-500">
                      Created {formatDistanceToNow(new Date(task.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                  </div>
                ) : runs.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-700">Run History ({runs.length} runs)</h4>
                    {runs.map((run) => (
                      <div key={run.id} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(run.status)}
                            <div>
                              <h5 className="text-sm font-medium text-gray-900">
                                Run #{run.runNumber}
                              </h5>
                              <p className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(run.startTime), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(run.status)}`}>
                              {run.status}
                            </span>
                            {canDownloadRun(run) && (
                              <button
                                onClick={() => window.open(`/api/scraper/download/${task.id}?run=${run.runNumber}`, '_blank')}
                                className="p-1 text-success-600 hover:text-success-700 transition-colors"
                                title="Download results"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <p className="font-medium text-gray-900">
                              {formatDuration(run.startTime, run.endTime)}
                            </p>
                          </div>
                          <div>
                            <span className="text-gray-500">Progress:</span>
                            <p className="font-medium text-gray-900">{run.progress}%</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Pages Scraped:</span>
                            <p className="font-medium text-gray-900">{run.pagesScraped}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Images:</span>
                            <p className="font-medium text-gray-900">{run.imagesDownloaded}</p>
                          </div>
                        </div>

                        {run.error && (
                          <div className="mt-3 p-2 bg-error-50 border border-error-200 rounded-md">
                            <p className="text-xs text-error-700">{run.error}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No run history available</p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
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
