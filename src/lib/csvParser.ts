import type { Algorithm } from '@/types';

export const parseCSVAlgorithms = async (): Promise<Algorithm[]> => {
  try {
    const response = await fetch('/algorithms.csv');
    const csvText = await response.text();
    
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];
    
    // Get header row (first line) to identify corner positions
    const headers = lines[0].split(',').map(h => h.trim());
    
    const algorithms: Algorithm[] = [];
    
    // Process each data row (skip header)
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      if (!row.trim()) continue;
      
      const cells = parseCSVRow(row);
      if (cells.length < 2) continue;
      
      const rowCorner = cells[0].trim();
      if (!rowCorner || rowCorner === '') continue;
      
      // Process each cell in the row
      for (let j = 1; j < cells.length - 1; j++) { // Skip last column (duplicate header)
        const algorithm = cells[j]?.trim();
        const colCorner = headers[j]?.trim();
        
        if (!algorithm || !colCorner || algorithm === '-' || algorithm === 'i' || algorithm === '') {
          continue;
        }
        
        // Generate notation based on position in matrix
        const notation = generateNotation(i - 1, j - 1);
        
        algorithms.push({
          corners: `${rowCorner}-${colCorner}`,
          notation,
          alg: algorithm
        });
      }
    }
    
    return algorithms;
  } catch (error) {
    console.error('Error parsing CSV:', error);
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

// Generate notation based on matrix position
const generateNotation = (row: number, col: number): string => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const rowLetter = letters[Math.floor(row / 26)] || '';
  const colLetter = letters[row % 26] || 'A';
  const number = String(col + 1).padStart(2, '0');
  
  return `${rowLetter}${colLetter}${number}`;
};
