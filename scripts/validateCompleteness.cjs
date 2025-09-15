const fs = require('fs');
const path = require('path');

function validateCompleteness() {
  console.log('Validating algorithm completeness...');

  // Read the algorithms.csv file
  const csvPath = path.join(__dirname, '..', 'public', 'algorithms.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf8');
  const lines = csvContent.split('\n').filter(line => line.trim());

  console.log(`Total lines in algorithms.csv: ${lines.length}`);
  console.log(`Algorithm entries (excluding header): ${lines.length - 1}`);

  // Extract notations
  const notations = [];
  const algorithms = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted strings)
    const parts = [];
    let current = '';
    let inQuotes = false;

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        parts.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current);

    if (parts.length >= 3) {
      const corners = parts[0];
      const notation = parts[1];
      const alg = parts[2];

      notations.push(notation);
      algorithms.push({ corners, notation, alg });
    }
  }

  // Check for duplicates
  const notationSet = new Set(notations);
  console.log(`Unique notations: ${notationSet.size}`);

  if (notations.length !== notationSet.size) {
    console.log('WARNING: Duplicate notations found!');
    const duplicates = notations.filter((item, index) => notations.indexOf(item) !== index);
    console.log('Duplicates:', [...new Set(duplicates)]);
  }

  // Expected notation analysis
  const expectedLetters = ['A', 'B', 'D', 'I', 'J', 'K', 'L', 'E', 'G', 'H', 'R', 'S', 'T', 'M', 'N', 'O', 'P', 'Q', 'V', 'W', 'X'];
  const expectedCount = expectedLetters.length * (expectedLetters.length - 1); // 21 * 20 = 420

  console.log(`Expected total algorithms: ${expectedCount}`);
  console.log(`Actual algorithms parsed: ${notations.length}`);

  // Generate all expected notations
  const allExpectedNotations = new Set();
  for (const first of expectedLetters) {
    for (const second of expectedLetters) {
      if (first !== second) { // Skip self-swaps
        allExpectedNotations.add(first + second);
      }
    }
  }

  const parsedNotations = new Set(notations);
  const missingNotations = [...allExpectedNotations].filter(n => !parsedNotations.has(n));

  if (missingNotations.length > 0) {
    console.log(`Missing notations (${missingNotations.length}):`, missingNotations.slice(0, 20));
    if (missingNotations.length > 20) {
      console.log(`... and ${missingNotations.length - 20} more`);
    }
  } else {
    console.log('✓ All expected notations are present!');
  }

  // Check algorithm quality
  const withBrackets = algorithms.filter(alg => alg.alg.includes('[') && alg.alg.includes(']'));
  const withoutBrackets = algorithms.filter(alg => !alg.alg.includes('[') || !alg.alg.includes(']'));

  console.log(`Algorithms with brackets (commutators): ${withBrackets.length}`);
  console.log(`Algorithms without brackets (special cases): ${withoutBrackets.length}`);

  // Show some examples of special cases
  if (withoutBrackets.length > 0) {
    console.log('\nSpecial case examples:');
    withoutBrackets.slice(0, 5).forEach(alg => {
      console.log(`  ${alg.notation}: ${alg.alg}`);
    });
  }

  // Check for any obvious parsing errors
  const emptyAlgorithms = algorithms.filter(alg => !alg.alg || alg.alg.trim() === '');
  if (emptyAlgorithms.length > 0) {
    console.log(`WARNING: Found ${emptyAlgorithms.length} empty algorithms`);
  }

  const suspiciousAlgorithms = algorithms.filter(alg =>
    alg.alg.includes('i') && alg.alg.length < 5
  );
  if (suspiciousAlgorithms.length > 0) {
    console.log(`WARNING: Found ${suspiciousAlgorithms.length} potentially unparsed inverse markers`);
    suspiciousAlgorithms.slice(0, 3).forEach(alg => {
      console.log(`  ${alg.notation}: ${alg.alg}`);
    });
  }

  return {
    totalParsed: notations.length,
    expectedTotal: expectedCount,
    missingCount: missingNotations.length,
    duplicateCount: notations.length - notationSet.size,
    isComplete: missingNotations.length === 0 && notations.length - notationSet.size === 0
  };
}

// Run validation
if (require.main === module) {
  try {
    const result = validateCompleteness();
    console.log('\nValidation Summary:');
    console.log(`Complete: ${result.isComplete ? 'YES' : 'NO'}`);
    console.log(`Coverage: ${result.totalParsed}/${result.expectedTotal} (${((result.totalParsed/result.expectedTotal)*100).toFixed(1)}%)`);
  } catch (error) {
    console.error('Error during validation:', error);
  }
}

module.exports = { validateCompleteness };

