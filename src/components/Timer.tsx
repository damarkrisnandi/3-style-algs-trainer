import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Algorithm } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface TimerProps {
  algorithm: Algorithm | null;
  onTimeRecorded?: (time: number) => void;
}

export const Timer = ({ algorithm, onTimeRecorded }: TimerProps) => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const { saveTimeRecord, getAlgorithmStats } = useLocalStorage();

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    return `${seconds}.${ms.toString().padStart(3, '0')}`;
  };

  const startTimer = useCallback(() => {
    if (!algorithm) return;
    
    const now = Date.now();
    setStartTime(now);
    setIsRunning(true);
    setIsReady(false);
  }, [algorithm]);

  const stopTimer = useCallback(() => {
    if (!isRunning || !startTime || !algorithm) return;

    const now = Date.now();
    const finalTime = now - startTime;
    setTime(finalTime);
    setIsRunning(false);
    setStartTime(null);

    // Save the time record
    saveTimeRecord({
      algorithmId: `${algorithm.corners}-${algorithm.notation}`,
      time: finalTime,
      timestamp: now,
    });

    onTimeRecorded?.(finalTime);
  }, [isRunning, startTime, algorithm, saveTimeRecord, onTimeRecorded]);

  const resetTimer = useCallback(() => {
    setTime(0);
    setIsRunning(false);
    setIsReady(false);
    setStartTime(null);
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Prevent all default keyboard behaviors during timer operations
    event.preventDefault();
    
    if (event.code === 'Space') {
      if (isRunning) {
        stopTimer();
      } else if (isReady) {
        startTimer();
      } else {
        setIsReady(true);
      }
    } else if (event.code === 'Escape') {
      resetTimer();
    }
  }, [isRunning, isReady, startTimer, stopTimer, resetTimer]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isRunning && startTime) {
      intervalId = setInterval(() => {
        setTime(Date.now() - startTime);
      }, 10);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning, startTime]);

  useEffect(() => {
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  const algorithmStats = algorithm ? getAlgorithmStats(`${algorithm.corners}-${algorithm.notation}`) : null;

  if (!algorithm) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Timer</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">Select an algorithm to start timing</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">Timer</CardTitle>
        <div className="text-center space-y-2">
          <div className="text-sm font-medium">{algorithm.corners}</div>
          <div className="text-xs text-muted-foreground">Notation: {algorithm.notation}</div>
          <div className="text-xs font-mono bg-muted p-2 rounded">{algorithm.alg}</div>
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-4">
        <div className="text-6xl font-mono font-bold">
          {formatTime(time)}
        </div>
        
        <div className="space-y-2">
          {!isRunning && !isReady && (
            <div className="text-sm text-muted-foreground">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to get ready
            </div>
          )}
          {isReady && !isRunning && (
            <div className="text-sm text-green-600">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to start timer
            </div>
          )}
          {isRunning && (
            <div className="text-sm text-red-600">
              Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Space</kbd> to stop timer
            </div>
          )}
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-2 py-1 bg-muted rounded text-xs">Esc</kbd> to reset
          </div>
        </div>

        {algorithmStats && (
          <div className="text-xs space-y-1 text-muted-foreground border-t pt-3">
            <div>Best: {formatTime(algorithmStats.bestTime)}</div>
            <div>Average: {formatTime(algorithmStats.averageTime)}</div>
            <div>Attempts: {algorithmStats.attempts}</div>
            <div className={algorithmStats.isMemorized ? 'text-green-600' : 'text-yellow-600'}>
              {algorithmStats.isMemorized ? '✓ Memorized' : '◯ Learning'}
            </div>
          </div>
        )}

        <div className="flex gap-2 justify-center">
          <Button
            variant="outline"
            size="sm"
            onClick={resetTimer}
            disabled={isRunning}
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
