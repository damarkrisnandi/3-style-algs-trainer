import type { Algorithm } from '@/types';

export const parseCSVAlgorithms = async (): Promise<Algorithm[]> => {
  try {
    const response = await fetch('/algorithms.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    const algorithms: Algorithm[] = [];
    
    // Process each data row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue;
      
      const cells = parseCSVRow(row);
      if (cells.length < 3) continue;
      
      const corners = cells[0]?.trim();
      const notation = cells[1]?.trim();
      const algorithm = cells[2]?.trim();
      
      if (!corners || !notation || !algorithm) continue;
      
      // Clean up algorithm string - remove quotes and extra spaces
      const cleanAlgorithm = algorithm.replace(/^"|"$/g, '').trim();
      
      // Skip if empty or just a placeholder
      if (!cleanAlgorithm || cleanAlgorithm === '-' || cleanAlgorithm === 'i') {
        continue;
      }
      
      algorithms.push({
        corners,
        notation,
        alg: cleanAlgorithm
      });
    }
    
    return algorithms;
  } catch (error) {
    console.error('Error parsing CSV algorithms:', error);
    return [];
  }
};

// Simple CSV parser that handles quoted fields
const parseCSVRow = (row: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
};
