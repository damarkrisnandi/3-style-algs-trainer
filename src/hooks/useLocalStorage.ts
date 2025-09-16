import { useState, useEffect } from 'react';
import type { TimeRecord, NotationMapping, AlgorithmStats, WeeklyStats, CategoryAnalytics, Algorithm } from '@/types';

export const useLocalStorage = () => {
  const [timeRecords, setTimeRecords] = useState<TimeRecord[]>([]);
  const [notationMappings, setNotationMappings] = useState<NotationMapping[]>([]);
  const [algorithmStats, setAlgorithmStats] = useState<AlgorithmStats[]>([]);

  useEffect(() => {
    // Load data from localStorage on component mount
    const savedRecords = localStorage.getItem('cubeTrainer_timeRecords');
    const savedMappings = localStorage.getItem('cubeTrainer_notationMappings');
    const savedStats = localStorage.getItem('cubeTrainer_algorithmStats');

    if (savedRecords) {
      setTimeRecords(JSON.parse(savedRecords));
    }

    if (savedMappings) {
      setNotationMappings(JSON.parse(savedMappings));
    }

    if (savedStats) {
      setAlgorithmStats(JSON.parse(savedStats));
    }
  }, []);

  const saveTimeRecord = (record: Omit<TimeRecord, 'id'>) => {
    const newRecord: TimeRecord = {
      ...record,
      id: Date.now().toString(),
    };

    const updatedRecords = [...timeRecords, newRecord];
    setTimeRecords(updatedRecords);
    localStorage.setItem('cubeTrainer_timeRecords', JSON.stringify(updatedRecords));

    // Update algorithm stats
    updateAlgorithmStats(record.algorithmId, record.time);
  };

  const updateAlgorithmStats = (algorithmId: string, newTime: number) => {
    const existingStats = algorithmStats.find(stat => stat.algorithmId === algorithmId);
    const algorithmRecords = timeRecords.filter(record => record.algorithmId === algorithmId);
    const allTimes = [...algorithmRecords.map(r => r.time), newTime];
    
    const averageTime = allTimes.reduce((sum, time) => sum + time, 0) / allTimes.length;
    const bestTime = Math.min(...allTimes);
    const attempts = allTimes.length;
    
    // Consider algorithm memorized if average time is under 3 seconds and has at least 5 attempts with consistent performance
    const recentTimes = allTimes.slice(-5); // Last 5 attempts
    const isConsistent = recentTimes.length >= 3 && 
      Math.max(...recentTimes) - Math.min(...recentTimes) < 1000; // Less than 1 second variance
    const isMemorized = averageTime < 3000 && attempts >= 5 && isConsistent;

    // Check if this is newly memorized
    const wasMemorized = existingStats?.isMemorized || false;
    const memorizationDate = !wasMemorized && isMemorized ? Date.now() : existingStats?.memorizationDate;

    const updatedStats: AlgorithmStats = {
      algorithmId,
      averageTime,
      bestTime,
      attempts,
      isMemorized,
      isSkipped: existingStats?.isSkipped || false,
      lastPracticed: Date.now(),
      memorizationDate,
    };

    let newAlgorithmStats;
    if (existingStats) {
      newAlgorithmStats = algorithmStats.map(stat => 
        stat.algorithmId === algorithmId ? updatedStats : stat
      );
    } else {
      newAlgorithmStats = [...algorithmStats, updatedStats];
    }

    setAlgorithmStats(newAlgorithmStats);
    localStorage.setItem('cubeTrainer_algorithmStats', JSON.stringify(newAlgorithmStats));
  };

  const toggleSkipAlgorithm = (algorithmId: string) => {
    const existingStats = algorithmStats.find(stat => stat.algorithmId === algorithmId);
    
    const updatedStats: AlgorithmStats = existingStats 
      ? { ...existingStats, isSkipped: !existingStats.isSkipped }
      : {
          algorithmId,
          averageTime: 0,
          bestTime: 0,
          attempts: 0,
          isMemorized: false,
          isSkipped: true,
          lastPracticed: Date.now(),
        };

    let newAlgorithmStats;
    if (existingStats) {
      newAlgorithmStats = algorithmStats.map(stat => 
        stat.algorithmId === algorithmId ? updatedStats : stat
      );
    } else {
      newAlgorithmStats = [...algorithmStats, updatedStats];
    }

    setAlgorithmStats(newAlgorithmStats);
    localStorage.setItem('cubeTrainer_algorithmStats', JSON.stringify(newAlgorithmStats));
  };

  const toggleMemorizeAlgorithm = (algorithmId: string) => {
    const existingStats = algorithmStats.find(stat => stat.algorithmId === algorithmId);
    
    if (!existingStats) return;

    const isMemorized = !existingStats.isMemorized;
    const updatedStats: AlgorithmStats = {
      ...existingStats,
      isMemorized,
      memorizationDate: isMemorized ? Date.now() : undefined,
    };

    const newAlgorithmStats = algorithmStats.map(stat => 
      stat.algorithmId === algorithmId ? updatedStats : stat
    );

    setAlgorithmStats(newAlgorithmStats);
    localStorage.setItem('cubeTrainer_algorithmStats', JSON.stringify(newAlgorithmStats));
  };

  const saveNotationMapping = (mapping: NotationMapping) => {
    const existingIndex = notationMappings.findIndex(m => m.corner === mapping.corner);
    let updatedMappings;

    if (existingIndex >= 0) {
      updatedMappings = [...notationMappings];
      updatedMappings[existingIndex] = mapping;
    } else {
      updatedMappings = [...notationMappings, mapping];
    }

    setNotationMappings(updatedMappings);
    localStorage.setItem('cubeTrainer_notationMappings', JSON.stringify(updatedMappings));
  };

  const getAlgorithmStats = (algorithmId: string): AlgorithmStats | undefined => {
    return algorithmStats.find(stat => stat.algorithmId === algorithmId);
  };

  const getRecordsForAlgorithm = (algorithmId: string): TimeRecord[] => {
    return timeRecords.filter(record => record.algorithmId === algorithmId);
  };

  const getWeeklyStats = (weekStart: Date): WeeklyStats => {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);
    
    const weekRecords = timeRecords.filter(record => {
      const recordDate = new Date(record.timestamp);
      return recordDate >= weekStart && recordDate < weekEnd;
    });

    const totalPracticeTime = weekRecords.reduce((sum, record) => sum + record.time, 0);
    const practiceCount = weekRecords.length;
    const avgTime = practiceCount > 0 ? totalPracticeTime / practiceCount : 0;
    const bestTime = practiceCount > 0 ? Math.min(...weekRecords.map(r => r.time)) : 0;
    
    // Count algorithms that became memorized this week
    const algorithmsLearned = algorithmStats.filter(stat => 
      stat.memorizationDate && 
      new Date(stat.memorizationDate) >= weekStart && 
      new Date(stat.memorizationDate) < weekEnd
    ).length;

    // Get categories worked on this week
    const categoriesWorkedOn = [...new Set(weekRecords.map(() => {
      // Extract category from algorithm ID or return 'unknown'
      // This would be better with actual algorithm data
      return 'mixed'; // Placeholder
    }))];

    return {
      weekStart: weekStart.toISOString(),
      weekEnd: weekEnd.toISOString(),
      totalPracticeTime,
      algorithmsLearned,
      avgTime,
      bestTime,
      practiceCount,
      categoriesWorkedOn,
      strengthCategories: [],
      weaknessCategories: [],
    };
  };

  const getCategoryAnalytics = (algorithms: Algorithm[]): CategoryAnalytics[] => {
    const categoryMap = new Map<string, Algorithm[]>();
    
    // Group algorithms by category
    algorithms.forEach(alg => {
      const category = alg.setupCategory || 'unknown';
      if (!categoryMap.has(category)) {
        categoryMap.set(category, []);
      }
      categoryMap.get(category)!.push(alg);
    });

    return Array.from(categoryMap.entries()).map(([category, categoryAlgs]) => {
      const categoryStats = categoryAlgs.map(alg => 
        getAlgorithmStats(`${alg.corners}-${alg.notation}`)
      ).filter(Boolean) as AlgorithmStats[];

      const memorizedCount = categoryStats.filter(stat => stat.isMemorized).length;
      const totalAttempts = categoryStats.reduce((sum, stat) => sum + stat.attempts, 0);
      const avgTime = categoryStats.length > 0 
        ? categoryStats.reduce((sum, stat) => sum + stat.averageTime, 0) / categoryStats.length 
        : 0;
      const bestTime = categoryStats.length > 0 
        ? Math.min(...categoryStats.map(stat => stat.bestTime).filter(time => time > 0))
        : 0;

      return {
        category,
        totalAlgorithms: categoryAlgs.length,
        memorizedCount,
        averageTime: avgTime,
        bestTime: bestTime === Infinity ? 0 : bestTime,
        totalAttempts,
        lastWeekProgress: 0, // Could be calculated with more complex logic
        improvementTrend: 'stable' as const,
      };
    });
  };

  const resetAllData = () => {
    setTimeRecords([]);
    setNotationMappings([]);
    setAlgorithmStats([]);
    
    localStorage.removeItem('cubeTrainer_timeRecords');
    localStorage.removeItem('cubeTrainer_notationMappings');
    localStorage.removeItem('cubeTrainer_algorithmStats');
  };

  const resetAlgorithmData = (algorithmId: string) => {
    // Remove records for specific algorithm
    const filteredRecords = timeRecords.filter(record => record.algorithmId !== algorithmId);
    setTimeRecords(filteredRecords);
    localStorage.setItem('cubeTrainer_timeRecords', JSON.stringify(filteredRecords));

    // Remove stats for specific algorithm
    const filteredStats = algorithmStats.filter(stat => stat.algorithmId !== algorithmId);
    setAlgorithmStats(filteredStats);
    localStorage.setItem('cubeTrainer_algorithmStats', JSON.stringify(filteredStats));
  };

  return {
    timeRecords,
    notationMappings,
    algorithmStats,
    saveTimeRecord,
    saveNotationMapping,
    getAlgorithmStats,
    getRecordsForAlgorithm,
    toggleSkipAlgorithm,
    toggleMemorizeAlgorithm,
    getWeeklyStats,
    getCategoryAnalytics,
    resetAllData,
    resetAlgorithmData,
  };
};
