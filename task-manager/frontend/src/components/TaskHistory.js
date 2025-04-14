import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';
import { tasksApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const TaskHistory = () => {
  const [startDate, setStartDate] = useState(moment().subtract(7, 'days').format('YYYY-MM-DD'));
  const [endDate, setEndDate] = useState(moment().format('YYYY-MM-DD'));
  const [taskHistory, setTaskHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'chart'

  // Priority colors
  const PRIORITY_COLORS = {
    urgent: '#ef4444',
    high: '#f97316',
    medium: '#3b82f6',
    low: '#22c55e'
  };

  // Status colors for charts
  const STATUS_COLORS = {
    completed: '#22c55e',
    failed: '#ef4444',
    in_progress: '#3b82f6'
  };

  useEffect(() => {
    fetchTaskHistory();
  }, [startDate, endDate]);

  const fetchTaskHistory = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTaskHistory(startDate, endDate);
      setTaskHistory(data);
      
      // Fetch stats for the same period
      const statsData = await tasksApi.getTaskStats('week');
      setStats(statsData);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch task history. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Group tasks by date
  const tasksByDate = taskHistory.reduce((acc, task) => {
    if (!acc[task.date]) {
      acc[task.date] = [];
    }
    acc[task.date].push(task);
    return acc;
  }, {});

  // Sort dates in descending order
  const sortedDates = Object.keys(tasksByDate).sort((a, b) => 
    moment(b).valueOf() - moment(a).valueOf()
  );

  // Format date for display
  const formatDate = (dateString) => {
    return moment(dateString).format('dddd, MMMM D, YYYY');
  };

  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-500" />;
      default: return null;
    }
  };

  // Format estimated time
  const formatTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  // Prepare data for completion rate chart
  const prepareCompletionRateData = () => {
    if (!stats) return [];
    
    return stats.dates.map((date, index) => ({
      date: moment(date).format('MMM D'),
      completed: stats.completed[index],
      failed: stats.failed[index],
      inProgress: stats.inProgress[index],
      completionRate: stats.completionRate[index]
    }));
  };

  // Prepare data for task status pie chart
  const prepareTaskStatusData = () => {
    if (!stats) return [];
    
    const completed = stats.completed.reduce((sum, val) => sum + val, 0);
    const failed = stats.failed.reduce((sum, val) => sum + val, 0);
    const inProgress = stats.inProgress.reduce((sum, val) => sum + val, 0);
    
    return [
      { name: 'Completed', value: completed },
      { name: 'Failed', value: failed },
      { name: 'In Progress', value: inProgress }
    ].filter(item => item.value > 0);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 rounded-lg shadow">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Calendar className="w-6 h-6 mr-2" />
          Task History
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('list')}
          >
            Task List
          </button>
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'chart' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('chart')}
          >
            Statistics
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-4 text-center text-gray-500 bg-white rounded-lg">
          Loading task history...
        </div>
      ) : (
        <>
          {activeTab === 'list' ? (
            <div className="space-y-6">
              {sortedDates.length > 0 ? (
                sortedDates.map(date => (
                  <div key={date} className="bg-white rounded-lg shadow-sm p-4">
                    <h3 className="text-lg font-semibold mb-3">{formatDate(date)}</h3>
                    <div className="space-y-2">
                      {tasksByDate[date].map(task => (
                        <div 
                          key={task.id}
                          className={`p-3 bg-gray-50 rounded-lg border-l-4`}
                          style={{ borderColor: PRIORITY_COLORS[task.priority] }}
                        >
                          <div className="flex items-start">
                            <div className="mr-2 mt-0.5">
                              {getStatusIcon(task.status)}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium">{task.text}</div>
                              <div className="flex flex-wrap gap-2 mt-1 text-xs">
                                <span className="px-2 py-0.5 rounded-full bg-opacity-20" 
                                  style={{ 
                                    backgroundColor: `${PRIORITY_COLORS[task.priority]}20`,
                                    color: PRIORITY_COLORS[task.priority]
                                  }}>
                                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-opacity-20"
                                  style={{ 
                                    backgroundColor: `${STATUS_COLORS[task.status]}20`,
                                    color: STATUS_COLORS[task.status]
                                  }}>
                                  {getStatusLabel(task.status)}
                                </span>
                                <span className="text-gray-500 flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Est: {formatTime(task.estimated_time)}
                                  {task.actual_time > 0 && ` / Act: ${formatTime(task.actual_time)}`}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 bg-white rounded-lg">
                  No task history found for the selected date range.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Task Completion Statistics</h3>
              
              {stats ? (
                <div className="space-y-8">
                  {/* Completion Rate Chart */}
                  <div>
                    <h4 className="text-md font-medium mb-2">Daily Completion Rate</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareCompletionRateData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="completed" name="Completed" fill={STATUS_COLORS.completed} />
                          <Bar dataKey="failed" name="Failed" fill={STATUS_COLORS.failed} />
                          <Bar dataKey="inProgress" name="In Progress" fill={STATUS_COLORS.in_progress} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Task Status Pie Chart */}
                  <div>
                    <h4 className="text-md font-medium mb-2">Task Status Distribution</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={prepareTaskStatusData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {prepareTaskStatusData().map((entry, index) => {
                              const statusKey = entry.name.toLowerCase().replace(' ', '_');
                              return <Cell key={`cell-${index}`} fill={STATUS_COLORS[statusKey] || '#8884d8'} />;
                            })}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 font-medium">Completed Tasks</div>
                      <div className="text-2xl font-bold">
                        {stats.completed.reduce((sum, val) => sum + val, 0)}
                      </div>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <div className="text-red-600 font-medium">Failed Tasks</div>
                      <div className="text-2xl font-bold">
                        {stats.failed.reduce((sum, val) => sum + val, 0)}
                      </div>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-blue-600 font-medium">Average Completion Rate</div>
                      <div className="text-2xl font-bold">
                        {Math.round(stats.completionRate.reduce((sum, val) => sum + val, 0) / stats.completionRate.length)}%
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No statistics available for the selected date range.
                </div>
              )}
            </div>
          )}
        </>
      )}
      
      {/* Tips */}
      <div className="mt-6 text-sm text-gray-600 bg-blue-50 p-3 rounded-md flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-700">Task History Tips:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Review your completed tasks to celebrate your accomplishments</li>
            <li>Analyze failed tasks to identify patterns and improve</li>
            <li>Compare estimated vs. actual time to better plan future tasks</li>
            <li>Use the statistics to track your productivity trends over time</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TaskHistory;