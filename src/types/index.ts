export interface Algorithm {
  corners: string;
  notation: string;
  alg: string;
  setupCategory?: string;
  setupMoves?: string;
  core?: string;
}

export interface TimeRecord {
  id: string;
  algorithmId: string;
  time: number;
  timestamp: number;
}

export interface NotationMapping {
  corner: string;
  notation: string;
}

export interface AlgorithmStats {
  algorithmId: string;
  averageTime: number;
  bestTime: number;
  attempts: number;
  isMemorized: boolean;
  isSkipped?: boolean;
  lastPracticed?: number;
  memorizationDate?: number;
}

export interface SetupCategory {
  name: string;
  count: number;
  algorithms: Algorithm[];
}

export interface WeeklyStats {
  weekStart: string; // ISO date string
  weekEnd: string;
  totalPracticeTime: number;
  algorithmsLearned: number;
  avgTime: number;
  bestTime: number;
  practiceCount: number;
  categoriesWorkedOn: string[];
  strengthCategories: string[];
  weaknessCategories: string[];
}

export interface CategoryAnalytics {
  category: string;
  totalAlgorithms: number;
  memorizedCount: number;
  averageTime: number;
  bestTime: number;
  totalAttempts: number;
  lastWeekProgress: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
}
