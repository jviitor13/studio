"use client";

import { useState, useEffect } from 'react';
import { Clock, Sun } from 'lucide-react';

export function ClockWidget() {
  const [time, setTime] = useState('');
  const [temperature, setTemperature] = useState<number | null>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    };

    updateClock();
    const timerId = setInterval(updateClock, 1000 * 60); // Update every minute

    // Mock temperature
    // In a real app, this would fetch from a weather API
    setTemperature(24);

    return () => clearInterval(timerId);
  }, []);

  return (
    <div className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        <span>{time}</span>
      </div>
      {temperature !== null && (
        <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-border"></div>
            <Sun className="h-4 w-4 text-yellow-500" />
            <span>{temperature}°C</span>
        </div>
      )}
    </div>
  );
}
