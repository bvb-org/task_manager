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
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [completed, setCompleted] = useState(0);
  const [activeTask, setActiveTask] = useState(null);
  const [currentPomodoroSession, setCurrentPomodoroSession] = useState(null);

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
        const duration = isBreak ? 5 * 60 : 25 * 60; // 5 or 25 minutes in seconds
        
        const sessionData = {
          task_id: activeTask ? activeTask.id : null,
          duration,
          type: sessionType
        };
        
        const response = await pomodoroApi.startSession(sessionData);
        setCurrentPomodoroSession(response);
        setIsRunning(true);
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
    setTimeLeft(isBreak ? 5 * 60 : 25 * 60);
    setCurrentPomodoroSession(null);
  };

  // Set active task for the pomodoro
  const setTaskActive = (task) => {
    setActiveTask(task);
    resetTimer();
  };

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
            return isBreak ? 25 * 60 : 5 * 60;
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
    isRunning,
    isBreak,
    completed,
    activeTask,
    currentPomodoroSession,
    formatTime,
    toggleTimer,
    resetTimer,
    setTaskActive,
    setActiveTask
  };

  return (
    <TimerContext.Provider value={timerContextValue}>
      {children}
    </TimerContext.Provider>
  );
};