'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Play, Pause, Square, Settings, Trash2, History, FileText, BarChart3, Clock, Globe, Download } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TaskDetails {
  id: string;
  url: string;
  settings: any;
  status: string;
  progress: number;
  startTime: string;
  endTime: string;
  createdAt: string;
  updatedAt: string;
  totalUrls: number;
  pagesScraped: number;
  pagesFailed: number;
  imagesDownloaded: number;
  outputDir: string;
  error: string;
}

interface TaskRun {
  id: string;
  taskId: string;
  runNumber: number;
  status: string;
  startTime: string;
  endTime: string;
  progress: number;
  totalUrls: number;
  scrapedUrls: number;
  failedUrls: number;
  downloadedImages: number;
  outputDir: string;
  result: string;
  error: string;
}

interface ScrapedPage {
  id: string;
  taskId: string;
  runId: string;
  url: string;
  title: string;
  description: string;
  filename: string;
  filePath: string;
  scrapedAt: string;
  wordCount: number;
  imageCount: number;
  linkCount: number;
  status: string;
  error: string;
}

interface TaskStats {
  total: number;
  successful: number;
  failed: number;
  totalWords: number;
  totalImages: number;
  totalLinks: number;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;
  
  const [task, setTask] = useState<TaskDetails | null>(null);
  const [runs, setRuns] = useState<TaskRun[]>([]);
  const [scrapedPages, setScrapedPages] = useState<ScrapedPage[]>([]);
  const [stats, setStats] = useState<TaskStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'pages'>('overview');

  useEffect(() => {
    loadTaskDetails();
  }, [taskId]);

  const loadTaskDetails = async () => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`);
      if (response.ok) {
        const data = await response.json();
        setTask(data.task);
        setRuns(data.runs);
        setScrapedPages(data.scrapedPages);
        setStats(data.stats);
      } else {
        toast.error('Failed to load task details');
        router.push('/');
      }
    } catch (error) {
      toast.error('Failed to load task details');
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async () => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Task deleted successfully');
        router.push('/');
      } else {
        toast.error('Failed to delete task');
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diff = Math.round((end.getTime() - start.getTime()) / 1000);
    
    if (diff < 60) return `${diff}s`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading task details...</p>
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Task not found</h1>
          <button
            onClick={() => router.push('/')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/')}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Task Details</h1>
                <p className="text-sm text-gray-500">{task.url}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={deleteTask}
                className="btn-secondary text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`w-3 h-3 rounded-full ${
                task.status === 'running' ? 'bg-green-500 animate-pulse' :
                task.status === 'completed' ? 'bg-green-500' :
                task.status === 'failed' ? 'bg-red-500' :
                task.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'
              }`}></div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 capitalize">{task.status}</h2>
                <p className="text-sm text-gray-500">
                  {task.startTime && `Started ${formatDate(task.startTime)}`}
                  {task.endTime && ` • Completed ${formatDate(task.endTime)}`}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">{task.progress}%</div>
              <div className="text-sm text-gray-500">Progress</div>
            </div>
          </div>
          
          {task.status === 'running' && (
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${task.progress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'overview'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'history'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <History className="w-4 h-4" />
                <span>History ({runs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('pages')}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === 'pages'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>Pages ({scrapedPages.length})</span>
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Globe className="w-6 h-6 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total URLs</p>
                        <p className="text-2xl font-semibold text-gray-900">{task.totalUrls}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <FileText className="w-6 h-6 text-success-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Scraped</p>
                        <p className="text-2xl font-semibold text-gray-900">{task.pagesScraped}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Download className="w-6 h-6 text-warning-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Images</p>
                        <p className="text-2xl font-semibold text-gray-900">{task.imagesDownloaded}</p>
                      </div>
                    </div>
                  </div>
                  <div className="card">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <Clock className="w-6 h-6 text-info-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Duration</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          {task.startTime && formatDuration(task.startTime, task.endTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Settings */}
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <pre className="text-sm text-gray-700 overflow-auto">
                      {JSON.stringify(task.settings, null, 2)}
                    </pre>
                  </div>
                </div>

                {task.error && (
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Error</h3>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-700">{task.error}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                {runs.map((run) => (
                  <div key={run.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">Run #{run.runNumber}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          run.status === 'completed' ? 'bg-green-100 text-green-800' :
                          run.status === 'failed' ? 'bg-red-100 text-red-800' :
                          run.status === 'running' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {run.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDate(run.startTime)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Progress:</span>
                        <span className="ml-2 font-medium">{run.progress}%</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Scraped:</span>
                        <span className="ml-2 font-medium">{run.scrapedUrls}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Failed:</span>
                        <span className="ml-2 font-medium">{run.failedUrls}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Duration:</span>
                        <span className="ml-2 font-medium">
                          {formatDuration(run.startTime, run.endTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'pages' && (
              <div className="space-y-4">
                {scrapedPages.map((page) => (
                  <div key={page.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900 truncate">{page.title || page.url}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        page.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {page.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{page.url}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Words:</span>
                        <span className="ml-2 font-medium">{page.wordCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Images:</span>
                        <span className="ml-2 font-medium">{page.imageCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Links:</span>
                        <span className="ml-2 font-medium">{page.linkCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Scraped:</span>
                        <span className="ml-2 font-medium">{formatDate(page.scrapedAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
