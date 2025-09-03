'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Globe, 
  Play, 
  Pause, 
  Trash2, 
  Settings, 
  BarChart3, 
  FileText,
  Download,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import TaskCard from '@/components/TaskCard';
import NewTaskModal from '@/components/NewTaskModal';
import TaskSettingsModal from '@/components/TaskSettingsModal';
import TaskDetailsModal from '@/components/TaskDetailsModal';
import TaskHistoryModal from '@/components/TaskHistoryModal';
import StatisticsPanel from '@/components/StatisticsPanel';

import { Task, TaskStatus, TaskSettings } from '@/types/task';
import { io } from 'socket.io-client';

export default function Dashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'statistics'>('tasks');
  const [loading, setLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const loadTasks = async () => {
    try {
      const response = await fetch('/api/tasks');
      if (response.ok) {
        const data = await response.json();
        // Ensure all task properties have default values to prevent HMR issues
        const sanitizedTasks = (data.tasks || []).map((task: any) => ({
          id: task.id || '',
          url: task.url || '',
          settings: task.settings || {},
          status: task.status || 'pending',
          progress: task.progress || 0,
          startTime: task.startTime || null,
          endTime: task.endTime || null,
          pagesScraped: task.pagesScraped || 0,
          pagesFailed: task.pagesFailed || 0,
          imagesDownloaded: task.imagesDownloaded || 0,
          totalUrls: task.totalUrls || 0,
          currentUrl: task.currentUrl || '',
          outputDir: task.outputDir || '',
          createdAt: task.createdAt || new Date().toISOString(),
          updatedAt: task.updatedAt || new Date().toISOString(),
          result: task.result || undefined,
          error: task.error || undefined
        }));
        setTasks(sanitizedTasks);
      }
    } catch (error) {
      // Error loading tasks
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load tasks from database
    loadTasks();

    const socket = io('http://localhost:3000', {
      transports: ['websocket', 'polling'],
      timeout: 20000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true, // Force a new connection
      autoConnect: true,
      path: '/api/socket'
    });



    socket.on('task:started', (data) => {
      // JOIN THE TASK ROOM for real-time updates
      socket.emit('join-task', data.taskId);
      
      // Reload tasks to get the new task
      loadTasks();
    });

    socket.on('task:progress', (data) => {
      
      if (!data?.taskId) {
        return;
      }
      
      setTasks(prev => {
        const updated = prev.map(task => 
          task?.id === data.taskId 
            ? { 
                ...task, 
                status: data.status || task?.status || 'pending',
                progress: data.progress || task?.progress || 0,
                pagesScraped: data.pagesScraped || task?.pagesScraped || 0,
                pagesFailed: data.pagesFailed || task?.pagesFailed || 0,
                imagesDownloaded: data.imagesDownloaded || task?.imagesDownloaded || 0,
                currentUrl: data.currentUrl || task?.currentUrl || '',
                totalUrls: data.totalUrls || task?.totalUrls || 0
              }
            : task
        );
        return updated;
      });
      
      // Force a re-render
      setUpdateTrigger(prev => prev + 1);
    });

    socket.on('task:completed', (data) => {
      
      if (!data?.taskId) {
        return;
      }
      
      setTasks(prev => prev.map(task => 
        task?.id === data.taskId 
          ? { 
              ...task, 
              status: 'completed',
              progress: 100,
              pagesScraped: data.pagesScraped || task?.pagesScraped || 0,
              pagesFailed: data.pagesFailed || task?.pagesFailed || 0,
              imagesDownloaded: data.imagesDownloaded || task?.imagesDownloaded || 0,
              totalUrls: data.totalUrls || task?.totalUrls || 0
            }
          : task
      ));
      toast.success(`Task completed: ${data.pagesScraped || 0} pages scraped`);
    });

    socket.on('task:failed', (data) => {
      
      if (!data?.taskId) {
        return;
      }
      
      setTasks(prev => prev.map(task => 
        task?.id === data.taskId 
          ? { ...task, status: 'failed', error: data.error || 'Unknown error' }
          : task
      ));
      toast.error(`Task failed: ${data.error || 'Unknown error'}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const addTask = async (url: string, settings: TaskSettings) => {
    setIsNewTaskModalOpen(false);
    toast.success('Task created successfully!');

    // Start the task
    await startTask(url, settings);
  };

  const startTask = async (url: string, settings: TaskSettings) => {
    try {
      const response = await fetch('/api/scraper/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, settings }),
      });

      if (!response.ok) {
        throw new Error('Failed to start task');
      }

      const data = await response.json();
      toast.success(`Started scraping ${url}`);
      
      // Reload tasks to get the new task
      await loadTasks();
    } catch (error) {
      // Error starting task
      toast.error('Failed to start task');
    }
  };

  const pauseTask = async (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'paused' }
        : t
    ));

    try {
      await fetch('/api/scraper/pause', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      toast.success('Task paused');
    } catch (error) {
      // Error pausing task
      toast.error('Failed to pause task');
    }
  };

  const resumeTask = async (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'running' }
        : t
    ));

    try {
      await fetch('/api/scraper/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      toast.success('Task resumed');
    } catch (error) {
      // Error resuming task
      toast.error('Failed to resume task');
    }
  };

  const stopTask = async (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, status: 'stopped', endTime: new Date().toISOString() }
        : t
    ));

    try {
      await fetch('/api/scraper/stop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      toast.success('Task stopped');
    } catch (error) {
      // Error stopping task
      toast.error('Failed to stop task');
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      setTasks(prev => prev.filter(t => t.id !== taskId));
      toast.success('Task deleted successfully');
    } catch (error) {
      // Error deleting task
      toast.error('Failed to delete task');
    }
  };

  const rerunTask = async (taskId: string) => {
    try {
      // Immediately update the UI to show the task is starting
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { 
              ...task, 
              status: 'running' as const,
              progress: 0,
              pagesScraped: 0,
              pagesFailed: 0,
              imagesDownloaded: 0,
              totalUrls: 0,
              startTime: new Date().toISOString(),
              endTime: null,
              error: undefined
            }
          : task
      ));

      const response = await fetch('/api/scraper/rerun', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });

      if (!response.ok) {
        throw new Error('Failed to re-run task');
      }

      toast.success('Task re-run started successfully');
    } catch (error) {
      // Error re-running task
      toast.error('Failed to re-run task');
      
      // Revert the UI change if the request failed
      setTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' as const }
          : task
      ));
    }
  };

  const openTaskSettings = (task: Task) => {
    setSelectedTask(task);
    setIsSettingsModalOpen(true);
  };

  const openTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsDetailsModalOpen(true);
  };

  const openTaskHistory = (task: Task) => {
    setSelectedTask(task);
    setIsHistoryModalOpen(true);
  };

  const updateTaskSettings = (taskId: string, settings: TaskSettings) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId 
        ? { ...t, settings, updatedAt: new Date().toISOString() }
        : t
    ));
    setIsSettingsModalOpen(false);
    toast.success('Task settings updated');
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case 'running': return 'text-success-600';
      case 'completed': return 'text-success-600';
      case 'failed': return 'text-error-600';
      case 'paused': return 'text-warning-600';
      case 'stopped': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

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

  const runningTasks = tasks.filter(t => t?.status === 'running');
  const completedTasks = tasks.filter(t => t?.status === 'completed');
  const failedTasks = tasks.filter(t => t?.status === 'failed');

  return (
    <div key="dashboard-root" className="min-h-screen bg-gray-50">
      {/* Header */}
      <header key="dashboard-header" className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <Globe className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Web Scraper Dashboard</h1>
                <p className="text-sm text-gray-500">Advanced web scraping with real-time monitoring</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsNewTaskModalOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Play className="w-4 h-4" />
                <span>New Task</span>
              </button>
              <button
                onClick={() => {
                  	const socket = io('http://localhost:3000', {
		path: '/api/socket'
	});
                  
                  socket.on('connect', () => {
                    socket.emit('test-client', { message: 'Test from browser!' });
                  });
                  
                  socket.on('test-response', (data) => {
                    toast.success('Socket connection working!');
                    socket.disconnect();
                  });
                  
                  socket.on('connect_error', (error) => {
                    toast.error('Socket connection failed!');
                  });
                  
                  // Timeout after 5 seconds
                  setTimeout(() => {
                    if (socket.connected) {
                      socket.disconnect();
                    }
                  }, 5000);
                }}
                className="btn-secondary flex items-center space-x-2"
              >
                <span>Test Socket</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div key="dashboard-nav" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
                              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'tasks'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('statistics')}
                              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              Statistics
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main key={activeTab} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'tasks' ? (
          <div key="tasks-content" className="space-y-6">
            {/* Quick Stats */}
            <div key="quick-stats" className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Play className="w-6 h-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Running</p>
                    <p className="text-2xl font-semibold text-gray-900">{runningTasks.length}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-success-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">{completedTasks.length}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <XCircle className="w-6 h-6 text-error-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Failed</p>
                    <p className="text-2xl font-semibold text-gray-900">{failedTasks.length}</p>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Pages</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.reduce((sum, task) => sum + (task.pagesScraped || 0), 0)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Grid */}
            <div key={`tasks-grid-${tasks.length}`} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {tasks.map((task) => (
                task && (
                  <TaskCard
                    key={task.id || 'unknown'}
                    task={task}
                    onStart={() => startTask(task.url || '', task.settings || {})}
                    onPause={() => pauseTask(task.id || '')}
                    onResume={() => resumeTask(task.id || '')}
                    onStop={() => stopTask(task.id || '')}
                    onDelete={() => deleteTask(task.id || '')}
                    onRerun={() => rerunTask(task.id || '')}
                    onSettings={() => openTaskSettings(task)}
                    onDetails={() => openTaskDetails(task)}
                    onHistory={() => openTaskHistory(task)}
                  />
                )
              ))}
            </div>

            {tasks.length === 0 && (
              <motion.div
                key="no-tasks"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12"
              >
                <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
                <p className="text-gray-500 mb-6">Create your first scraping task to get started</p>
                <button
                  onClick={() => setIsNewTaskModalOpen(true)}
                  className="btn-primary"
                >
                  Create First Task
                </button>
              </motion.div>
            )}
          </div>
        ) : (
          <StatisticsPanel key={`stats-${tasks.length}`} tasks={tasks} />
        )}
      </main>

      {/* Modals */}
      <NewTaskModal
        key="new-task-modal"
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
        onSubmit={addTask}
      />

      {selectedTask && (
        <>
          <TaskSettingsModal
            key={`settings-modal-${selectedTask.id}`}
            isOpen={isSettingsModalOpen}
            onClose={() => setIsSettingsModalOpen(false)}
            task={selectedTask}
            onUpdate={updateTaskSettings}
          />
          <TaskDetailsModal
            key={`details-modal-${selectedTask.id}`}
            isOpen={isDetailsModalOpen}
            onClose={() => setIsDetailsModalOpen(false)}
            task={selectedTask}
            onRerun={() => selectedTask && rerunTask(selectedTask.id)}
          />
          <TaskHistoryModal
            key={`history-modal-${selectedTask.id}`}
            isOpen={isHistoryModalOpen}
            onClose={() => setIsHistoryModalOpen(false)}
            task={selectedTask}
            onRerun={() => selectedTask && rerunTask(selectedTask.id)}
          />
        </>
      )}
    </div>
  );
}
