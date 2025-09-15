import fs from 'fs';
import path from 'path';

// Helper to parse simple CSV rows
function parseRow(line: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      cells.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}

// Invert algorithm string for "i"
function invertAlg(alg: string): string {
  const moves = alg.trim().split(/\s+/);
  const inv = moves.reverse().map(m => {
    if (m.endsWith("2")) return m;
    if (m.endsWith("'")) return m.slice(0, -1);
    return m + "'";
  });
  return inv.join(' ');
}

// Load complete CSV (notation mapping)
const completeCsv = fs.readFileSync(
  path.resolve(__dirname, '../public/algorithms_complete.csv'),
  'utf-8'
);
const completeLines = completeCsv.split(/\r?\n/).filter(r => r.trim());
const completeMap = new Map<string, { notation: string; alg: string }>();
for (let i = 1; i < completeLines.length; i++) {
  const [corners, notation, alg] = parseRow(completeLines[i]);
  completeMap.set(corners.trim(), { notation: notation.trim(), alg: alg.trim().replace(/^"|"$/g, '') });
}

// Load reference CSV
const refCsv = fs.readFileSync(
  path.resolve(__dirname, '../references/Jack Cai\'s 3-Style Commutators (updated 2020) - UFR Corners.csv'),
  'utf-8'
);
const refLines = refCsv.split(/\r?\n/).filter(r => r.trim());
const header = parseRow(refLines[0]).slice(1, -1).map(c => c.trim());

// Build output rows
const rows: string[] = ['corners,notation,alg'];
for (let i = 1; i < refLines.length; i++) {
  const cells = parseRow(refLines[i]);
  const rowCorner = cells[0].trim();
  for (let j = 1; j < cells.length - 1; j++) {
    const cell = cells[j].trim();
    if (cell === '-' || cell === '') continue;
    const colCorner = header[j - 1];
    const pair = `${rowCorner}-${colCorner}`;
    const entry = completeMap.get(pair);
    if (!entry) continue;
    let algStr = cell;
    if (cell === 'i') {
      algStr = invertAlg(entry.alg);
    } else {
      // remove surrounding quotes
      algStr = cell.replace(/^"|"$/g, '');
    }
    rows.push([pair, entry.notation, `"${algStr}"`].join(','));
  }
}

// Write public/algorithms.csv
fs.writeFileSync(
  path.resolve(__dirname, '../public/algorithms.csv'),
  rows.join('\n') + '\n',
  'utf-8'
);
console.log('Generated public/algorithms.csv with', rows.length - 1, 'entries');
