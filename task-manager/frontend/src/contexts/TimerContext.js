import React, { createContext, useState, useContext, useEffect } from 'react';
import { pomodoroApi } from '../services/api';

// Create the context
const TimerContext = createContext();

// Custom hook to use the timer context
export const useTimer = () => useContext(TimerContext);

// Timer provider component
export const TimerProvider = ({ children }) => {
  // Timer states
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes in seconds
  const [totalTime, setTotalTime] = useState(25 * 60); // Total time for the current session
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const [currentPomodoroSession, setCurrentPomodoroSession] = useState(null);
  const [sessionHistory, setSessionHistory] = useState([]);

  // Constants for timer durations
  const FOCUS_TIME = 25 * 60; // 25 minutes in seconds
  const BREAK_TIME = 5 * 60; // 5 minutes in seconds

  // Time formatting helper
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start/pause timer
  const toggleTimer = async () => {
    if (!isRunning) {
      // Starting timer
      try {
        const sessionType = isBreak ? 'break' : 'focus';
        const duration = isBreak ? BREAK_TIME : FOCUS_TIME; // 5 or 25 minutes in seconds
        
        const sessionData = {
          task_id: activeTask ? activeTask.id : null,
          duration,
          type: sessionType
        };
        
        const response = await pomodoroApi.startSession(sessionData);
        setCurrentPomodoroSession(response);
        setIsRunning(true);
        
        // Add to session history
        setSessionHistory(prev => [...prev, {
          id: response.id,
          type: sessionType,
          startTime: new Date(),
          taskId: activeTask ? activeTask.id : null,
          taskName: activeTask ? activeTask.text : null
        }]);
        
      } catch (err) {
        console.error('Failed to start pomodoro session:', err);
        // Still allow the timer to run even if API call fails
        setIsRunning(true);
      }
    } else {
      // Pausing timer
      setIsRunning(false);
    }
  };

  // Reset timer
  const resetTimer = () => {
    setIsRunning(false);
    const newTime = isBreak ? BREAK_TIME : FOCUS_TIME;
    setTimeLeft(newTime);
    setTotalTime(newTime);
    setCurrentPomodoroSession(null);
  };

  // Set active task for the pomodoro
  const setTaskActive = (task) => {
    setActiveTask(task);
    resetTimer();
  };

  // Switch between focus and break modes
  const switchMode = () => {
    setIsBreak(prev => !prev);
    const newTime = !isBreak ? BREAK_TIME : FOCUS_TIME;
    setTimeLeft(newTime);
    setTotalTime(newTime);
    setIsRunning(false);
  };

  // Initialize timer based on mode
  useEffect(() => {
    const newTime = isBreak ? BREAK_TIME : FOCUS_TIME;
    setTimeLeft(newTime);
    setTotalTime(newTime);
  }, [isBreak]);

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
            if (currentPomodoroSession) {
              pomodoroApi.completeSession(currentPomodoroSession.id)
                .then(() => {
                  console.log('Pomodoro session completed');
                  
                  // Update session history
                  setSessionHistory(prev => 
                    prev.map(session => 
                      session.id === currentPomodoroSession.id 
                        ? { ...session, completed: true, endTime: new Date() } 
                        : session
                    )
                  );
                })
                .catch(err => {
                  console.error('Failed to complete pomodoro session:', err);
                });
            }
            
            if (!isBreak) {
              setCompleted(prev => prev + 1);
              // If there's an active task, mark it as completed
              if (activeTask) {
                // We'll handle this in the TaskManager component
                setActiveTask(null);
              }
            }
            
            // Toggle between session and break
            setIsBreak(prev => !prev);
            setCurrentPomodoroSession(null);
            
            // Set new time based on the new mode
            const newTime = isBreak ? FOCUS_TIME : BREAK_TIME;
            setTotalTime(newTime);
            return newTime;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!isRunning && interval) {
      clearInterval(interval);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, isBreak, activeTask, currentPomodoroSession]);

  // The context value that will be provided
  const timerContextValue = {
    timeLeft,
    totalTime,
    isRunning,
    isBreak,
    completed,
    activeTask,
    currentPomodoroSession,
    sessionHistory,
    formatTime,
    toggleTimer,
    resetTimer,
    setTaskActive,
    setActiveTask,
    switchMode,
    FOCUS_TIME,
    BREAK_TIME
  };

  return (
    <TimerContext.Provider value={timerContextValue}>
      {children}
    </TimerContext.Provider>
  );
};