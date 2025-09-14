# 🎲 3-Style Corner Algorithms Trainer

A comprehensive training application for mastering 3-style corner algorithms in speedcubing. Built with React, TypeScript, Vite, Tailwind CSS, and Shadcn UI with full mobile optimization.

## ✨ Features

### 🃏 Flashcards
- Interactive flashcard system for studying corner algorithms
- Show/hide memorized algorithms filter
- Touch/swipe navigation on mobile devices
- Progress tracking and statistics display
- Direct integration with timer for practice

### ⏱️ Timer
- Keyboard-controlled timer (Space to start/stop, Esc to reset)
- Mobile-friendly touch controls with large buttons
- Automatic time recording and statistics
- Real-time display with millisecond precision
- Algorithm-specific timing data

### 📊 Batch Training
- Random algorithm selection by setup move categories
- Configurable batch sizes (5, 10, 15, 20 algorithms)
- Session statistics and progress tracking
- Mobile-optimized interface with fixed bottom controls
- Automatic session completion summary

### 📈 Records & Statistics
- Track timing statistics for each algorithm
- View overall progress and memorization status
- Detailed algorithm-specific records
- Individual algorithm reset functionality

### 🗺️ Notation Mapper
- Store personal notation mappings in localStorage
- Map corner positions to your preferred notation system
- Helpful reference guide for corner positions

### 🔄 Reset Functionality
- Reset all data (times, stats, mappings)
- Reset individual algorithm data
- Confirmation dialogs for safety

## Data Source

The application uses Jack Cai's 3-Style Commutators CSV file as the algorithm database, providing a comprehensive set of corner algorithms for training.

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies
```bash
npm install
```

2. Start the development server
```bash
npm run dev
```

3. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Usage

### Timer Controls
- **Space**: Get ready → Start timer → Stop timer
- **Escape**: Reset timer
- All other keyboard inputs are disabled during timer use for accuracy

### Navigation
- Use the tab buttons to switch between different modes
- Click "Practice" on any flashcard to start timing that algorithm
- View detailed statistics in the Records tab

### Data Management
- All data is stored locally in your browser
- Use "Reset All Data" to clear everything
- Use individual "Reset" buttons to clear specific algorithm data
- Notation mappings persist across sessions

## Technology Stack

- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Tailwind CSS v4** - Styling
- **Lucide React** - Icons
- **CSV Parser** - Algorithm data loading

## Algorithm Memorization Detection
Algorithms are automatically marked as "memorized" when:
- Average time is under 3 seconds
- At least 5 successful attempts recorded

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # Reusable UI components
│   ├── Timer.tsx       # Timer component
│   ├── Flashcards.tsx  # Flashcard system
│   ├── Records.tsx     # Statistics and records
│   └── NotationMapper.tsx # Notation mapping
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
└── data/               # Static data files
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## Acknowledgments

- Jack Cai for the comprehensive 3-style commutators database
- The speedcubing community for algorithm development
- Shadcn for the beautiful UI component system
