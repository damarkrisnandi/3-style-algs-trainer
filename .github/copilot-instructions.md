<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a 3-style algorithms trainer for Rubik's cube corners built with React, TypeScript, Vite, Tailwind CSS, and Shadcn UI.

## Project Structure
- `/src/components/` - UI components including Timer, Flashcards, Records, NotationMapper
- `/src/components/ui/` - Reusable Shadcn UI components
- `/src/hooks/` - Custom React hooks for localStorage management
- `/src/types/` - TypeScript type definitions
- `/src/data/` - Static JSON data for algorithms

## Key Features
1. **Timer**: Keyboard-controlled timer using spacebar for start/stop
2. **Flashcards**: Study algorithms with question/answer format
3. **Records**: Track timing statistics and progress
4. **Notation Mapper**: Store personal notation mappings in localStorage

## Technical Guidelines
- Use Tailwind CSS for styling with the configured design system
- Follow the established component patterns with proper TypeScript typing
- Maintain keyboard accessibility especially for timer functionality
- Use localStorage for persisting user data (records, mappings, stats)
- Components should be responsive and mobile-friendly

## Data Structure
Algorithms follow this format:
```json
{
  "corners": "FUL-ULB",
  "notation": "EA", 
  "alg": "F U F' F' U'"
}
```

Time records and statistics are automatically calculated and stored locally.
