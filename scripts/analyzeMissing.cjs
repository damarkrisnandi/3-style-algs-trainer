const fs = require('fs');
const path = require('path');

// Position to letter mapping for 3-style notation
const positionToLetter = {
  'UBL': 'A', 'URB': 'B', 'ULF': 'D', 'LUB': 'I', 'LFU': 'J',
  'LDF': 'K', 'LBD': 'L', 'FUL': 'E', 'FDR': 'G', 'FLD': 'H',
  'RBU': 'R', 'RDB': 'S', 'RFD': 'T', 'BUR': 'M', 'BLU': 'N',
  'BDL': 'O', 'BRD': 'P', 'DFL': 'Q', 'DRF': 'V', 'DBR': 'W', 'DLB': 'X'
};

const letterToPosition = Object.fromEntries(Object.entries(positionToLetter).map(([pos, letter]) => [letter, pos]));

function parseCSVLine(line) {
  const cells = [];
  let currentCell = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (!inQuotes) {
        inQuotes = true;
      } else if (i + 1 < line.length && line[i + 1] === '"') {
        currentCell += '"';
        i++;
      } else {
        inQuotes = false;
      }
    } else if (char === ',' && !inQuotes) {
      cells.push(currentCell.trim());
      currentCell = '';
    } else {
      currentCell += char;
    }
    i++;
  }

  cells.push(currentCell.trim());
  return cells;
}

function analyzeMissing() {
  console.log('Analyzing missing algorithms...');

  // Read the current algorithms
  const csvPath = path.join(__dirname, '..', 'public', 'algorithms.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  const currentNotations = new Set();
  for (let i = 1; i < lines.length; i++) {
    const parts = parseCSVLine(lines[i]);
    if (parts.length >= 2) {
      currentNotations.add(parts[1]);
    }
  }

  // Generate all expected notations
  const expectedLetters = Object.values(positionToLetter);
  const expectedNotations = new Set();
  for (const first of expectedLetters) {
    for (const second of expectedLetters) {
      if (first !== second) {
        expectedNotations.add(first + second);
      }
    }
  }

  const missingNotations = [...expectedNotations].filter(n => !currentNotations.has(n));
  console.log(`Missing ${missingNotations.length} notations:`, missingNotations.sort());

  // Read the matrix and check what's in those positions
  const matrixPath = path.join(__dirname, '..', 'references', "Jack Cai's 3-Style Commutators (updated 2020) - UFR Corners.csv");
  const matrixContent = fs.readFileSync(matrixPath, 'utf8');
  const matrixLines = matrixContent.split('\n').filter(line => line.trim());

  const headerCells = parseCSVLine(matrixLines[0]);
  const positions = headerCells.slice(1, 22).filter(pos => pos && positionToLetter[pos]);

  console.log('\nAnalyzing missing algorithms in matrix:');

  // Check each missing notation in the matrix
  missingNotations.slice(0, 20).forEach(notation => {
    const rowLetter = notation[0];
    const colLetter = notation[1];
    const rowPosition = letterToPosition[rowLetter];
    const colPosition = letterToPosition[colLetter];

    // Find row index for this position
    let rowIndex = -1;
    for (let i = 1; i < matrixLines.length; i++) {
      const cells = parseCSVLine(matrixLines[i]);
      if (cells[0] === rowPosition) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex === -1) {
      console.log(`${notation} (${rowPosition}-${colPosition}): Row not found`);
      return;
    }

    // Find column index for this position
    const colIndex = positions.indexOf(colPosition);
    if (colIndex === -1) {
      console.log(`${notation} (${rowPosition}-${colPosition}): Column not found`);
      return;
    }

    // Get the cell value
    const rowCells = parseCSVLine(matrixLines[rowIndex]);
    const cellValue = rowCells[colIndex + 1]; // +1 because first cell is position name

    console.log(`${notation} (${rowPosition}-${colPosition}): "${cellValue || 'EMPTY'}"`);
  });

  // Check for any diagonal entries (self-swaps) that might be missing
  console.log('\nChecking diagonal (self-swap) entries:');
  expectedLetters.forEach(letter => {
    const position = letterToPosition[letter];
    let rowIndex = -1;
    for (let i = 1; i < matrixLines.length; i++) {
      const cells = parseCSVLine(matrixLines[i]);
      if (cells[0] === position) {
        rowIndex = i;
        break;
      }
    }

    if (rowIndex !== -1) {
      const colIndex = positions.indexOf(position);
      if (colIndex !== -1) {
        const rowCells = parseCSVLine(matrixLines[rowIndex]);
        const cellValue = rowCells[colIndex + 1];
        console.log(`${letter}${letter} (${position}-${position}): "${cellValue || 'EMPTY'}"`);
      }
    }
  });

  return missingNotations;
}

// Run analysis
if (require.main === module) {
  try {
    analyzeMissing();
  } catch (error) {
    console.error('Error analyzing missing algorithms:', error);
  }
}

module.exports = { analyzeMissing };

