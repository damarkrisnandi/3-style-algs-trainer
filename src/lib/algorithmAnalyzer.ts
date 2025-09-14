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
  
  // Check for simple commutator format [A, B]
  const simpleCommutatorMatch = cleanAlg.match(/^\[([^,\]]+),\s*([^\]]+)\]$/);
  
  if (simpleCommutatorMatch) {
    const firstPart = simpleCommutatorMatch[1].trim();
    const secondPart = simpleCommutatorMatch[2].trim();
    
    // In simple commutator [A, B], there's no explicit setup
    // This is a pure commutator, so setup count is 0
    return {
      setupCategory: 'setup-0',
      setupMoves: '',
      core: `[${firstPart}, ${secondPart}]`,
      setupCount: 0
    };
  }
  
  // Check for nested commutator format [A: B] (where B might be another commutator)
  const nestedCommutatorMatch = cleanAlg.match(/^\[([^:\]]+):\s*([^\]]+)\]$/);
  
  if (nestedCommutatorMatch) {
    const setupPart = nestedCommutatorMatch[1].trim();
    const corePart = nestedCommutatorMatch[2].trim();
    
    // Count setup moves
    const setupCount = countMoves(setupPart);
    
    return {
      setupCategory: `setup-${setupCount}`,
      setupMoves: setupPart,
      core: corePart,
      setupCount
    };
  }
  
  // If not in commutator format, analyze the algorithm sequence
  // Try to identify if there are setup moves at the beginning and end
  const moveSequence = cleanAlg.split(/\s+/).filter(move => move.length > 0);
  
  if (moveSequence.length === 0) {
    return {
      setupCategory: 'setup-0',
      setupMoves: '',
      core: cleanAlg,
      setupCount: 0
    };
  }
  
  // For direct algorithms, check if it follows a pattern like setup + core + setup'
  // This is a simplified heuristic - in practice, this would need more sophisticated analysis
  if (moveSequence.length >= 6) {
    // Try to detect potential setup patterns
    // Look for repeated move patterns or common setup sequences
    const firstQuarter = Math.floor(moveSequence.length / 4);
    const lastQuarter = Math.floor(moveSequence.length / 4);
    
    if (firstQuarter > 0 && lastQuarter > 0) {
      const potentialSetup = moveSequence.slice(0, firstQuarter);
      const potentialUndoSetup = moveSequence.slice(-lastQuarter);
      
      // Check if the end might be the inverse of the beginning (simplified check)
      if (areMovesInverse(potentialSetup, potentialUndoSetup)) {
        return {
          setupCategory: `setup-${potentialSetup.length}`,
          setupMoves: potentialSetup.join(' '),
          core: moveSequence.slice(firstQuarter, -lastQuarter).join(' '),
          setupCount: potentialSetup.length
        };
      }
    }
  }
  
  // If no pattern detected, treat as direct algorithm (setup-0)
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
    return cleanMove.length > 0 && /^[RLUDFBMES]|^[xyz]|^Lw|^Rw|^Uw|^Dw|^Fw|^Bw/.test(cleanMove);
  }).length;
};

/**
 * Check if two move sequences are inverses of each other (simplified)
 */
const areMovesInverse = (moves1: string[], moves2: string[]): boolean => {
  if (moves1.length !== moves2.length) return false;
  
  for (let i = 0; i < moves1.length; i++) {
    const move1 = moves1[i];
    const move2 = moves2[moves2.length - 1 - i]; // Compare with reverse order
    
    // Simplified inverse check - this could be more sophisticated
    if (!isInverseMove(move1, move2)) {
      return false;
    }
  }
  
  return true;
};

/**
 * Check if two individual moves are inverses of each other
 */
const isInverseMove = (move1: string, move2: string): boolean => {
  // Remove spaces and normalize
  const m1 = move1.trim();
  const m2 = move2.trim();
  
  // Get base move (without modifiers)
  const getBaseMove = (move: string) => move.replace(/['2]/g, '');
  const base1 = getBaseMove(m1);
  const base2 = getBaseMove(m2);
  
  // Must be same base move
  if (base1 !== base2) return false;
  
  // Check if one is the inverse of the other
  const isClockwise1 = !m1.includes("'");
  const isClockwise2 = !m2.includes("'");
  const isDouble1 = m1.includes('2');
  const isDouble2 = m2.includes('2');
  
  // Double moves are their own inverse
  if (isDouble1 && isDouble2) return true;
  
  // Clockwise and counterclockwise are inverses
  if (!isDouble1 && !isDouble2) {
    return isClockwise1 !== isClockwise2;
  }
  
  return false;
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
