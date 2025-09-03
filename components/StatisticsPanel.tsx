'use client';

import { Task } from '@/types/task';
import { BarChart3, Globe, Clock, Download, TrendingUp, AlertTriangle } from 'lucide-react';

interface StatisticsPanelProps {
  tasks: Task[];
}

export default function StatisticsPanel({ tasks }: StatisticsPanelProps) {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const runningTasks = tasks.filter(t => t.status === 'running').length;
  const failedTasks = tasks.filter(t => t.status === 'failed').length;
  const totalPagesScraped = tasks.reduce((sum, task) => sum + (task.pagesScraped || 0), 0);
  const totalImagesDownloaded = tasks.reduce((sum, task) => sum + (task.imagesDownloaded || 0), 0);
  const totalUrls = tasks.reduce((sum, task) => sum + (task.totalUrls || 0), 0);
  const totalTimeSpent = tasks.reduce((sum, task) => {
    if (task.startTime && task.endTime) {
      return sum + (new Date(task.endTime).getTime() - new Date(task.startTime).getTime());
    }
    return sum;
  }, 0);

  const successRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
  const averagePagesPerTask = totalTasks > 0 ? totalPagesScraped / totalTasks : 0;
  const averageTimePerTask = totalTasks > 0 ? totalTimeSpent / totalTasks / 1000 : 0;

  const recentTasks = tasks
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Globe className="w-6 h-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{totalTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <BarChart3 className="w-6 h-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pages Scraped</p>
              <p className="text-2xl font-semibold text-gray-900">{totalPagesScraped}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Download className="w-6 h-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Images Downloaded</p>
              <p className="text-2xl font-semibold text-gray-900">{totalImagesDownloaded}</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Clock className="w-6 h-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(totalTimeSpent / 1000 / 60)}m
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Success Rate</span>
                <span className="font-medium">{successRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-success-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${successRate}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg Pages per Task</span>
                <span className="font-medium">{averagePagesPerTask.toFixed(1)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(averagePagesPerTask / 10, 100)}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">Avg Time per Task</span>
                <span className="font-medium">{averageTimePerTask.toFixed(1)}s</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-warning-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(averageTimePerTask / 60, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Task Status Distribution</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-success-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Completed</span>
              </div>
              <span className="text-sm font-medium">{completedTasks}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-primary-600 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Running</span>
              </div>
              <span className="text-sm font-medium">{runningTasks}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-error-600 rounded-full"></div>
                <span className="text-sm text-gray-600">Failed</span>
              </div>
              <span className="text-sm font-medium">{failedTasks}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="text-sm text-gray-600">Other</span>
              </div>
              <span className="text-sm font-medium">{totalTasks - completedTasks - runningTasks - failedTasks}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Tasks</h3>
        <div className="space-y-3">
          {recentTasks.length > 0 ? (
            recentTasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {task.url}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(task.createdAt).toLocaleDateString()} - {task.pagesScraped} pages
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    task.status === 'completed' ? 'bg-success-100 text-success-800' :
                    task.status === 'running' ? 'bg-primary-100 text-primary-800' :
                    task.status === 'failed' ? 'bg-error-100 text-error-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {task.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>No tasks yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
