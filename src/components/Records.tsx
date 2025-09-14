import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Algorithm } from '@/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BarChart3, Clock, Target, TrendingUp, RotateCcw } from 'lucide-react';

interface RecordsProps {
  algorithms: Algorithm[];
}

export const Records = ({ algorithms }: RecordsProps) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);
  const { getAlgorithmStats, getRecordsForAlgorithm, algorithmStats, resetAlgorithmData } = useLocalStorage();

  const formatTime = (milliseconds: number): string => {
    return (milliseconds / 1000).toFixed(3) + 's';
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleResetAlgorithm = () => {
    if (!selectedAlgorithm) return;
    
    const algorithmId = `${selectedAlgorithm.corners}-${selectedAlgorithm.notation}`;
    if (window.confirm(`Are you sure you want to reset all data for ${selectedAlgorithm.corners}? This will delete all timing records and statistics for this algorithm.`)) {
      resetAlgorithmData(algorithmId);
      // Clear selection since data is now empty
      setSelectedAlgorithm(null);
    }
  };

  const overallStats = {
    totalAlgorithms: algorithms.length,
    memorizedCount: algorithmStats.filter(stat => stat.isMemorized).length,
    totalAttempts: algorithmStats.reduce((sum, stat) => sum + stat.attempts, 0),
    averageTime: algorithmStats.length > 0 
      ? algorithmStats.reduce((sum, stat) => sum + stat.averageTime, 0) / algorithmStats.length 
      : 0,
  };

  return (
    <div className="space-y-6">
      {/* Overall Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {overallStats.memorizedCount}
              </div>
              <div className="text-sm text-muted-foreground">Memorized</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {overallStats.totalAlgorithms - overallStats.memorizedCount}
              </div>
              <div className="text-sm text-muted-foreground">Learning</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {overallStats.totalAttempts}
              </div>
              <div className="text-sm text-muted-foreground">Total Attempts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {overallStats.averageTime > 0 ? formatTime(overallStats.averageTime) : '--'}
              </div>
              <div className="text-sm text-muted-foreground">Avg Time</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Progress</span>
              <span>{Math.round((overallStats.memorizedCount / overallStats.totalAlgorithms) * 100)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2 mt-1">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(overallStats.memorizedCount / overallStats.totalAlgorithms) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Algorithm List */}
      <Card>
        <CardHeader>
          <CardTitle>Algorithm Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {algorithms.map((algorithm) => {
              const stats = getAlgorithmStats(`${algorithm.corners}-${algorithm.notation}`);
              return (
                <div
                  key={`${algorithm.corners}-${algorithm.notation}`}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedAlgorithm?.corners === algorithm.corners && 
                    selectedAlgorithm?.notation === algorithm.notation
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedAlgorithm(algorithm)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium">{algorithm.corners}</div>
                      <div className="text-sm text-muted-foreground">{algorithm.notation}</div>
                    </div>
                    <div className="text-right">
                      {stats ? (
                        <div className="space-y-1">
                          <div className="text-sm font-medium">
                            {formatTime(stats.bestTime)}
                          </div>
                          <div className={`text-xs ${stats.isMemorized ? 'text-green-600' : 'text-yellow-600'}`}>
                            {stats.isMemorized ? '✓ Memorized' : `${stats.attempts} attempts`}
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">No data</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Stats for Selected Algorithm */}
      {selectedAlgorithm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                {selectedAlgorithm.corners} - {selectedAlgorithm.notation}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetAlgorithm}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Reset
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const stats = getAlgorithmStats(`${selectedAlgorithm.corners}-${selectedAlgorithm.notation}`);
              const records = getRecordsForAlgorithm(`${selectedAlgorithm.corners}-${selectedAlgorithm.notation}`);
              
              if (!stats || records.length === 0) {
                return (
                  <div className="text-center text-muted-foreground py-8">
                    No practice records yet. Start practicing to see detailed statistics!
                  </div>
                );
              }

              return (
                <div className="space-y-4">
                  {/* Algorithm Display */}
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="font-mono text-center">{selectedAlgorithm.alg}</div>
                  </div>

                  {/* Key Stats */}
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="flex items-center justify-center gap-1 text-green-600">
                        <Clock className="w-4 h-4" />
                        <span className="font-bold">{formatTime(stats.bestTime)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Best Time</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-blue-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="font-bold">{formatTime(stats.averageTime)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Average</div>
                    </div>
                    <div>
                      <div className="flex items-center justify-center gap-1 text-purple-600">
                        <BarChart3 className="w-4 h-4" />
                        <span className="font-bold">{stats.attempts}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">Attempts</div>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="text-center">
                    <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                      stats.isMemorized 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stats.isMemorized ? '✓ Memorized' : '◯ Learning'}
                    </div>
                  </div>

                  {/* Recent Records */}
                  <div>
                    <h4 className="font-medium mb-2">Recent Times</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {records
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .slice(0, 10)
                        .map((record, index) => (
                          <div key={record.id} className="flex justify-between items-center text-sm">
                            <span>#{records.length - index}</span>
                            <span>{formatTime(record.time)}</span>
                            <span className="text-muted-foreground">{formatDate(record.timestamp)}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
