import React, { useState, useEffect } from 'react';
import { Clock, Check, CheckCircle, Circle, Play, Pause, RefreshCw, AlertCircle } from 'lucide-react';

const TaskManager = () => {
  // Task priority levels
  const PRIORITY = {
    URGENT: 'urgent',
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low'
  };

  // Initial tasks based on your needs
  const initialTasks = [
    { id: 1, text: "Request days off in company portal", completed: false, priority: PRIORITY.URGENT, estimatedTime: 10 },
    { id: 2, text: "Message backups about rescheduling Thursday meeting", completed: false, priority: PRIORITY.URGENT, estimatedTime: 15 },
    { id: 3, text: "Complete and send document to electrical systems", completed: false, priority: PRIORITY.HIGH, estimatedTime: 30 },
    { id: 4, text: "Get haircut", completed: false, priority: PRIORITY.MEDIUM, estimatedTime: 90 },
    { id: 5, text: "Wash and dry three sets of clothes", completed: false, priority: PRIORITY.MEDIUM, estimatedTime: 120 },
    { id: 6, text: "Go to the gym", completed: false, priority: PRIORITY.MEDIUM, estimatedTime: 60 },
    { id: 7, text: "Refine fitness app for mobile", completed: false, priority: PRIORITY.LOW, estimatedTime: 120 },
  ];

  // State
  const [tasks, setTasks] = useState(initialTasks);
  const [newTask, setNewTask] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState(PRIORITY.MEDIUM);
  const [newTaskTime, setNewTaskTime] = useState(30);
  const [activeTask, setActiveTask] = useState(null);
  const [filterCompleted, setFilterCompleted] = useState(false);
  
  // Pomodoro States
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completed, setCompleted] = useState(0);

  // Time formatting helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/pause timer
  const toggleTimer = () => {
    setIsRunning(!isRunning);
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
  };

  // Handle adding a new task
  const addTask = () => {
    if (newTask.trim() !== "") {
      const task = {
        id: Date.now(),
        text: newTask,
        completed: false,
        priority: newTaskPriority,
        estimatedTime: newTaskTime
      };
      setTasks([...tasks, task]);
      setNewTask("");
    }
  };

  // Toggle task completion
  const toggleComplete = (id) => {
    setTasks(
      tasks.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  // Set active task for the pomodoro
  const setTaskActive = (task) => {
    setActiveTask(task);
    resetTimer();
  };

  // Delete a task
  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id));
    if (activeTask && activeTask.id === id) {
      setActiveTask(null);
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

  // Timer effect
  useEffect(() => {
    let interval = null;
    
    if (isRunning) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => {
          if (prevTime <= 1) {
            clearInterval(interval);
            setIsRunning(false);
            
            // Handle session completion
            if (!isBreak) {
              setCompleted(prev => prev + 1);
              // If there's an active task, mark it as completed
              if (activeTask) {
                toggleComplete(activeTask.id);
                setActiveTask(null);
              }
            }
            
            // Toggle between session and break
            setIsBreak(prev => !prev);
            return isBreak ? 25 * 60 : 5 * 60;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isBreak, activeTask]);

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
    <div className="flex flex-col h-full max-w-4xl mx-auto p-4 bg-gray-50 rounded-lg shadow">
      {/* Header with stats */}
      <div className="mb-6 pb-4 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Task Manager</h1>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="mr-4">
              <span className="text-sm text-gray-500">Completed: </span>
              <span className="font-semibold">{completedCount}/{totalCount}</span>
            </div>
            <div className="w-48 bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full" 
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
          <div>
            <button
              onClick={() => setFilterCompleted(!filterCompleted)}
              className={`px-3 py-1 text-sm rounded-full ${
                filterCompleted ? 'bg-blue-100 text-blue-700' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {filterCompleted ? 'Show All' : 'Hide Completed'}
            </button>
          </div>
        </div>
      </div>

      {/* Pomodoro Timer */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-3 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-gray-600" />
          Pomodoro Timer
        </h2>
        <div className="flex flex-col mb-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-3xl font-bold font-mono">
              {formatTime(timeLeft)}
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={toggleTimer} 
                className={`p-2 rounded-full ${isRunning ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <button 
                onClick={resetTimer} 
                className="p-2 rounded-full bg-gray-100 text-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            {isBreak ? 'Break time!' : 'Focus session'} - {isBreak ? '5:00' : '25:00'} minutes
          </div>
        </div>
        
        {activeTask ? (
          <div className="bg-blue-50 p-3 rounded-md flex justify-between items-center">
            <div>
              <div className="text-sm text-blue-700 font-medium">Currently working on:</div>
              <div className="font-medium">{activeTask.text}</div>
            </div>
            <button 
              onClick={() => setActiveTask(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="text-sm text-gray-500 italic">
            Select a task below to focus on
          </div>
        )}
      </div>

      {/* Task list */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Your Tasks</h2>
        <div className="space-y-2">
          {filteredTasks.length > 0 ? (
            filteredTasks.map(task => (
              <div 
                key={task.id}
                className={`p-3 bg-white rounded-lg shadow-sm border-l-4 ${
                  task.completed ? 'border-gray-300 bg-gray-50' : `border-${getPriorityColor(task.priority).split('-')[1]}-500`
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start flex-1">
                    <button 
                      onClick={() => toggleComplete(task.id)}
                      className={`mt-0.5 mr-3 ${task.completed ? 'text-green-500' : 'text-gray-400 hover:text-gray-600'}`}
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
                          {formatEstimatedTime(task.estimatedTime)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    {!task.completed && (
                      <button 
                        onClick={() => setTaskActive(task)}
                        className={`p-1.5 rounded hover:bg-gray-100 ${activeTask?.id === task.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500'}`}
                        title="Focus on this task"
                      >
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    <button 
                      onClick={() => deleteTask(task.id)}
                      className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                      title="Delete task"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-gray-500 bg-white rounded-lg">
              No tasks to display. {filterCompleted && <span>Try showing all tasks.</span>}
            </div>
          )}
        </div>
      </div>

      {/* Add new task */}
      <div className="mt-auto pt-4 border-t border-gray-200">
        <h2 className="text-lg font-semibold mb-3">Add New Task</h2>
        <div className="flex flex-col space-y-3">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') addTask();
            }}
          />
          
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={PRIORITY.URGENT}>Urgent</option>
                <option value={PRIORITY.HIGH}>High</option>
                <option value={PRIORITY.MEDIUM}>Medium</option>
                <option value={PRIORITY.LOW}>Low</option>
              </select>
            </div>
            
            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time (minutes)</label>
              <input
                type="number"
                min="1"
                value={newTaskTime}
                onChange={(e) => setNewTaskTime(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <button
            onClick={addTask}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Add Task
          </button>
        </div>
      </div>
      
      {/* Tips and reminders */}
      <div className="mt-6 text-sm text-gray-600 bg-blue-50 p-3 rounded-md flex items-start">
        <AlertCircle className="w-5 h-5 mr-2 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-blue-700">Quick Tips:</p>
          <ul className="mt-1 list-disc list-inside space-y-1">
            <li>Focus on one task at a time</li>
            <li>Take short breaks between tasks</li>
            <li>Urgent tasks first, then important ones</li>
            <li>Complete your app work as a reward after finishing other tasks</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TaskManager;