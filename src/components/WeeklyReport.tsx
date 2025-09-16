import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Calendar, TrendingUp, Target, Trophy, AlertTriangle } from 'lucide-react';
import type { Algorithm } from '@/types';

interface WeeklyReportProps {
  algorithms: Algorithm[];
}

export const WeeklyReport = ({ algorithms }: WeeklyReportProps) => {
  const [selectedWeek, setSelectedWeek] = useState(0); // 0 = current week, 1 = last week, etc.
  const { getWeeklyStats, getCategoryAnalytics, algorithmStats } = useLocalStorage();

  // Get the start of the selected week
  const getWeekStart = (weeksAgo: number) => {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Start from Monday
    const weekStart = new Date(now.setDate(diff - (weeksAgo * 7)));
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
  };

  const formatTime = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = milliseconds % 1000;
    return `${seconds}.${ms.toString().padStart(3, '0')}s`;
  };

  const formatDuration = (milliseconds: number): string => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const weekStart = getWeekStart(selectedWeek);
  const weekStats = getWeeklyStats(weekStart);
  const categoryAnalytics = getCategoryAnalytics(algorithms);

  // Calculate insights
  const getInsights = () => {
    const insights = [];
    
    // Total practice insights
    if (weekStats.practiceCount === 0) {
      insights.push({
        type: 'warning' as const,
        title: 'No Practice This Week',
        description: 'You haven\'t practiced any algorithms this week. Consider setting aside some time for training.',
        icon: AlertTriangle,
      });
    } else if (weekStats.practiceCount < 20) {
      insights.push({
        type: 'info' as const,
        title: 'Light Practice Week',
        description: `You practiced ${weekStats.practiceCount} times this week. Try to aim for more consistent daily practice.`,
        icon: Target,
      });
    } else {
      insights.push({
        type: 'success' as const,
        title: 'Good Practice Volume',
        description: `Great job! ${weekStats.practiceCount} practice sessions this week shows dedication.`,
        icon: Trophy,
      });
    }

    // Speed insights
    if (weekStats.avgTime > 0) {
      const overallAvg = algorithmStats.reduce((sum, stat) => sum + stat.averageTime, 0) / algorithmStats.length;
      if (weekStats.avgTime < overallAvg * 0.9) {
        insights.push({
          type: 'success' as const,
          title: 'Speed Improvement',
          description: 'Your average solve time this week is faster than your overall average!',
          icon: TrendingUp,
        });
      }
    }

    // Memorization insights
    if (weekStats.algorithmsLearned > 0) {
      insights.push({
        type: 'success' as const,
        title: 'Learning Progress',
        description: `You memorized ${weekStats.algorithmsLearned} new algorithm${weekStats.algorithmsLearned > 1 ? 's' : ''} this week!`,
        icon: Trophy,
      });
    }

    return insights;
  };

  const insights = getInsights();

  // Find strongest and weakest categories
  const categoriesWithData = categoryAnalytics.filter(cat => cat.totalAttempts > 0);
  const strongestCategory = categoriesWithData.reduce((best, current) => 
    current.memorizedCount / current.totalAlgorithms > best.memorizedCount / best.totalAlgorithms ? current : best
  , categoriesWithData[0]);
  
  const weakestCategory = categoriesWithData.reduce((worst, current) => 
    current.memorizedCount / current.totalAlgorithms < worst.memorizedCount / worst.totalAlgorithms ? current : worst
  , categoriesWithData[0]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Weekly Training Report
          </CardTitle>
          <div className="flex gap-2">
            {[0, 1, 2, 3].map((week) => (
              <Button
                key={week}
                variant={selectedWeek === week ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedWeek(week)}
              >
                {week === 0 ? 'This Week' : week === 1 ? 'Last Week' : `${week} Weeks Ago`}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Weekly Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{weekStats.practiceCount}</div>
              <div className="text-sm text-blue-800">Practice Sessions</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{weekStats.algorithmsLearned}</div>
              <div className="text-sm text-green-800">Algorithms Learned</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {weekStats.avgTime > 0 ? formatTime(weekStats.avgTime) : 'N/A'}
              </div>
              <div className="text-sm text-purple-800">Average Time</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {formatDuration(weekStats.totalPracticeTime)}
              </div>
              <div className="text-sm text-orange-800">Total Practice Time</div>
            </div>
          </div>

          {/* Best Time */}
          {weekStats.bestTime > 0 && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-5 h-5 text-yellow-600" />
                <span className="font-semibold text-yellow-800">Best Time This Week</span>
              </div>
              <div className="text-3xl font-bold text-yellow-600">{formatTime(weekStats.bestTime)}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Category Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categoriesWithData.length > 0 && (
              <>
                {strongestCategory && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Trophy className="w-4 h-4 text-green-600" />
                      <span className="font-semibold text-green-800">Strongest Category</span>
                    </div>
                    <div className="text-lg font-bold text-green-700">{strongestCategory.category}</div>
                    <div className="text-sm text-green-600">
                      {strongestCategory.memorizedCount}/{strongestCategory.totalAlgorithms} memorized 
                      ({Math.round((strongestCategory.memorizedCount / strongestCategory.totalAlgorithms) * 100)}%)
                    </div>
                  </div>
                )}

                {weakestCategory && strongestCategory !== weakestCategory && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-red-600" />
                      <span className="font-semibold text-red-800">Needs Attention</span>
                    </div>
                    <div className="text-lg font-bold text-red-700">{weakestCategory.category}</div>
                    <div className="text-sm text-red-600">
                      {weakestCategory.memorizedCount}/{weakestCategory.totalAlgorithms} memorized 
                      ({Math.round((weakestCategory.memorizedCount / weakestCategory.totalAlgorithms) * 100)}%)
                    </div>
                  </div>
                )}
              </>
            )}

            {/* All Categories Overview */}
            <div className="space-y-2">
              <h4 className="font-semibold">All Categories</h4>
              {categoryAnalytics.map((category) => (
                <div key={category.category} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{category.category}</span>
                  <div className="text-sm text-gray-600">
                    {category.memorizedCount}/{category.totalAlgorithms} memorized
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Training Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  insight.type === 'success' 
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : insight.type === 'warning'
                    ? 'bg-yellow-50 border-yellow-200 text-yellow-800'
                    : 'bg-blue-50 border-blue-200 text-blue-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <insight.icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <div className="font-semibold">{insight.title}</div>
                    <div className="text-sm">{insight.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};