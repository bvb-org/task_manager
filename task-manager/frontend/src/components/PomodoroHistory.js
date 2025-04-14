import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Play, CheckCircle, AlertCircle } from 'lucide-react';
import moment from 'moment';
import { pomodoroApi } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const PomodoroHistory = () => {
  const [date, setDate] = useState(moment().format('YYYY-MM-DD'));
  const [history, setHistory] = useState({ sessions: [], stats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('list'); // 'list', 'chart'

  // Colors for charts
  const COLORS = {
    focus: '#3b82f6',
    break: '#22c55e',
    completed: '#22c55e',
    incomplete: '#ef4444'
  };

  useEffect(() => {
    fetchPomodoroHistory();
  }, [date]);

  const fetchPomodoroHistory = async () => {
    try {
      setLoading(true);
      const data = await pomodoroApi.getSessionHistory(date);
      setHistory(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch pomodoro history. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Format time in seconds to minutes and seconds
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format time for display in the list
  const formatTimeForDisplay = (seconds) => {
    if (seconds < 60) {
      return `${seconds} seconds`;
    }
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins} min ${secs} sec` : `${mins} min`;
  };

  // Format date and time
  const formatDateTime = (dateTimeString) => {
    return moment(dateTimeString).format('h:mm A');
  };

  // Prepare data for session type chart
  const prepareSessionTypeData = () => {
    const { stats } = history;
    if (!stats) return [];
    
    return [
      { name: 'Focus', value: stats.focusSessions },
      { name: 'Break', value: stats.breakSessions }
    ];
  };

  // Prepare data for completion status chart
  const prepareCompletionStatusData = () => {
    const { stats } = history;
    if (!stats) return [];
    
    const completedSessions = stats.completedFocusSessions;
    const incompleteSessions = stats.focusSessions - stats.completedFocusSessions;
    
    return [
      { name: 'Completed', value: completedSessions },
      { name: 'Incomplete', value: incompleteSessions }
    ].filter(item => item.value > 0);
  };

  // Prepare data for time distribution chart
  const prepareTimeDistributionData = () => {
    const { stats } = history;
    if (!stats) return [];
    
    return [
      { name: 'Focus Time', value: Math.round(stats.totalFocusTimeSeconds / 60) },
      { name: 'Break Time', value: Math.round(stats.totalBreakTimeSeconds / 60) }
    ];
  };

  return (
    <div className="max-w-4xl mx-auto p-4 bg-gray-50 rounded-lg shadow">
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
          <Clock className="w-6 h-6 mr-2" />
          Pomodoro History
        </h1>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('list')}
          >
            Session List
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
          Loading pomodoro history...
        </div>
      ) : (
        <>
          {activeTab === 'list' ? (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-3 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {moment(date).format('dddd, MMMM D, YYYY')}
              </h3>
              
              {history.sessions && history.sessions.length > 0 ? (
                <div className="space-y-3">
                  {history.sessions.map(session => (
                    <div 
                      key={session.id}
                      className={`p-3 rounded-lg border-l-4 ${
                        session.type === 'focus' 
                          ? 'bg-blue-50 border-blue-500' 
                          : 'bg-green-50 border-green-500'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start">
                          <div className={`mr-3 ${
                            session.type === 'focus' ? 'text-blue-600' : 'text-green-600'
                          }`}>
                            {session.type === 'focus' ? <Play className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-medium">
                              {session.type === 'focus' ? 'Focus Session' : 'Break Session'}
                              {session.task_text && ` - ${session.task_text}`}
                            </div>
                            <div className="text-sm text-gray-600">
                              Started at {formatDateTime(session.started_at)} • 
                              Duration: {formatTimeForDisplay(session.duration)}
                            </div>
                          </div>
                        </div>
                        <div>
                          {session.completed === 1 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Completed
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No pomodoro sessions found for this date.
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="text-lg font-semibold mb-4">Pomodoro Statistics</h3>
              
              {history.stats && history.stats.totalSessions > 0 ? (
                <div className="space-y-8">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="text-blue-600 font-medium">Total Sessions</div>
                      <div className="text-2xl font-bold">{history.stats.totalSessions}</div>
                      <div className="text-sm text-gray-600">
                        {history.stats.focusSessions} focus, {history.stats.breakSessions} break
                      </div>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="text-green-600 font-medium">Completion Rate</div>
                      <div className="text-2xl font-bold">{history.stats.completionRate}%</div>
                      <div className="text-sm text-gray-600">
                        {history.stats.completedFocusSessions} of {history.stats.focusSessions} focus sessions
                      </div>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="text-purple-600 font-medium">Total Focus Time</div>
                      <div className="text-2xl font-bold">
                        {formatTime(history.stats.totalFocusTimeSeconds)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {Math.round(history.stats.totalFocusTimeSeconds / 60)} minutes
                      </div>
                    </div>
                  </div>
                  
                  {/* Session Type Pie Chart */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-md font-medium mb-2">Session Types</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareSessionTypeData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell key="cell-focus" fill={COLORS.focus} />
                              <Cell key="cell-break" fill={COLORS.break} />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                    
                    {/* Completion Status Pie Chart */}
                    <div>
                      <h4 className="text-md font-medium mb-2">Focus Session Completion</h4>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={prepareCompletionStatusData()}
                              cx="50%"
                              cy="50%"
                              labelLine={false}
                              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              outerRadius={80}
                              fill="#8884d8"
                              dataKey="value"
                            >
                              <Cell key="cell-completed" fill={COLORS.completed} />
                              <Cell key="cell-incomplete" fill={COLORS.incomplete} />
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                  
                  {/* Time Distribution Bar Chart */}
                  <div>
                    <h4 className="text-md font-medium mb-2">Time Distribution (minutes)</h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={prepareTimeDistributionData()}
                          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" name="Minutes" fill="#8884d8">
                            {prepareTimeDistributionData().map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={index === 0 ? COLORS.focus : COLORS.break} 
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No statistics available for this date.
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
          <p className="font-medium text-blue-700">Pomodoro Tips:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Aim for 4-5 completed focus sessions per day</li>
            <li>Always take your break sessions to avoid burnout</li>
            <li>Use focus sessions for one specific task at a time</li>
            <li>Track your most productive days to identify patterns</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PomodoroHistory;