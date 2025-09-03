'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Pause, 
  Square, 
  Settings, 
  FileText, 
  Download,
  Clock,
  Globe,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  RotateCcw,
  History
} from 'lucide-react';
import { Task, TaskStatus } from '@/types/task';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { 
  getStatusColor, 
  getStatusText, 
  formatUrlForDisplay, 
  calculateProgress,
  calculateEstimatedTime 
} from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onDelete: () => void;
  onRerun: () => void;
  onSettings: () => void;
  onDetails: () => void;
  onHistory: () => void;
}

export default function TaskCard({
  task,
  onStart,
  onPause,
  onResume,
  onStop,
  onDelete,
  onRerun,
  onSettings,
  onDetails,
  onHistory,
}: TaskCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getStatusIcon = (status: TaskStatus) => {
    switch (status) {
      case 'running': return <div className="w-2 h-2 bg-success-600 rounded-full animate-pulse-slow" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-success-600" />;
      case 'failed': return <XCircle className="w-4 h-4 text-error-600" />;
      case 'paused': return <AlertCircle className="w-4 h-4 text-warning-600" />;
      case 'stopped': return <div className="w-2 h-2 bg-gray-600 rounded-full" />;
      default: return <div className="w-2 h-2 bg-gray-400 rounded-full" />;
    }
  };

  const getTimeElapsed = () => {
    if (!task?.startTime) return null;
    try {
      const start = new Date(task.startTime);
      const end = task.endTime ? new Date(task.endTime) : new Date();
      return formatDistanceToNow(start, { addSuffix: true });
    } catch (error) {
      // Error calculating time elapsed
      return 'Unknown';
    }
  };

  const getEstimatedTime = () => {
    if (task?.status !== 'running' || !task?.startTime) return null;
    try {
      return calculateEstimatedTime(task.startTime, task.progress || 0);
    } catch (error) {
      // Error calculating estimated time
      return 'Unknown';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      className="card hover:shadow-lg transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Globe className="w-5 h-5 text-primary-600" />
          <div className="flex-1 min-w-0">
            <Link href={`/tasks/${task.id}`}>
              <h3 className="text-sm font-medium text-gray-900 truncate hover:text-primary-600 transition-colors">
                {formatUrlForDisplay(task.url)}
              </h3>
            </Link>
            <p className="text-xs text-gray-500 truncate">{task.url}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
          {getStatusIcon(task.status)}
          <span>{getStatusText(task.status)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      {(task.status === 'running' || task.status === 'completed') && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{calculateProgress(task.progress)}%</span>
          </div>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${calculateProgress(task.progress)}%` }}
            />
          </div>
        </div>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{task.pagesScraped || 0}</div>
        <div className="text-xs text-gray-500">Pages Scraped</div>
        </div>
        <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{task.pagesFailed || 0}</div>
        <div className="text-xs text-gray-500">Pages Failed</div>
        </div>
        <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{task.totalUrls || 0}</div>
        <div className="text-xs text-gray-500">Total URLs</div>
        </div>
        {(task.imagesDownloaded || 0) > 0 && (
          <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{task.imagesDownloaded || 0}</div>
        <div className="text-xs text-gray-500">Images Downloaded</div>
          </div>
        )}
      </div>

      {/* Time Information */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center space-x-1">
          <Clock className="w-3 h-3" />
          <span>{getTimeElapsed()}</span>
        </div>
        {getEstimatedTime() && (
          <span>~{getEstimatedTime()}s remaining</span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex space-x-1">
          {task.status === 'pending' && (
            <button
              onClick={onStart}
              className="p-2 text-success-600 hover:bg-success-50 rounded-md transition-colors"
              title="Start"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
          
          {task.status === 'running' && (
            <>
              <button
                onClick={onPause}
                className="p-2 text-warning-600 hover:bg-warning-50 rounded-md transition-colors"
                title="Pause"
              >
                <Pause className="w-4 h-4" />
              </button>
              <button
                onClick={onStop}
                className="p-2 text-error-600 hover:bg-error-50 rounded-md transition-colors"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          )}
          
          {task.status === 'paused' && (
            <>
              <button
                onClick={onResume}
                className="p-2 text-success-600 hover:bg-success-50 rounded-md transition-colors"
                title="Resume"
              >
                <Play className="w-4 h-4" />
              </button>
              <button
                onClick={onStop}
                className="p-2 text-error-600 hover:bg-error-50 rounded-md transition-colors"
                title="Stop"
              >
                <Square className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        <div className="flex space-x-1">
          <button
            onClick={onSettings}
            className="p-2 text-gray-600 hover:bg-gray-50 rounded-md transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          
          {task.status === 'completed' && (
            <>
              <button
                onClick={onRerun}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                title="Re-run Task"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={onDetails}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                title="View Details"
              >
                <FileText className="w-4 h-4" />
              </button>
              <button
                onClick={onHistory}
                className="p-2 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
                title="View History"
              >
                <History className="w-4 h-4" />
              </button>
              <button
                onClick={() => window.open(`/api/scraper/download/${task.id}`, '_blank')}
                className="p-2 text-success-600 hover:bg-success-50 rounded-md transition-colors"
                title="Download Results"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          )}
          
          <button
            onClick={onDelete}
            className="p-2 text-error-600 hover:bg-error-50 rounded-md transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Error Message */}
      {task.error && (
        <div className="mt-3 p-2 bg-error-50 border border-error-200 rounded-md">
          <p className="text-xs text-error-700">{task.error}</p>
        </div>
      )}
    </motion.div>
  );
}
