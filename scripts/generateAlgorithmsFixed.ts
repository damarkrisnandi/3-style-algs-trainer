import fs from 'fs';
import path from 'path';

// Read and parse the reference CSV file
function parseReferenceCSV(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').filter(line => line.trim());
  
  // Parse header (first line) - split by comma but handle quoted fields
  const headerLine = lines[0];
  const header = parseCSVLine(headerLine).slice(1, -1); // Skip first and last empty cells
  
  const algorithms: Array<{
    corners: string;
    notation: string;
    alg: string;
  }> = [];
  
  // Parse data rows (skip header)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const row = parseCSVLine(line);
    const rowCorner = row[0]; // First cell is the row corner
    
    if (!rowCorner || rowCorner.trim() === '') continue;
    
    // Process each column (skip first and last cells)
    for (let j = 1; j < row.length - 1; j++) {
      const cell = row[j];
      const colCorner = header[j - 1]; // Adjust index for header
      
      if (!colCorner || !cell || cell.trim() === '' || cell === '-') continue;
      
      // Generate corner pair as ROW-COLUMN (this is the correct order)
      const cornerPair = `${rowCorner}-${colCorner}`;
      
      // Generate notation based on position
      const rowIndex = i - 1; // Adjust for header
      const colIndex = j - 1; // Adjust for skipped first cell
      const notation = String.fromCharCode(65 + rowIndex) + String.fromCharCode(65 + colIndex);
      
      if (cell.trim() === 'i') {
        // This cell should use the inverse of the base algorithm
        // Find the base algorithm (transpose: look for COL-ROW in existing data)
        const baseCornerPair = `${colCorner}-${rowCorner}`;
        
        // We'll mark this as needing the inverse and handle it after collecting all base algorithms
        algorithms.push({
          corners: cornerPair,
          notation: notation,
          alg: `INVERSE_OF:${baseCornerPair}` // Placeholder
        });
      } else {
        // Direct algorithm from the reference
        const cleanAlg = cell.trim();
        algorithms.push({
          corners: cornerPair,
          notation: notation,
          alg: cleanAlg
        });
      }
    }
  }
  
  return algorithms;
}

// Simple CSV line parser that handles quoted fields
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last field
  result.push(current);
  
  return result;
}

// Function to invert an algorithm
function invertAlgorithm(algorithm: string): string {
  // For commutators, we should swap A and B in [A, B] format
  // For setup commutators [S: [A, B]], it becomes [S: [B, A]]
  
  const trimmed = algorithm.trim();
  
  // Handle setup commutator format [S: [A, B]]
  const setupCommutatorMatch = trimmed.match(/^\[([^:]+):\s*\[([^,]+),\s*([^\]]+)\]\]$/);
  if (setupCommutatorMatch) {
    const setup = setupCommutatorMatch[1].trim();
    const a = setupCommutatorMatch[2].trim();
    const b = setupCommutatorMatch[3].trim();
    return `[${setup}: [${b}, ${a}]]`;
  }
  
  // Handle simple commutator format [A, B]
  const simpleCommutatorMatch = trimmed.match(/^\[([^,]+),\s*([^\]]+)\]$/);
  if (simpleCommutatorMatch) {
    const a = simpleCommutatorMatch[1].trim();
    const b = simpleCommutatorMatch[2].trim();
    return `[${b}, ${a}]`;
  }
  
  // For other formats, return as-is for now
  // In practice, proper algorithm inversion is quite complex
  return trimmed;
}

// Main generation function
function generateAlgorithms() {
  const referencePath = path.join(process.cwd(), 'references', "Jack Cai's 3-Style Commutators (updated 2020) - UFR Corners.csv");
  const outputPath = path.join(process.cwd(), 'public', 'algorithms.csv');
  
  console.log('Reading reference CSV...');
  const algorithms = parseReferenceCSV(referencePath);
  
  console.log('Processing algorithms...');
  
  // Create a map of base algorithms for looking up inverses
  const baseAlgorithms = new Map<string, string>();
  
  // First pass: collect all base algorithms
  for (const alg of algorithms) {
    if (!alg.alg.startsWith('INVERSE_OF:')) {
      baseAlgorithms.set(alg.corners, alg.alg);
    }
  }
  
  // Second pass: resolve inverse algorithms
  for (const alg of algorithms) {
    if (alg.alg.startsWith('INVERSE_OF:')) {
      const baseCornerPair = alg.alg.replace('INVERSE_OF:', '');
      const baseAlg = baseAlgorithms.get(baseCornerPair);
      
      if (baseAlg) {
        alg.alg = invertAlgorithm(baseAlg);
        console.log(`Generated inverse for ${alg.corners} (${alg.notation}) from ${baseCornerPair}: ${alg.alg}`);
      } else {
        console.warn(`Could not find base algorithm for ${baseCornerPair} to generate inverse for ${alg.corners}`);
        alg.alg = 'MISSING_BASE'; // Placeholder
      }
    }
  }
  
  // Filter out any algorithms with missing bases
  const validAlgorithms = algorithms.filter(alg => !alg.alg.includes('MISSING_BASE'));
  
  console.log(`Generated ${validAlgorithms.length} algorithms`);
  
  // Create CSV content
  const csvContent = [
    'corners,notation,alg',
    ...validAlgorithms.map(alg => {
      // Properly escape quotes in the algorithm
      const escapedAlg = alg.alg.replace(/"/g, '""');
      return `${alg.corners},${alg.notation},"${escapedAlg}"`
    })
  ].join('\n');
  
  // Write to file
  fs.writeFileSync(outputPath, csvContent);
  console.log(`Written algorithms to ${outputPath}`);
  
  // Print some examples for verification
  console.log('\nSample algorithms:');
  validAlgorithms.slice(0, 10).forEach(alg => {
    console.log(`${alg.corners} (${alg.notation}): ${alg.alg}`);
  });
  
  // Look for the specific example mentioned
  const ublUlfAlg = validAlgorithms.find(alg => alg.corners === 'ULF-UBL');
  if (ublUlfAlg) {
    console.log(`\nULF-UBL (should be AD): ${ublUlfAlg.notation} - ${ublUlfAlg.alg}`);
  }
}

// Run the generator
generateAlgorithms();