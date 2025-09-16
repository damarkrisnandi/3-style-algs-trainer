import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Algorithm } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { ChevronLeft, ChevronRight, RotateCcw, Eye, EyeOff, SkipForward, CheckCircle } from 'lucide-react';

interface FlashcardsProps {
  algorithms: Algorithm[];
  onAlgorithmSelect?: (algorithm: Algorithm) => void;
}

export const Flashcards = ({ algorithms, onAlgorithmSelect }: FlashcardsProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [filterMemorized, setFilterMemorized] = useState(false);
  const [filterSkipped, setFilterSkipped] = useState(true);
  const { getAlgorithmStats, toggleSkipAlgorithm, toggleMemorizeAlgorithm } = useLocalStorage();

  const filteredAlgorithms = algorithms.filter(alg => {
    const stats = getAlgorithmStats(`${alg.corners}-${alg.notation}`);
    
    // Filter out skipped algorithms if filterSkipped is true
    if (filterSkipped && stats?.isSkipped) {
      return false;
    }
    
    // Filter out memorized algorithms if filterMemorized is true
    if (filterMemorized && stats?.isMemorized) {
      return false;
    }
    
    return true;
  });

  const currentAlgorithm = filteredAlgorithms[currentIndex];

  const nextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredAlgorithms.length);
    setShowAnswer(false);
  };

  const prevCard = () => {
    setCurrentIndex((prev) => (prev - 1 + filteredAlgorithms.length) % filteredAlgorithms.length);
    setShowAnswer(false);
  };

  const toggleAnswer = () => {
    setShowAnswer(!showAnswer);
  };

  const resetToFirst = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
  };

  const selectForTimer = () => {
    if (currentAlgorithm && onAlgorithmSelect) {
      onAlgorithmSelect(currentAlgorithm);
    }
  };

  const handleSkipAlgorithm = () => {
    if (currentAlgorithm) {
      toggleSkipAlgorithm(`${currentAlgorithm.corners}-${currentAlgorithm.notation}`);
      nextCard(); // Move to next card after skipping
    }
  };

  const handleToggleMemorized = () => {
    if (currentAlgorithm) {
      toggleMemorizeAlgorithm(`${currentAlgorithm.corners}-${currentAlgorithm.notation}`);
    }
  };

  // Touch/swipe handling for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      setTouchStartX(touch.clientX);
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (e.changedTouches.length === 1) {
      const touch = e.changedTouches[0];
      const touchEndX = touch.clientX;
      const deltaX = touchEndX - touchStartX;
      
      // Require minimum swipe distance
      if (Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          prevCard(); // Swipe right = previous
        } else {
          nextCard(); // Swipe left = next
        }
      }
    }
  };

  const [touchStartX, setTouchStartX] = useState(0);

  if (filteredAlgorithms.length === 0) {
    return (
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader>
          <CardTitle className="text-center">Flashcards</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="text-muted-foreground">
            {filterMemorized 
              ? "All algorithms are memorized! Great job!" 
              : "No algorithms available"}
          </p>
          {filterMemorized && (
            <Button 
              variant="outline" 
              onClick={() => setFilterMemorized(false)}
              className="mt-4"
            >
              Show All Algorithms
            </Button>
          )}
          {!filterSkipped && (
            <Button 
              variant="outline" 
              onClick={() => setFilterSkipped(true)}
              className="mt-4 ml-2"
            >
              Hide Skipped
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  const algorithmStats = getAlgorithmStats(`${currentAlgorithm.corners}-${currentAlgorithm.notation}`);

  return (
    <Card 
      className="w-full max-w-lg mx-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <CardHeader>
        <CardTitle className="text-center flex items-center justify-between">
          <span>Flashcards</span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterMemorized(!filterMemorized)}
              className="text-xs"
            >
              {filterMemorized ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              {filterMemorized ? 'Show All' : 'Hide Memorized'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilterSkipped(!filterSkipped)}
              className="text-xs"
            >
              {filterSkipped ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {filterSkipped ? 'Show Skipped' : 'Hide Skipped'}
            </Button>
          </div>
        </CardTitle>
        <div className="text-center text-sm text-muted-foreground">
          {currentIndex + 1} of {filteredAlgorithms.length}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          {/* Question Side */}
          <div className="space-y-2">
            <div className="text-2xl font-bold">{currentAlgorithm.corners}</div>
            <div className="text-lg text-muted-foreground">
              Notation: {currentAlgorithm.notation}
            </div>
          </div>

          {/* Answer Side */}
          <div className="min-h-[120px] flex items-center justify-center">
            {showAnswer ? (
              <div className="space-y-2">
                <div className="text-xl font-mono bg-muted p-4 rounded-lg">
                  {currentAlgorithm.alg}
                </div>
                
                {/* Algorithm Status and Controls */}
                <div className="flex gap-2 justify-center">
                  <Button
                    variant={algorithmStats?.isMemorized ? "default" : "outline"}
                    size="sm"
                    onClick={handleToggleMemorized}
                    className="text-xs"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    {algorithmStats?.isMemorized ? 'Memorized' : 'Mark Memorized'}
                  </Button>
                  <Button
                    variant={algorithmStats?.isSkipped ? "destructive" : "outline"}
                    size="sm"
                    onClick={handleSkipAlgorithm}
                    className="text-xs"
                  >
                    <SkipForward className="w-4 h-4 mr-1" />
                    {algorithmStats?.isSkipped ? 'Skipped' : 'Skip'}
                  </Button>
                </div>
                
                {algorithmStats && (
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <div>Best: {(algorithmStats.bestTime / 1000).toFixed(3)}s</div>
                    <div>Avg: {(algorithmStats.averageTime / 1000).toFixed(3)}s</div>
                    <div>Attempts: {algorithmStats.attempts}</div>
                    <div className={algorithmStats.isMemorized ? 'text-green-600' : 'text-yellow-600'}>
                      {algorithmStats.isMemorized ? '✓ Memorized' : '◯ Learning'}
                    </div>
                    {algorithmStats.isSkipped && (
                      <div className="text-red-600">⊘ Skipped</div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center">
                <div className="text-6xl mb-4">🤔</div>
                <Button onClick={toggleAnswer} variant="outline">
                  Show Algorithm
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            size="sm"
            onClick={prevCard}
            disabled={filteredAlgorithms.length <= 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetToFirst}
              title="Reset to first card"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            
            {showAnswer && (
              <Button
                variant="default"
                size="sm"
                onClick={selectForTimer}
              >
                Practice
              </Button>
            )}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={nextCard}
            disabled={filteredAlgorithms.length <= 1}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {!showAnswer && (
          <div className="text-center">
            <Button onClick={toggleAnswer} size="lg" className="w-full">
              Reveal Algorithm
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
