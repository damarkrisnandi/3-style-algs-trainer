export interface Algorithm {
  corners: string;
  notation: string;
  alg: string;
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
}
