import React, { useState, useEffect, useRef } from 'react';
import { Clock, Check, CheckCircle, Circle, Play, Pause, RefreshCw, AlertCircle, Coffee, Zap, List, CheckSquare } from 'lucide-react';
import { tasksApi } from '../services/api';
import { useTimer } from '../contexts/TimerContext';

const TaskManager = () => {
  // Get timer state and functions from context
  const {
    timeLeft,
    isRunning,
    isBreak,
    completed,
    activeTask,
    setActiveTask,
    formatTime,
    toggleTimer,
    resetTimer,
    setTaskActive,
    totalTime
  } = useTimer();
  
  // Task priority levels
  const PRIORITY = {
    URGENT: 'urgent',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  };

  // State
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(PRIORITY.MEDIUM);
  const [newTaskTime, setNewTaskTime] = useState(30);
  const [filterCompleted, setFilterCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPomodoroSession, setCurrentPomodoroSession] = useState(null);
  const [timerAnimation, setTimerAnimation] = useState(false);
  
  // Refs for animations
  const timerRef = useRef(null);
  const progressRef = useRef(null);

  // Calculate progress percentage
  const progressPercentage = totalTime > 0 ? (timeLeft / totalTime) * 100 : 0;

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  // Fetch tasks from API
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await tasksApi.getTasks();
      setTasks(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding a new task
  const addTask = async () => {
    if (newTask.trim() !== "") {
      try {
        const task = {
          text: newTask,
          priority: newTaskPriority,
          estimated_time: newTaskTime
        };
        
        const createdTask = await tasksApi.createTask(task);
        setTasks([...tasks, createdTask]);
        setNewTask("");
        setError(null);
      } catch (err) {
        setError('Failed to add task. Please try again.');
        console.error(err);
      }
    }
  };

  // Toggle task completion
  const toggleComplete = async (id) => {
    try {
      const task = tasks.find(t => t.id === id);
      if (!task) return;
      
      const updatedTask = await tasksApi.updateTask(id, { 
        completed: !task.completed 
      });
      
      setTasks(
        tasks.map(task =>
          task.id === id ? updatedTask : task
        )
      );
      
      // If this was the active task and it's now completed, clear it
      if (activeTask && activeTask.id === id && updatedTask.completed) {
        setActiveTask(null);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to update task. Please try again.');
      console.error(err);
    }
  };

  // Delete a task
  const deleteTask = async (id) => {
    try {
      await tasksApi.deleteTask(id);
      
      setTasks(tasks.filter(task => task.id !== id));
      if (activeTask && activeTask.id === id) {
        setActiveTask(null);
      }
      
      setError(null);
    } catch (err) {
      setError('Failed to delete task. Please try again.');
      console.error(err);
    }
  };

  // Sort tasks by priority and completion status
  const sortedTasks = [...tasks].sort((a, b) => {
    // First sort by completion (incomplete first)
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    // Then by priority
    const priorityOrder = {
      [PRIORITY.URGENT]: 1,
      [PRIORITY.HIGH]: 2,
      [PRIORITY.MEDIUM]: 3,
      [PRIORITY.LOW]: 4
    };
    
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  // Filter tasks based on completion status if filter is active
  const filteredTasks = filterCompleted 
    ? sortedTasks
    : sortedTasks.filter(task => !task.completed);

  // Calculate total completed tasks count
  const completedCount = tasks.filter(task => task.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 
    ? Math.round((completedCount / totalCount) * 100) 
    : 0;
  
  // Add an effect to handle task completion when timer completes
  useEffect(() => {
    if (activeTask && !isRunning && timeLeft === 0 && !isBreak) {
      toggleComplete(activeTask.id);
    }
  }, [activeTask, isRunning, timeLeft, isBreak]);

  // Effect for timer animation
  useEffect(() => {
    if (isRunning) {
      setTimerAnimation(true);
    } else {
      setTimerAnimation(false);
    }
  }, [isRunning]);

  // Helper for priority color
  const getPriorityColor = (priority) => {
    switch (priority) {
      case PRIORITY.URGENT: return 'bg-red-500';
      case PRIORITY.HIGH: return 'bg-orange-400';
      case PRIORITY.MEDIUM: return 'bg-blue-400';
      case PRIORITY.LOW: return 'bg-green-400';
      default: return 'bg-gray-400';
    }
  };

  // Helper for priority label
  const getPriorityLabel = (priority) => {
    switch (priority) {
      case PRIORITY.URGENT: return 'Urgent';
      case PRIORITY.HIGH: return 'High';
      case PRIORITY.MEDIUM: return 'Medium';
      case PRIORITY.LOW: return 'Low';
      default: return 'Medium';
    }
  };

  // Format estimated time
  const formatEstimatedTime = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    }
  };

  return (
    <div className={`flex flex-col h-full max-w-4xl mx-auto p-4 rounded-lg shadow-lg transition-all duration-500 ${isBreak ? 'bg-break-background' : 'bg-work-background'}`}>
      {/* Header with stats */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className={`text-2xl font-bold mb-2 transition-colors duration-500 ${isBreak ? 'text-break-text' : 'text-work-text'}`}>
          Task Manager
        </h1>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-4">
              <span className="text-sm text-gray-500">Completed: </span>
              <span className="font-semibold">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-48 bg-gray-200 rounded-full h-2.5 overflow-hidden">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-1000" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <button
              onClick={() => setFilterCompleted(!filterCompleted)}
              className={`px-3 py-1 text-sm rounded-full transition-colors duration-300 ${
                filterCompleted 
                  ? `${isBreak ? 'bg-break-light text-break-dark' : 'bg-work-light text-work-dark'}` 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {filterCompleted ? 'Show All' : 'Hide Completed'}
            </button>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md animate-fade-in">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Pomodoro Timer */}
      <div className={`mb-6 p-6 rounded-xl shadow-lg transition-all duration-500 relative overflow-hidden ${
        isBreak 
          ? 'bg-break-primary bg-opacity-10 border border-break-primary border-opacity-20' 
          : 'bg-work-primary bg-opacity-10 border border-work-primary border-opacity-20'
      }`}>
        {/* Background animation */}
        {isRunning && (
          <div className={`absolute inset-0 opacity-10 ${isBreak ? 'wave-container' : ''}`}>
            {isBreak ? (
              <div className="wave" style={{ backgroundColor: 'var(--break-primary)' }}></div>
            ) : (
              <div className="absolute inset-0 bg-gradient-radial from-work-primary to-transparent opacity-20"></div>
            )}
          </div>
        )}
        
        <h2 className={`text-lg font-semibold mb-4 flex items-center transition-colors duration-500 ${
          isBreak ? 'text-break-dark' : 'text-work-dark'
        }`}>
          {isBreak ? (
            <Coffee className={`w-5 h-5 mr-2 text-break-primary`} />
          ) : (
            <Zap className={`w-5 h-5 mr-2 text-work-primary`} />
          )}
          {isBreak ? 'Break Time' : 'Focus Session'}
        </h2>
        
        <div className="flex flex-col items-center mb-6">
          {/* Timer circle */}
          <div 
            ref={timerRef}
            className={`relative w-48 h-48 mb-4 rounded-full flex items-center justify-center ${
              isBreak 
                ? 'bg-break-light border-4 border-break-primary border-opacity-30' 
                : 'bg-work-light border-4 border-work-primary border-opacity-30'
            } transition-all duration-500`}
          >
            {/* Pulse animation when timer is running */}
            {isRunning && (
              <div className={`absolute inset-0 rounded-full ${
                isBreak ? 'pulse-ring bg-break-primary' : 'pulse-ring bg-work-primary'
              }`}></div>
            )}
            
            {/* Timer progress circle */}
            <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle 
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke={isBreak ? 'var(--break-light)' : 'var(--work-light)'} 
                strokeWidth="8"
                className="opacity-50"
              />
              <circle 
                ref={progressRef}
                cx="50" 
                cy="50" 
                r="45" 
                fill="none" 
                stroke={isBreak ? 'var(--break-primary)' : 'var(--work-primary)'} 
                strokeWidth="8"
                strokeDasharray="283"
                strokeDashoffset={283 - (283 * progressPercentage) / 100}
                className="transition-all duration-1000"
              />
            </svg>
            
            {/* Timer text */}
            <div className="z-10 text-center">
              <div className={`timer-display text-5xl font-mono transition-colors duration-500 ${
                isBreak ? 'text-break-dark' : 'text-work-dark'
              }`}>
                {formatTime(timeLeft)}
              </div>
              <div className={`text-sm mt-1 font-medium transition-colors duration-500 ${
                isBreak ? 'text-break-secondary' : 'text-work-secondary'
              }`}>
                {isBreak ? 'Relax' : 'Focus'}
              </div>
            </div>
          </div>
          
          {/* Timer controls */}
          <div className="flex space-x-4">
            <button 
              onClick={toggleTimer} 
              className={`p-3 rounded-full shadow-md transition-all duration-300 ${
                isRunning 
                  ? (isBreak ? 'bg-break-primary text-white hover:bg-break-dark' : 'bg-work-primary text-white hover:bg-work-dark') 
                  : (isBreak ? 'bg-break-light text-break-primary hover:bg-break-primary hover:text-white' : 'bg-work-light text-work-primary hover:bg-work-primary hover:text-white')
              }`}
            >
              {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
            </button>
            <button 
              onClick={resetTimer} 
              className={`p-3 rounded-full shadow-md transition-all duration-300 ${
                isBreak 
                  ? 'bg-break-light text-break-primary hover:bg-break-primary hover:text-white' 
                  : 'bg-work-light text-work-primary hover:bg-work-primary hover:text-white'
              }`}
            >
              <RefreshCw className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        {/* Active task */}
        {activeTask ? (
          <div className={`p-4 rounded-lg transition-all duration-500 ${
            isBreak 
              ? 'bg-break-light bg-opacity-70' 
              : 'bg-work-light bg-opacity-70'
          }`}>
            <div className="flex justify-between items-center">
              <div>
                <div className={`text-sm font-medium mb-1 ${
                  isBreak ? 'text-break-dark' : 'text-work-dark'
                }`}>
                  {isBreak ? 'Taking a break from:' : 'Currently working on:'}
                </div>
                <div className="font-medium text-lg">{activeTask.text}</div>
              </div>
              <button 
                onClick={() => setActiveTask(null)}
                className={`p-2 rounded-full ${
                  isBreak 
                    ? 'text-break-dark hover:bg-break-primary hover:text-white' 
                    : 'text-work-dark hover:bg-work-primary hover:text-white'
                } transition-colors duration-300`}
              >
                ×
              </button>
            </div>
          </div>
        ) : (
          <div className={`text-center p-4 rounded-lg border border-dashed ${
            isBreak 
              ? 'border-break-primary border-opacity-30 text-break-dark' 
              : 'border-work-primary border-opacity-30 text-work-dark'
          }`}>
            <div className="flex flex-col items-center">
              <CheckSquare className={`w-6 h-6 mb-2 ${
                isBreak ? 'text-break-primary' : 'text-work-primary'
              }`} />
              <span className="text-sm">
                {isBreak ? 'Enjoy your break!' : 'Select a task below to focus on'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="mb-6">
        <h2 className={`text-lg font-semibold mb-3 flex items-center ${
          isBreak ? 'text-break-dark' : 'text-work-dark'
        }`}>
          <List className={`w-5 h-5 mr-2 ${
            isBreak ? 'text-break-primary' : 'text-work-primary'
          }`} />
          Your Tasks
        </h2>
        
        {loading ? (
          <div className="p-4 text-center text-gray-500 bg-white rounded-lg animate-pulse">
            Loading tasks...
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.length > 0 ? (
              filteredTasks.map(task => (
                <div 
                  key={task.id}
                  className={`p-4 bg-white rounded-lg shadow-sm border-l-4 transition-all duration-300 hover:shadow-md ${
                    task.completed 
                      ? 'border-gray-300 bg-gray-50' 
                      : `border-${getPriorityColor(task.priority).split('-')[1]}-500`
                  } ${activeTask?.id === task.id ? (isBreak ? 'ring-2 ring-break-primary' : 'ring-2 ring-work-primary') : ''}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start flex-1">
                      <button 
                        onClick={() => toggleComplete(task.id)}
                        className={`mt-0.5 mr-3 transition-colors duration-300 ${
                          task.completed 
                            ? 'text-green-500' 
                            : `text-gray-400 hover:${isBreak ? 'text-break-primary' : 'text-work-primary'}`
                        }`}
                      >
                        {task.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                      </button>
                      <div className="flex-1">
                        <div className={`${task.completed ? 'line-through text-gray-500' : 'text-gray-800'}`}>
                          {task.text}
                        </div>
                        <div className="flex items-center space-x-2 mt-1 text-xs">
                          <span className={`px-2 py-0.5 rounded-full ${getPriorityColor(task.priority)} bg-opacity-20 font-medium`}>
                            {getPriorityLabel(task.priority)}
                          </span>
                          <span className="text-gray-500 flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {formatEstimatedTime(task.estimated_time)}
                          </span>
                          {task.actual_time > 0 && (
                            <span className="text-gray-500">
                              / Actual: {formatEstimatedTime(task.actual_time)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-1">
                      {!task.completed && (
                        <button 
                          onClick={() => setTaskActive(task)}
                          className={`p-1.5 rounded transition-colors duration-300 ${
                            activeTask?.id === task.id 
                              ? (isBreak ? 'bg-break-light text-break-primary' : 'bg-work-light text-work-primary') 
                              : 'text-gray-500 hover:bg-gray-100'
                          }`}
                          title="Focus on this task"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => deleteTask(task.id)}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors duration-300"
                        title="Delete task"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`p-6 text-center rounded-lg border-2 border-dashed ${
                isBreak ? 'border-break-primary border-opacity-30 text-break-dark' : 'border-work-primary border-opacity-30 text-work-dark'
              }`}>
                <div className="flex flex-col items-center">
                  <CheckSquare className={`w-8 h-8 mb-2 ${
                    isBreak ? 'text-break-primary' : 'text-work-primary'
                  }`} />
                  <p className="text-lg font-medium mb-1">No tasks to display</p>
                  <p className="text-sm text-gray-500">
                    {filterCompleted ? 'Try showing all tasks.' : 'Add a new task below to get started.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add new task */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <h2 className={`text-lg font-semibold mb-3 ${
          isBreak ? 'text-break-dark' : 'text-work-dark'
        }`}>Add New Task</h2>
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${
              isBreak 
                ? 'border-break-primary border-opacity-30 focus:ring-break-primary' 
                : 'border-work-primary border-opacity-30 focus:ring-work-primary'
            }`}
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
          />
          
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className={`block text-sm font-medium mb-1 ${
                isBreak ? 'text-break-dark' : 'text-work-dark'
              }`}>Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${
                  isBreak 
                    ? 'border-break-primary border-opacity-30 focus:ring-break-primary' 
                    : 'border-work-primary border-opacity-30 focus:ring-work-primary'
                }`}
              >
                <option value={PRIORITY.URGENT}>Urgent</option>
                <option value={PRIORITY.HIGH}>High</option>
                <option value={PRIORITY.MEDIUM}>Medium</option>
                <option value={PRIORITY.LOW}>Low</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[180px]">
              <label className={`block text-sm font-medium mb-1 ${
                isBreak ? 'text-break-dark' : 'text-work-dark'
              }`}>Estimated Time (minutes)</label>
              <input
                type="number"
                min="1"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(parseInt(e.target.value) || 1)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors duration-300 ${
                  isBreak 
                    ? 'border-break-primary border-opacity-30 focus:ring-break-primary' 
                    : 'border-work-primary border-opacity-30 focus:ring-work-primary'
                }`}
              />
            </div>
          </div>
          
          <button
            onClick={addTask}
            className={`w-full py-2 px-4 rounded-lg text-white shadow-md transition-all duration-300 ${
              isBreak 
                ? 'bg-break-primary hover:bg-break-dark' 
                : 'bg-work-primary hover:bg-work-dark'
            }`}
          >
            Add Task
          </button>
        </div>
      </div>
      
      {/* Tips and reminders */}
      <div className={`mt-6 text-sm p-4 rounded-lg transition-all duration-500 ${
        isBreak 
          ? 'bg-break-light text-break-dark' 
          : 'bg-work-light text-work-dark'
      }`}>
        <div className="flex items-start">
          <AlertCircle className={`w-5 h-5 mr-2 flex-shrink-0 mt-0.5 ${
            isBreak ? 'text-break-primary' : 'text-work-primary'
          }`} />
          <div>
            <p className={`font-medium ${
              isBreak ? 'text-break-primary' : 'text-work-primary'
            }`}>
              {isBreak ? 'Break Time Tips:' : 'Focus Time Tips:'}
            </p>
            <ul className="mt-1 list-disc list-inside space-y-1">
              {isBreak ? (
                <>
                  <li>Stand up and stretch</li>
                  <li>Rest your eyes from the screen</li>
                  <li>Take a few deep breaths</li>
                  <li>Hydrate yourself</li>
                </>
              ) : (
                <>
                  <li>Focus on one task at a time</li>
                  <li>Eliminate distractions</li>
                  <li>Urgent tasks first, then important ones</li>
                  <li>Break complex tasks into smaller steps</li>
                </>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;