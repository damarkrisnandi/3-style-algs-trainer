import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Algorithm } from '@/types';
import { categorizeAlgorithmsBySetup } from '@/lib/algorithmAnalyzer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Shuffle, 
  CheckCircle,
  ArrowRight,
  Target
} from 'lucide-react';

interface BatchTrainingProps {
  algorithms: Algorithm[];
}

interface TrainingSession {
  algorithms: Algorithm[];
  currentIndex: number;
  category: string;
  times: number[];
  isActive: boolean;
  startTime: number | null;
  currentTime: number;
}

export const BatchTraining = ({ algorithms }: BatchTrainingProps) => {
  const [categories, setCategories] = useState<Array<{name: string, count: number, algorithms: Algorithm[]}>>([]);
  const [batchSize, setBatchSize] = useState(10);
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [displayTime, setDisplayTime] = useState(0);
  const { saveTimeRecord } = useLocalStorage();

  // Update timer display
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && session?.startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setDisplayTime(now - session.startTime!);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, session?.startTime]);

  // Add body class for mobile timer
  useEffect(() => {
    if (session?.isActive) {
      document.body.classList.add('timer-active');
    } else {
      document.body.classList.remove('timer-active');
    }
    
    return () => {
      document.body.classList.remove('timer-active');
    };
  }, [session?.isActive]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space' && session) {
        event.preventDefault();
        if (isTimerRunning) {
          stopTimer();
        } else {
          startTimer();
        }
      } else if (event.code === 'Escape' && session) {
        event.preventDefault();
        resetTimer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTimerRunning, session]);

  useEffect(() => {
    if (algorithms.length > 0) {
      const categorizedAlgorithms = categorizeAlgorithmsBySetup(algorithms);
      setCategories(categorizedAlgorithms);
    }
  }, [algorithms]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const startBatchTraining = (categoryName: string) => {
    const category = categories.find(c => c.name === categoryName);
    if (!category) return;

    const shuffledAlgorithms = shuffleArray(category.algorithms);
    const batchAlgorithms = shuffledAlgorithms.slice(0, Math.min(batchSize, shuffledAlgorithms.length));

    setSession({
      algorithms: batchAlgorithms,
      currentIndex: 0,
      category: categoryName,
      times: [],
      isActive: true,
      startTime: null,
      currentTime: 0
    });
    setDisplayTime(0);
  };

  const startTimer = () => {
    if (!session) return;
    setSession({
      ...session,
      startTime: Date.now()
    });
    setIsTimerRunning(true);
  };

  const stopTimer = () => {
    if (!session || !session.startTime) return;
    
    const finalTime = Date.now() - session.startTime;
    const currentAlgorithm = session.algorithms[session.currentIndex];
    
    // Record time using correct method signature
    saveTimeRecord({
      algorithmId: `${currentAlgorithm.corners}-${currentAlgorithm.notation}`,
      time: finalTime,
      timestamp: Date.now()
    });
    
    // Add to session times
    const newTimes = [...session.times, finalTime];
    
    // Move to next algorithm or finish session
    if (session.currentIndex + 1 < session.algorithms.length) {
      setSession({
        ...session,
        currentIndex: session.currentIndex + 1,
        times: newTimes,
        startTime: null
      });
    } else {
      setSession({
        ...session,
        times: newTimes,
        isActive: false,
        startTime: null
      });
    }
    
    setIsTimerRunning(false);
    setDisplayTime(0);
  };

  const resetTimer = () => {
    if (!session) return;
    setSession({
      ...session,
      startTime: null
    });
    setIsTimerRunning(false);
    setDisplayTime(0);
  };

  const formatTime = (time: number) => {
    const seconds = time / 1000;
    return seconds.toFixed(3);
  };

  const getSessionStats = () => {
    if (!session || session.times.length === 0) return null;
    
    const times = session.times;
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const best = Math.min(...times);
    const worst = Math.max(...times);
    
    return { avg, best, worst, count: times.length };
  };

  const getCategoryColor = (categoryName: string) => {
    const setupNum = parseInt(categoryName.replace('setup-', '')) || 0;
    const colors = [
      'bg-green-50 border-green-200 text-green-800',
      'bg-blue-50 border-blue-200 text-blue-800',
      'bg-yellow-50 border-yellow-200 text-yellow-800',
      'bg-purple-50 border-purple-200 text-purple-800',
      'bg-red-50 border-red-200 text-red-800',
    ];
    return colors[Math.min(setupNum, colors.length - 1)];
  };

  if (session && session.isActive) {
    const currentAlgorithm = session.algorithms[session.currentIndex];
    const progress = ((session.currentIndex + 1) / session.algorithms.length) * 100;

    return (
      <div className="space-y-6">
        {/* Mobile Timer Controls */}
        <div className="md:hidden fixed bottom-4 left-4 right-4 z-50">
          <div className="flex justify-center space-x-4">
            <Button
              size="lg"
              variant={isTimerRunning ? "destructive" : "default"}
              onClick={isTimerRunning ? stopTimer : startTimer}
              className="flex-1 h-16 text-lg font-semibold"
            >
              {isTimerRunning ? (
                <>
                  <Pause className="w-6 h-6 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-6 h-6 mr-2" />
                  Start
                </>
              )}
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={resetTimer}
              className="h-16 px-6"
            >
              <RotateCcw className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Training Session */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Batch Training: {session.category}
              </div>
              <div className="text-sm font-normal">
                {session.currentIndex + 1} / {session.algorithms.length}
              </div>
            </CardTitle>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Algorithm */}
            <div className="text-center space-y-4">
              <div className="text-xl font-bold">
                {currentAlgorithm.corners}
              </div>
              <div className="text-lg text-slate-600">
                {currentAlgorithm.notation}
              </div>
              <div className="font-mono text-lg bg-slate-100 p-4 rounded-lg break-all">
                {currentAlgorithm.alg}
              </div>
            </div>

            {/* Timer Display */}
            <div className="text-center">
              <div className="text-4xl md:text-6xl lg:text-8xl font-mono font-bold">
                {formatTime(displayTime)}
              </div>
              <div className="text-slate-500 mt-2">
                {isTimerRunning ? 'Running...' : 'Press Space to start'}
              </div>
            </div>

            {/* Desktop Controls */}
            <div className="hidden md:flex justify-center space-x-4">
              <Button
                size="lg"
                variant={isTimerRunning ? "destructive" : "default"}
                onClick={isTimerRunning ? stopTimer : startTimer}
                className="px-8"
              >
                {isTimerRunning ? (
                  <>
                    <Pause className="w-5 h-5 mr-2" />
                    Stop (Space)
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 mr-2" />
                    Start (Space)
                  </>
                )}
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={resetTimer}
              >
                <RotateCcw className="w-5 h-5 mr-2" />
                Reset (Esc)
              </Button>
            </div>

            {/* Progress Summary */}
            {session.times.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {session.times.length}
                  </div>
                  <div className="text-sm text-slate-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(Math.min(...session.times))}s
                  </div>
                  <div className="text-sm text-slate-600">Best</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatTime(session.times.reduce((a, b) => a + b, 0) / session.times.length)}s
                  </div>
                  <div className="text-sm text-slate-600">Average</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {formatTime(Math.max(...session.times))}s
                  </div>
                  <div className="text-sm text-slate-600">Worst</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Session completed
  if (session && !session.isActive) {
    const stats = getSessionStats();
    
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-6 h-6" />
              Session Completed!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div className="text-lg">
                Category: <span className="font-bold">{session.category}</span>
              </div>
              <div className="text-lg">
                Algorithms completed: <span className="font-bold">{session.algorithms.length}</span>
              </div>
            </div>

            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatTime(stats.best)}s
                  </div>
                  <div className="text-sm text-slate-600">Best Time</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {formatTime(stats.avg)}s
                  </div>
                  <div className="text-sm text-slate-600">Average</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {formatTime(stats.worst)}s
                  </div>
                  <div className="text-sm text-slate-600">Worst Time</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.count}
                  </div>
                  <div className="text-sm text-slate-600">Total</div>
                </div>
              </div>
            )}

            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Button
                onClick={() => startBatchTraining(session.category)}
                className="flex items-center gap-2"
              >
                <Shuffle className="w-4 h-4" />
                Train Again
              </Button>
              <Button
                variant="outline"
                onClick={() => setSession(null)}
                className="flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Back to Categories
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Category selection
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Batch Training
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-slate-600">
            Pilih kategori setup moves untuk latihan batch dengan algoritma acak.
          </div>
          
          {/* Batch Size Selector */}
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium">Batch Size:</label>
            <select 
              value={batchSize} 
              onChange={(e) => setBatchSize(Number(e.target.value))}
              className="border rounded px-3 py-1"
            >
              <option value={5}>5 algorithms</option>
              <option value={10}>10 algorithms</option>
              <option value={15}>15 algorithms</option>
              <option value={20}>20 algorithms</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Categories */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Card key={category.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(category.name)}`}>
                  {category.name}
                </div>
                <div className="text-sm font-normal">
                  {category.count} algs
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-slate-600">
                  {category.name === 'setup-0' ? 'No setup moves' : 
                   `${category.name.replace('setup-', '')} setup moves`}
                </div>
                
                <Button
                  onClick={() => startBatchTraining(category.name)}
                  className="w-full"
                  disabled={category.count === 0}
                >
                  <Shuffle className="w-4 h-4 mr-2" />
                  Start Training ({Math.min(batchSize, category.count)} algs)
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
