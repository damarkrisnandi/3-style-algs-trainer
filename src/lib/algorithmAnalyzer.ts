import type { Algorithm } from '@/types';

/**
 * Analyze 3-style algorithm and categorize by setup moves
 * Format: [setup: [insertion, interchange]] or [setup: [interchange, insertion]]
 */
export const analyze3StyleAlgorithm = (algorithm: string): {
  setupCategory: string;
  setupMoves: string;
  core: string;
  setupCount: number;
} => {
  // Clean the algorithm string
  const cleanAlg = algorithm.trim();
  
  // Check if it's in 3-style commutator format [setup: [core]]
  const commutatorMatch = cleanAlg.match(/^\[([^\]]*?):\s*\[([^\]]*?)\]\]$/);
  
  if (commutatorMatch) {
    const setupPart = commutatorMatch[1].trim();
    const corePart = commutatorMatch[2].trim();
    
    // Count setup moves
    const setupCount = countMoves(setupPart);
    
    return {
      setupCategory: `setup-${setupCount}`,
      setupMoves: setupPart,
      core: corePart,
      setupCount
    };
  }
  
  // Check for other commutator formats like [A, B] or [A: B]
  const simpleCommutatorMatch = cleanAlg.match(/^\[([^,\]]+)[,:]\s*([^\]]+)\]$/);
  
  if (simpleCommutatorMatch) {
    const firstPart = simpleCommutatorMatch[1].trim();
    const secondPart = simpleCommutatorMatch[2].trim();
    
    // For simple commutators, consider the first part as setup
    const setupCount = countMoves(firstPart);
    
    return {
      setupCategory: `setup-${setupCount}`,
      setupMoves: firstPart,
      core: secondPart,
      setupCount
    };
  }
  
  // If not in standard commutator format, treat as direct algorithm (setup-0)
  return {
    setupCategory: 'setup-0',
    setupMoves: '',
    core: cleanAlg,
    setupCount: 0
  };
};

/**
 * Count the number of moves in a cube notation string
 */
const countMoves = (moves: string): number => {
  if (!moves || moves.trim() === '') return 0;
  
  // Split by spaces and filter out empty strings
  const movesList = moves.trim().split(/\s+/).filter(move => move.length > 0);
  
  // Count actual moves (exclude punctuation and empty elements)
  return movesList.filter(move => {
    // Remove modifiers like ', 2, etc. and check if it's a valid move
    const cleanMove = move.replace(/['2]/g, '');
    return cleanMove.length > 0 && /^[RLUDFBMES]/.test(cleanMove);
  }).length;
};

/**
 * Categorize algorithms by setup moves
 */
export const categorizeAlgorithmsBySetup = (algorithms: Algorithm[]) => {
  const categories = new Map<string, Algorithm[]>();
  
  algorithms.forEach(alg => {
    const analysis = analyze3StyleAlgorithm(alg.alg);
    
    // Add analysis data to algorithm
    const enhancedAlg: Algorithm = {
      ...alg,
      setupCategory: analysis.setupCategory,
      setupMoves: analysis.setupMoves,
      core: analysis.core
    };
    
    // Group by category
    if (!categories.has(analysis.setupCategory)) {
      categories.set(analysis.setupCategory, []);
    }
    categories.get(analysis.setupCategory)!.push(enhancedAlg);
  });
  
  // Convert to sorted array
  const sortedCategories = Array.from(categories.entries())
    .map(([name, algs]) => ({
      name,
      count: algs.length,
      algorithms: algs
    }))
    .sort((a, b) => {
      // Sort by setup number (setup-0, setup-1, setup-2, etc.)
      const aNum = parseInt(a.name.replace('setup-', '')) || 0;
      const bNum = parseInt(b.name.replace('setup-', '')) || 0;
      return aNum - bNum;
    });
  
  return sortedCategories;
};

/**
 * Get setup move statistics
 */
export const getSetupStatistics = (algorithms: Algorithm[]) => {
  const stats = new Map<string, number>();
  
  algorithms.forEach(alg => {
    const analysis = analyze3StyleAlgorithm(alg.alg);
    const category = analysis.setupCategory;
    stats.set(category, (stats.get(category) || 0) + 1);
  });
  
  return Array.from(stats.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => {
      const aNum = parseInt(a.category.replace('setup-', '')) || 0;
      const bNum = parseInt(b.category.replace('setup-', '')) || 0;
      return aNum - bNum;
    });
};
