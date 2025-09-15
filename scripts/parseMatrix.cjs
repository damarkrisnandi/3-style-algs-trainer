const fs = require('fs');
const path = require('path');

// Position to letter mapping for 3-style notation
const positionToLetter = {
  'UBL': 'A', 'URB': 'B', 'ULF': 'D', 'LUB': 'I', 'LFU': 'J',
  'LDF': 'K', 'LBD': 'L', 'FUL': 'E', 'FDR': 'G', 'FLD': 'H',
  'RBU': 'R', 'RDB': 'S', 'RFD': 'T', 'BUR': 'M', 'BLU': 'N',
  'BDL': 'O', 'BRD': 'P', 'DFL': 'Q', 'DRF': 'V', 'DBR': 'W', 'DLB': 'X'
};

// Reverse commutator structure for inverse algorithms
function generateInverse(algorithm) {
  if (!algorithm || algorithm === '-' || algorithm === 'i') {
    return null;
  }

  // Handle algorithms with square brackets (commutators)
  if (algorithm.includes('[') && algorithm.includes(']')) {
    // Parse commutator structure [A, B] or [A : [B, C]]
    // For [A, B] inverse is [B, A]
    // For [A : [B, C]] inverse is [A : [C, B]]

    // Simple commutator [A, B]
    const simpleCommutatorMatch = algorithm.match(/^\[([^:\[\]]+),\s*([^:\[\]]+)\]$/);
    if (simpleCommutatorMatch) {
      const [, a, b] = simpleCommutatorMatch;
      return `[${b.trim()}, ${a.trim()}]`;
    }

    // Setup commutator [A : [B, C]]
    const setupCommutatorMatch = algorithm.match(/^\[([^:\[\]]+)\s*:\s*\[([^,\[\]]+),\s*([^,\[\]]+)\]\]$/);
    if (setupCommutatorMatch) {
      const [, setup, b, c] = setupCommutatorMatch;
      return `[${setup.trim()} : [${c.trim()}, ${b.trim()}]]`;
    }

    // If we can't parse the structure, return the original
    return algorithm;
  }

  // For algorithms without brackets, return as-is (special cases)
  return algorithm;
}

function parseMatrix() {
  console.log('Starting enhanced matrix parsing...');

  // Read the matrix file
  const matrixPath = path.join(__dirname, '..', 'references', "Jack Cai's 3-Style Commutators (updated 2020) - UFR Corners.csv");
  const matrixContent = fs.readFileSync(matrixPath, 'utf8');

  const lines = matrixContent.split('\n').filter(line => line.trim());

  // Parse the header to get positions
  const headerCells = parseCSVLine(lines[0]);
  const positions = headerCells.slice(1, 22).filter(pos => pos && positionToLetter[pos]); // Only take the 21 valid positions

  console.log('Found positions:', positions);
  console.log('Position count:', positions.length);

  const algorithms = [];
  const algorithmMap = new Map(); // Store all algorithms for inverse lookup

  // Process each data row (rows 1-21, corresponding to the 21 positions)
  for (let rowIndex = 1; rowIndex <= 21 && rowIndex < lines.length; rowIndex++) {
    const line = lines[rowIndex].trim();
    if (!line) continue;

    const cells = parseCSVLine(line);
    const rowPosition = cells[0];

    if (!rowPosition || !positionToLetter[rowPosition]) {
      console.log(`Skipping invalid row position: ${rowPosition} at row ${rowIndex}`);
      continue;
    }

    const rowLetter = positionToLetter[rowPosition];
    console.log(`Processing row ${rowIndex}: ${rowPosition} (${rowLetter})`);

    // Process each column (1-21, corresponding to the 21 positions)
    for (let colIndex = 0; colIndex < positions.length && colIndex < 21; colIndex++) {
      const colPosition = positions[colIndex];
      const cellValue = cells[colIndex + 1]; // +1 because cells[0] is row position

      if (!colPosition || !positionToLetter[colPosition]) continue;
      if (!cellValue || cellValue === '-' || cellValue === rowPosition || cellValue === colPosition) continue;

      const colLetter = positionToLetter[colPosition];
      const notation = rowLetter + colLetter;
      const corners = `${rowPosition}-${colPosition}`;

      if (cellValue === 'i') {
        // Store inverse reference
        algorithmMap.set(notation, { corners, needsInverse: true, sourceNotation: colLetter + rowLetter });
      } else {
        // Direct algorithm - clean up the algorithm string
        const cleanAlg = cellValue.replace(/^"|"$/g, '').trim();
        algorithms.push({
          corners,
          notation,
          alg: cleanAlg
        });

        // Store for potential inverse reference
        algorithmMap.set(notation, { corners, alg: cleanAlg, needsInverse: false });
      }
    }
  }

  console.log(`Found ${algorithms.length} direct algorithms`);

  // Generate inverse algorithms
  let inversesGenerated = 0;
  let inversesFailed = 0;

  for (const [notation, data] of algorithmMap) {
    if (data.needsInverse) {
      const sourceData = algorithmMap.get(data.sourceNotation);
      if (sourceData && !sourceData.needsInverse && sourceData.alg) {
        const inverseAlg = generateInverse(sourceData.alg);
        if (inverseAlg) {
          algorithms.push({
            corners: data.corners,
            notation,
            alg: inverseAlg
          });
          inversesGenerated++;
        } else {
          console.log(`Failed to generate inverse for ${notation} from ${data.sourceNotation}`);
          inversesFailed++;
        }
      } else {
        console.log(`Missing source algorithm for inverse ${notation} -> ${data.sourceNotation}`);
        inversesFailed++;
      }
    }
  }

  console.log(`Generated ${inversesGenerated} inverse algorithms`);
  console.log(`Failed to generate ${inversesFailed} inverse algorithms`);
  console.log(`Total algorithms: ${algorithms.length}`);

  // Sort algorithms by notation
  algorithms.sort((a, b) => a.notation.localeCompare(b.notation));

  // Write to CSV
  const csvContent = 'corners,notation,alg\n' +
    algorithms.map(alg => `${alg.corners},${alg.notation},"${alg.alg}"`).join('\n');

  const outputPath = path.join(__dirname, '..', 'public', 'algorithms.csv');
  fs.writeFileSync(outputPath, csvContent);

  console.log(`Written ${algorithms.length} algorithms to ${outputPath}`);

  // Also create JSON version
  const jsonPath = path.join(__dirname, '..', 'src', 'data', 'algorithms.json');
  fs.writeFileSync(jsonPath, JSON.stringify(algorithms, null, 2));

  console.log(`Written JSON version to ${jsonPath}`);

  return algorithms;
}

// Enhanced CSV parser that properly handles quoted strings with commas and brackets
function parseCSVLine(line) {
  const cells = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (!inQuotes) {
        // Starting quote
        inQuotes = true;
      } else if (i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        currentCell += '"';
        i++; // Skip next quote
      } else {
        // Ending quote
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      // Cell separator
      cells.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
    i++;
  }

  // Add the last cell
  cells.push(currentCell.trim());
  return cells;
}

// Run the parser
if (require.main === module) {
  try {
    parseMatrix();
  } catch (error) {
    console.error('Error parsing matrix:', error);
  }
}

module.exports = { parseMatrix, generateInverse };

