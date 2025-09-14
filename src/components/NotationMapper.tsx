import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { Save, Edit, X } from 'lucide-react';

export const NotationMapper = () => {
  const { notationMappings, saveNotationMapping } = useLocalStorage();
  const [isEditing, setIsEditing] = useState(false);
  const [editingMapping, setEditingMapping] = useState<{ corner: string; notation: string } | null>(null);
  const [newCorner, setNewCorner] = useState('');
  const [newNotation, setNewNotation] = useState('');

  const handleSave = () => {
    if (newCorner.trim() && newNotation.trim()) {
      saveNotationMapping({
        corner: newCorner.trim(),
        notation: newNotation.trim(),
      });
      setNewCorner('');
      setNewNotation('');
      setEditingMapping(null);
      setIsEditing(false);
    }
  };

  const handleEdit = (mapping: { corner: string; notation: string }) => {
    setEditingMapping(mapping);
    setNewCorner(mapping.corner);
    setNewNotation(mapping.notation);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setNewCorner('');
    setNewNotation('');
    setEditingMapping(null);
    setIsEditing(false);
  };

  // Default corner positions for reference
  const defaultCorners = [
    'FUL', 'FUR', 'FDL', 'FDR',
    'BUL', 'BUR', 'BDL', 'BDR',
    'ULB', 'URB', 'ULF', 'URF',
    'DLB', 'DRB', 'DLF', 'DRF',
    'LUF', 'LUB', 'LDF', 'LDB',
    'RUF', 'RUB', 'RDF', 'RDB'
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Corner Notation Mapper</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? <X className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Map your personal notation system to corner positions. This helps you remember which notation corresponds to which corner combination.
          </div>

          {/* Add/Edit Form */}
          {isEditing && (
            <div className="border rounded-lg p-4 space-y-3">
              <h4 className="font-medium">
                {editingMapping ? 'Edit Mapping' : 'Add New Mapping'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-sm font-medium">Corner Position</label>
                  <input
                    type="text"
                    value={newCorner}
                    onChange={(e) => setNewCorner(e.target.value)}
                    placeholder="e.g., FUL-ULB"
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Your Notation</label>
                  <input
                    type="text"
                    value={newNotation}
                    onChange={(e) => setNewNotation(e.target.value)}
                    placeholder="e.g., EA"
                    className="w-full mt-1 px-3 py-2 border border-input rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSave}>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Current Mappings */}
          <div>
            <h4 className="font-medium mb-3">Your Notation Mappings</h4>
            {notationMappings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">📝</div>
                <p>No notation mappings yet.</p>
                <p className="text-sm">Click "Edit" to add your first mapping.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {notationMappings.map((mapping, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-3 border rounded-lg"
                  >
                    <div>
                      <div className="font-medium">{mapping.corner}</div>
                      <div className="text-sm text-muted-foreground">{mapping.notation}</div>
                    </div>
                    {isEditing && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(mapping)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Reference Guide */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Corner Position Reference</h4>
            <div className="text-sm text-muted-foreground mb-3">
              Standard corner position notation (Face-Up-Right order):
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              {defaultCorners.map((corner) => (
                <div key={corner} className="bg-muted p-2 rounded text-center font-mono">
                  {corner}
                </div>
              ))}
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              <p><strong>Example:</strong> FUL = Front-Up-Left corner piece</p>
              <p><strong>Combination:</strong> FUL-ULB means solving FUL and ULB corners together</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
