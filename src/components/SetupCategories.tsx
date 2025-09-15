import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Algorithm, SetupCategory } from '@/types';
import { categorizeAlgorithmsBySetup, getSetupStatistics } from '@/lib/algorithmAnalyzer';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { BarChart3, Filter, ChevronDown, ChevronRight } from 'lucide-react';

interface SetupCategoriesProps {
  algorithms: Algorithm[];
  onAlgorithmSelect?: (algorithm: Algorithm) => void;
}

export const SetupCategories = ({ algorithms, onAlgorithmSelect }: SetupCategoriesProps) => {
  const [categories, setCategories] = useState<SetupCategory[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['setup-0']));
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { getAlgorithmStats } = useLocalStorage();

  useEffect(() => {
    if (algorithms.length > 0) {
      const categorizedAlgorithms = categorizeAlgorithmsBySetup(algorithms);
      setCategories(categorizedAlgorithms);
    }
  }, [algorithms]);

  const toggleCategory = (categoryName: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryName)) {
      newExpanded.delete(categoryName);
    } else {
      newExpanded.add(categoryName);
    }
    setExpandedCategories(newExpanded);
  };

  const getCategoryColor = (categoryName: string) => {
    if (categoryName === 'special-case') {
      return 'bg-rose-50 border-rose-200 text-rose-800'; // Special color for special cases
    }
    
    const setupNum = parseInt(categoryName.replace('setup-', '')) || 0;
    const colors = [
      'bg-green-50 border-green-200 text-green-800', // setup-0
      'bg-blue-50 border-blue-200 text-blue-800',    // setup-1
      'bg-yellow-50 border-yellow-200 text-yellow-800', // setup-2
      'bg-purple-50 border-purple-200 text-purple-800', // setup-3
      'bg-red-50 border-red-200 text-red-800',       // setup-4+
    ];
    return colors[Math.min(setupNum, colors.length - 1)];
  };

  const statistics = getSetupStatistics(algorithms);

  return (
    <div className="space-y-6">
      {/* Statistics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Setup Moves Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-slate-600 mb-4">
            Analisis algoritma berdasarkan jumlah setup moves dalam format 3-style: [setup: [insertion, interchange]]
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {statistics.map(({ category, count }) => {
              const setupNum = parseInt(category.replace('setup-', '')) || 0;
              let displayText = '';
              
              if (category === 'special-case') {
                displayText = 'Special Case';
              } else {
                displayText = setupNum === 0 ? 'No Setup' : `${setupNum} Move${setupNum > 1 ? 's' : ''}`;
              }
              
              return (
                <div
                  key={category}
                  className={`p-3 rounded-lg border text-center ${getCategoryColor(category)}`}
                >
                  <div className="text-2xl font-bold">{count}</div>
                  <div className="text-sm">{displayText}</div>
                  <div className="text-xs opacity-75">{category}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <Card key={category.name}>
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => toggleCategory(category.name)}
              >
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1 rounded-full text-sm ${getCategoryColor(category.name)}`}>
                    {category.name}
                  </div>
                  <span>{category.count} algoritma</span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCategory(selectedCategory === category.name ? null : category.name);
                    }}
                  >
                    <Filter className="w-4 h-4" />
                    {selectedCategory === category.name ? 'Show All' : 'Filter'}
                  </Button>
                  {expandedCategories.has(category.name) ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </CardTitle>
            </CardHeader>
            
            {expandedCategories.has(category.name) && (
              <CardContent>
                <div className="grid gap-3">
                  {category.algorithms.slice(0, selectedCategory === category.name ? undefined : 10).map((algorithm) => {
                    const stats = getAlgorithmStats(`${algorithm.corners}-${algorithm.notation}`);
                    return (
                      <div
                        key={`${algorithm.corners}-${algorithm.notation}`}
                        className="border rounded-lg p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="font-medium">{algorithm.corners}</div>
                            <div className="text-sm text-slate-500">{algorithm.notation}</div>
                          </div>
                          <div className="text-right">
                            {stats ? (
                              <div className="space-y-1">
                                <div className="text-sm font-medium">
                                  {(stats.bestTime / 1000).toFixed(3)}s
                                </div>
                                <div className={`text-xs ${stats.isMemorized ? 'text-green-600' : 'text-yellow-600'}`}>
                                  {stats.isMemorized ? '✓ Hafal' : `${stats.attempts} percobaan`}
                                </div>
                              </div>
                            ) : (
                              <div className="text-sm text-slate-400">Belum ada data</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="font-mono text-sm bg-slate-100 p-2 rounded">
                            {algorithm.alg}
                          </div>
                          
                          {algorithm.setupMoves && (
                            <div className="text-xs text-slate-600">
                              <span className="font-medium">Setup:</span> {algorithm.setupMoves}
                              {algorithm.core && (
                                <>
                                  <span className="mx-2">•</span>
                                  <span className="font-medium">Core:</span> {algorithm.core}
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        
                        {onAlgorithmSelect && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              onClick={() => onAlgorithmSelect(algorithm)}
                            >
                              Latihan
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {selectedCategory !== category.name && category.algorithms.length > 10 && (
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCategory(category.name)}
                    >
                      Lihat semua {category.algorithms.length} algoritma
                    </Button>
                  )}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};
