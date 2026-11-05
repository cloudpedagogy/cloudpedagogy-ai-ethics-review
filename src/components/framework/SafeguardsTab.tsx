import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Safeguard } from '../../models/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function SafeguardsTab({ frameworkId }: { frameworkId: string }) {
  const { frameworks, updateFramework } = useStore();
  const framework = frameworks.find((f) => f.id === frameworkId);

  const [safeguards, setSafeguards] = useState<Safeguard[]>(
    framework ? JSON.parse(JSON.stringify(framework.safeguards)) : []
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!framework) return null;

  const handleAddSafeguard = () => {
    const newSafeguard: Safeguard = {
      id: uuidv4(),
      title: 'New Safeguard',
      description: 'Describe the required control, audit procedure, or operational boundary...',
    };
    setSafeguards([...safeguards, newSafeguard]);
  };

  const handleUpdate = (id: string, updates: Partial<Safeguard>) => {
    setSafeguards(safeguards.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleRemove = (id: string) => {
    setSafeguards(safeguards.filter((s) => s.id !== id));
  };

  const handleSave = () => {
    for (const sg of safeguards) {
      if (!sg.title.trim()) {
        alert('All safeguards must have a title.');
        return;
      }
    }
    updateFramework(frameworkId, { safeguards });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Recommended Safeguards Library</h2>
          <p className="text-sm text-slate-500">
            Define recommended mitigation controls that reviewers can attach to system evaluations.
          </p>
        </div>
        <Button size="sm" onClick={handleAddSafeguard}>
          <Plus className="mr-2 h-4 w-4" /> Add Safeguard
        </Button>
      </div>

      <div className="space-y-4">
        {safeguards.map((sg) => (
          <Card key={sg.id} className="p-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex-1 mr-4">
                  <label className="text-xs text-slate-500 font-medium block mb-1">Control Title</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={sg.title}
                    onChange={(e) => handleUpdate(sg.id, { title: e.target.value })}
                    placeholder="e.g., Mandatory Human-in-the-Loop Review"
                  />
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemove(sg.id)}
                  className="text-red-500 hover:text-red-700 mt-5"
                  title="Remove Safeguard"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div>
                <label className="text-xs text-slate-500 font-medium block mb-1">
                  Description & Implementation Requirement
                </label>
                <textarea
                  className="input-field min-h-[70px] text-sm"
                  value={sg.description}
                  onChange={(e) => handleUpdate(sg.id, { description: e.target.value })}
                  placeholder="Detail the safeguard requirement..."
                />
              </div>
            </div>
          </Card>
        ))}

        {safeguards.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            No safeguards defined.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button onClick={handleSave}>Save Safeguards</Button>
        {saveSuccess && (
          <span className="text-sm text-green-700 font-medium flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Safeguards successfully updated
          </span>
        )}
      </div>
    </div>
  );
}
