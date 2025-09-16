import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BarChart3, TrendingUp, TrendingDown, Minus, Clock, Target, Trophy } from 'lucide-react';
import type { Algorithm } from '@/types';

interface AnalyticsProps {
  algorithms: Algorithm[];
}

export const Analytics = ({ algorithms }: AnalyticsProps) => {
  const { getCategoryAnalytics, algorithmStats } = useLocalStorage();

  const formatTime = (milliseconds: number): string => {
    if (milliseconds === 0) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    return `${seconds}.${ms.toString().padStart(3, '0')}s`;
  };

  const categoryAnalytics = getCategoryAnalytics(algorithms);

  // Calculate overall stats
  const totalAlgorithms = algorithms.length;
  const totalMemorized = algorithmStats.filter(stat => stat.isMemorized).length;
  const totalSkipped = algorithmStats.filter(stat => stat.isSkipped).length;
  const overallMemorizationRate = totalAlgorithms > 0 ? (totalMemorized / totalAlgorithms) * 100 : 0;
  
  const avgTimeOverall = algorithmStats.length > 0 
    ? algorithmStats.reduce((sum, stat) => sum + stat.averageTime, 0) / algorithmStats.length 
    : 0;

  const bestTimeOverall = algorithmStats.length > 0 
    ? Math.min(...algorithmStats.map(stat => stat.bestTime).filter(time => time > 0))
    : 0;

  // Sort categories by memorization rate
  const sortedCategories = [...categoryAnalytics].sort((a, b) => 
    (b.memorizedCount / b.totalAlgorithms) - (a.memorizedCount / a.totalAlgorithms)
  );

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-600" />;
      default:
        return <Minus className="w-4 h-4 text-gray-600" />;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 60) return 'bg-yellow-500';
    if (percentage >= 40) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Overall Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Overall Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{totalAlgorithms}</div>
              <div className="text-sm text-blue-800">Total Algorithms</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalMemorized}</div>
              <div className="text-sm text-green-800">Memorized</div>
              <div className="text-xs text-green-600 mt-1">{overallMemorizationRate.toFixed(1)}%</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{formatTime(avgTimeOverall)}</div>
              <div className="text-sm text-purple-800">Average Time</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{formatTime(bestTimeOverall)}</div>
              <div className="text-sm text-yellow-800">Best Time</div>
            </div>
          </div>

          {/* Memorization Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{totalMemorized}/{totalAlgorithms}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className={`h-3 rounded-full ${getProgressColor(overallMemorizationRate)} transition-all`}
                style={{ width: `${overallMemorizationRate}%` }}
              />
            </div>
          </div>

          {/* Skip Statistics */}
          {totalSkipped > 0 && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="text-sm text-red-800">
                <strong>{totalSkipped}</strong> algorithm{totalSkipped > 1 ? 's' : ''} marked as skipped
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {sortedCategories.map((category) => {
              const memorizationRate = (category.memorizedCount / category.totalAlgorithms) * 100;
              
              return (
                <div key={category.category} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg">{category.category}</h3>
                      <p className="text-sm text-gray-600">
                        {category.memorizedCount}/{category.totalAlgorithms} memorized
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">{memorizationRate.toFixed(1)}%</div>
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        {getTrendIcon(category.improvementTrend)}
                        {category.improvementTrend}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${getProgressColor(memorizationRate)} transition-all`}
                        style={{ width: `${memorizationRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Category Stats */}
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-gray-600">Avg Time</span>
                      </div>
                      <div className="font-semibold">{formatTime(category.averageTime)}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Trophy className="w-3 h-3" />
                        <span className="text-gray-600">Best Time</span>
                      </div>
                      <div className="font-semibold">{formatTime(category.bestTime)}</div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Target className="w-3 h-3" />
                        <span className="text-gray-600">Attempts</span>
                      </div>
                      <div className="font-semibold">{category.totalAttempts}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {/* Find the category that needs most attention */}
            {(() => {
              const needsAttention = sortedCategories.find(cat => 
                (cat.memorizedCount / cat.totalAlgorithms) < 0.5 && cat.totalAlgorithms > 0
              );
              
              if (needsAttention) {
                return (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="font-semibold text-orange-800">Focus Area</div>
                    <div className="text-sm text-orange-700">
                      Consider practicing more <strong>{needsAttention.category}</strong> algorithms. 
                      Only {Math.round((needsAttention.memorizedCount / needsAttention.totalAlgorithms) * 100)}% memorized.
                    </div>
                  </div>
                );
              }

              // If no category needs attention, congratulate
              return (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="font-semibold text-green-800">Great Progress!</div>
                  <div className="text-sm text-green-700">
                    You're doing well across all categories. Keep up the consistent practice!
                  </div>
                </div>
              );
            })()}

            {/* Speed improvement recommendation */}
            {avgTimeOverall > 5000 && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-800">Speed Focus</div>
                <div className="text-sm text-blue-700">
                  Your average solve time is {formatTime(avgTimeOverall)}. 
                  Focus on drilling your memorized algorithms to improve speed.
                </div>
              </div>
            )}

            {/* Consistency recommendation */}
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="font-semibold text-purple-800">Consistency Tip</div>
              <div className="text-sm text-purple-700">
                Practice a little bit every day rather than long sessions once in a while. 
                This helps with long-term retention.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};