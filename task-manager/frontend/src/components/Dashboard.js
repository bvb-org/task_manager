import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { tasksApi, pomodoroApi } from '../services/api';
import { Clock, Calendar, CheckCircle, XCircle, AlertCircle, TrendingUp, BarChart2 } from 'lucide-react';
import moment from 'moment';

const Dashboard = () => {
  const [period, setPeriod] = useState('week');
  const [taskStats, setTaskStats] = useState(null);
  const [pomodoroStats, setPomodoroStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = {
    completed: '#22c55e',
    failed: '#ef4444',
    inProgress: '#3b82f6',
    focus: '#3b82f6',
    break: '#22c55e'
  };

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch task stats
      const taskData = await tasksApi.getTaskStats(period);
      setTaskStats(taskData);
      
      // Fetch pomodoro stats for today
      const today = moment().format('YYYY-MM-DD');
      const pomodoroData = await pomodoroApi.getSessionHistory(today);
      setPomodoroStats(pomodoroData.stats);
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch statistics. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for completion rate chart
  const prepareCompletionRateData = () => {
    if (!taskStats) return [];
    
    return taskStats.dates.map((date, index) => ({
      date: moment(date).format('MMM D'),
      completed: taskStats.completed[index],
      failed: taskStats.failed[index],
      inProgress: taskStats.inProgress[index],
      completionRate: taskStats.completionRate[index]
    }));
  };

  // Prepare data for task status pie chart
  const prepareTaskStatusData = () => {
    if (!taskStats) return [];
    
    const completed = taskStats.completed.reduce((sum, val) => sum + val, 0);
    const failed = taskStats.failed.reduce((sum, val) => sum + val, 0);
    const inProgress = taskStats.inProgress.reduce((sum, val) => sum + val, 0);
    
    return [
      { name: 'Completed', value: completed },
      { name: 'Failed', value: failed },
      { name: 'In Progress', value: inProgress }
    ].filter(item => item.value > 0);
  };

  // Calculate overall stats
  const calculateOverallStats = () => {
    if (!taskStats) return { completed: 0, total: 0, rate: 0 };
    
    const completed = taskStats.completed.reduce((sum, val) => sum + val, 0);
    const failed = taskStats.failed.reduce((sum, val) => sum + val, 0);
    const inProgress = taskStats.inProgress.reduce((sum, val) => sum + val, 0);
    const total = completed + failed + inProgress;
    
    return {
      completed,
      total,
      rate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  };

  const overallStats = calculateOverallStats();

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 rounded-lg shadow">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <BarChart2 className="w-6 h-6 mr-2" />
          Dashboard
        </h1>
        
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setPeriod('day')}
            className={`px-3 py-1 text-sm rounded-full ${
              period === 'day' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-3 py-1 text-sm rounded-full ${
              period === 'week' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-3 py-1 text-sm rounded-full ${
              period === 'month' ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
            }`}
          >
            This Month
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
          Loading dashboard data...
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <Calendar className="w-8 h-8 mr-3 text-blue-600" />
                <div>
                  <div className="text-blue-600 font-medium">Total Tasks</div>
                  <div className="text-2xl font-bold">{overallStats.total}</div>
                </div>
              </div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <CheckCircle className="w-8 h-8 mr-3 text-green-600" />
                <div>
                  <div className="text-green-600 font-medium">Completed</div>
                  <div className="text-2xl font-bold">{overallStats.completed}</div>
                </div>
              </div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
              <div className="flex items-center">
                <TrendingUp className="w-8 h-8 mr-3 text-purple-600" />
                <div>
                  <div className="text-purple-600 font-medium">Completion Rate</div>
                  <div className="text-2xl font-bold">{overallStats.rate}%</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Today's Pomodoro Stats */}
          {pomodoroStats && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-gray-600" />
                Today's Pomodoro Sessions
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="text-sm text-blue-600 font-medium">Focus Sessions</div>
                  <div className="text-xl font-bold">{pomodoroStats.focusSessions || 0}</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="text-sm text-green-600 font-medium">Break Sessions</div>
                  <div className="text-xl font-bold">{pomodoroStats.breakSessions || 0}</div>
                </div>
                <div className="bg-purple-50 p-3 rounded-lg">
                  <div className="text-sm text-purple-600 font-medium">Total Focus Time</div>
                  <div className="text-xl font-bold">
                    {Math.round((pomodoroStats.totalFocusTimeSeconds || 0) / 60)} min
                  </div>
                </div>
                <div className="bg-orange-50 p-3 rounded-lg">
                  <div className="text-sm text-orange-600 font-medium">Completion Rate</div>
                  <div className="text-xl font-bold">{pomodoroStats.completionRate || 0}%</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Task Completion Chart */}
          {taskStats && taskStats.dates.length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Task Completion Over Time</h3>
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
                    <Bar dataKey="completed" name="Completed" fill={COLORS.completed} />
                    <Bar dataKey="failed" name="Failed" fill={COLORS.failed} />
                    <Bar dataKey="inProgress" name="In Progress" fill={COLORS.inProgress} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Task Status Distribution */}
          {taskStats && prepareTaskStatusData().length > 0 && (
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-3">Task Status Distribution</h3>
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
                        return <Cell key={`cell-${index}`} fill={COLORS[statusKey] || '#8884d8'} />;
                      })}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
          
          {/* Productivity Tips */}
          <div className="bg-blue-50 p-4 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              Productivity Insights
            </h3>
            
            <div className="space-y-3">
              {overallStats.rate < 50 && (
                <div className="p-3 bg-white rounded-md">
                  <p className="font-medium text-gray-800">Your completion rate is below 50%</p>
                  <p className="text-gray-600">Try breaking down tasks into smaller, more manageable pieces.</p>
                </div>
              )}
              
              {overallStats.rate >= 80 && (
                <div className="p-3 bg-white rounded-md">
                  <p className="font-medium text-gray-800">Great job! Your completion rate is above 80%</p>
                  <p className="text-gray-600">You're doing excellent at completing your tasks.</p>
                </div>
              )}
              
              {pomodoroStats && pomodoroStats.focusSessions < 4 && (
                <div className="p-3 bg-white rounded-md">
                  <p className="font-medium text-gray-800">You've completed {pomodoroStats.focusSessions} focus sessions today</p>
                  <p className="text-gray-600">Aim for at least 4 focus sessions per day for optimal productivity.</p>
                </div>
              )}
              
              {pomodoroStats && pomodoroStats.focusSessions >= 4 && (
                <div className="p-3 bg-white rounded-md">
                  <p className="font-medium text-gray-800">You've completed {pomodoroStats.focusSessions} focus sessions today</p>
                  <p className="text-gray-600">You're doing great with the Pomodoro technique!</p>
                </div>
              )}
              
              <div className="p-3 bg-white rounded-md">
                <p className="font-medium text-gray-800">Productivity Tip</p>
                <p className="text-gray-600">Remember to take regular breaks and stay hydrated for optimal focus.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;