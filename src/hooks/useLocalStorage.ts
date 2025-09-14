import { useState, useEffect } from 'react';
import type { TimeRecord, NotationMapping, AlgorithmStats } from '@/types';

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
    
    // Consider algorithm memorized if average time is under 3 seconds and has at least 5 attempts
    const isMemorized = averageTime < 3000 && attempts >= 5;

    const updatedStats: AlgorithmStats = {
      algorithmId,
      averageTime,
      bestTime,
      attempts,
      isMemorized,
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
    resetAllData,
    resetAlgorithmData,
  };
};
