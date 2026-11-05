import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldCheck, Info } from 'lucide-react';

export function GeneralTab({ frameworkId }: { frameworkId: string }) {
  const { frameworks, updateFramework } = useStore();
  const framework = frameworks.find((f) => f.id === frameworkId);

  const [name, setName] = useState(framework?.name || '');
  const [description, setDescription] = useState(framework?.description || '');
  const [isSaved, setIsSaved] = useState(false);

  if (!framework) return null;

  const handleSave = () => {
    if (!name.trim()) {
      alert('Framework name cannot be empty.');
      return;
    }
    updateFramework(frameworkId, { name: name.trim(), description: description.trim() });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {framework.isDefault && (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 text-sm flex items-start">
          <Info className="h-5 w-5 mr-3 text-slate-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Built-in Standard Framework:</span>
            <p className="mt-1 text-slate-600">
              This is a standard reference framework. You may adjust its settings here, or duplicate it from the Frameworks library to create an independent customized version.
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Framework Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="label-text mb-2 block font-medium">Framework Name</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Higher Education Ethics Rubric"
            />
          </div>

          <div>
            <label className="label-text mb-2 block font-medium">Description & Scope</label>
            <textarea
              className="input-field min-h-[120px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the intended governance context, jurisdiction, or organizational scope of this framework..."
            />
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button onClick={handleSave}>
              Save Framework Settings
            </Button>
            {isSaved && (
              <span className="text-sm text-green-700 font-medium flex items-center">
                <ShieldCheck className="h-4 w-4 mr-1" /> Settings saved
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm text-slate-600 uppercase tracking-wider font-semibold">
            Framework Composition
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center">
            <div className="p-3 bg-slate-50 rounded-lg">
              <dt className="text-xs text-slate-500 font-medium">Criteria</dt>
              <dd className="text-xl font-bold text-slate-900 mt-1">{framework.criteria.length}</dd>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <dt className="text-xs text-slate-500 font-medium">Thresholds</dt>
              <dd className="text-xl font-bold text-slate-900 mt-1">{framework.thresholds.length}</dd>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <dt className="text-xs text-slate-500 font-medium">Rules</dt>
              <dd className="text-xl font-bold text-slate-900 mt-1">{framework.rules.length}</dd>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <dt className="text-xs text-slate-500 font-medium">Safeguards</dt>
              <dd className="text-xl font-bold text-slate-900 mt-1">{framework.safeguards.length}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}
