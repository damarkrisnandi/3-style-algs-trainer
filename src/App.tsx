import { useState, useEffect } from 'react';
import { Timer } from './components/Timer';
import { Flashcards } from './components/Flashcards';
import { Records } from './components/Records';
import { NotationMapper } from './components/NotationMapper';
import { Button } from './components/ui/button';
import type { Algorithm } from './types';
import { parseCSVAlgorithms } from './lib/csvParser';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Clock, BookOpen, BarChart3, Map, RotateCcw } from 'lucide-react';

type Tab = 'timer' | 'flashcards' | 'records' | 'notation';

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('flashcards');
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm | null>(null);
  const [algorithms, setAlgorithms] = useState<Algorithm[]>([]);
  const [loading, setLoading] = useState(true);
  const { resetAllData } = useLocalStorage();

  useEffect(() => {
    loadAlgorithms();
  }, []);

  const loadAlgorithms = async () => {
    try {
      setLoading(true);
      const csvAlgorithms = await parseCSVAlgorithms();
      setAlgorithms(csvAlgorithms);
    } catch (error) {
      console.error('Failed to load algorithms:', error);
      // Fallback to empty array if CSV fails
      setAlgorithms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAlgorithmSelect = (algorithm: Algorithm) => {
    setSelectedAlgorithm(algorithm);
    setActiveTab('timer');
  };

  const handleResetAll = () => {
    if (window.confirm('Are you sure you want to reset all data? This will delete all your timing records, statistics, and notation mappings.')) {
      resetAllData();
      window.location.reload(); // Reload to refresh all components
    }
  };

  const tabs = [
    { id: 'flashcards' as Tab, label: 'Flashcards', icon: BookOpen },
    { id: 'timer' as Tab, label: 'Timer', icon: Clock },
    { id: 'records' as Tab, label: 'Records', icon: BarChart3 },
    { id: 'notation' as Tab, label: 'Notation', icon: Map },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="text-center flex-1">
              <h1 className="text-3xl font-bold">
                🎲 3-Style Corner Trainer
              </h1>
              <p className="text-slate-500 mt-2">
                Master your corner algorithms with flashcards and timing
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetAll}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset All Data
            </Button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="border-b bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-center space-x-1 py-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? 'default' : 'ghost'}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔄</div>
            <p className="text-slate-500">Loading algorithms from CSV...</p>
          </div>
        ) : algorithms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-slate-500">No algorithms found. Please check the CSV file.</p>
          </div>
        ) : (
          <>
            {activeTab === 'flashcards' && (
              <Flashcards 
                algorithms={algorithms} 
                onAlgorithmSelect={handleAlgorithmSelect}
              />
            )}
            
            {activeTab === 'timer' && (
              <Timer 
                algorithm={selectedAlgorithm}
                onTimeRecorded={() => {
                  // Optionally switch to records tab after recording a time
                  // setActiveTab('records');
                }}
              />
            )}
            
            {activeTab === 'records' && (
              <Records algorithms={algorithms} />
            )}
            
            {activeTab === 'notation' && (
              <NotationMapper />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="container mx-auto px-4 py-6 text-center text-sm text-slate-500">
          <p>Practice consistently to improve your 3-style corner execution!</p>
          <p className="mt-1">
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs">Space</kbd> to start timer • 
            <kbd className="px-2 py-1 bg-slate-100 rounded text-xs ml-1">Esc</kbd> to reset
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
