import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Threshold, RecommendationLevel } from '../../models/types';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { validateThresholdConfiguration } from '../../utils/assessmentEngine';

const RECOMMENDATIONS: RecommendationLevel[] = [
  'Critical Risk',
  'High Risk',
  'Moderate Risk',
  'Low Risk',
];

export function ThresholdsTab({ frameworkId }: { frameworkId: string }) {
  const { frameworks, updateFramework } = useStore();
  const framework = frameworks.find((f) => f.id === frameworkId);

  const [thresholds, setThresholds] = useState<Threshold[]>(
    framework ? JSON.parse(JSON.stringify(framework.thresholds)) : []
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!framework) return null;

  const validation = validateThresholdConfiguration(thresholds);

  const handleUpdate = (id: string, updates: Partial<Threshold>) => {
    setThresholds((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleAdd = () => {
    const sorted = [...thresholds].sort((a, b) => a.maxScore - b.maxScore);
    const lastMax = sorted.length > 0 ? sorted[sorted.length - 1].maxScore : 0;
    const newMin = Math.min(100, lastMax + 1);
    const newMax = Math.min(100, newMin + 20);

    const newThreshold: Threshold = {
      id: uuidv4(),
      minScore: newMin,
      maxScore: newMax,
      recommendation: 'Moderate Risk',
    };
    setThresholds([...thresholds, newThreshold]);
  };

  const handleRemove = (id: string) => {
    if (thresholds.length <= 1) {
      alert('Framework must retain at least one threshold.');
      return;
    }
    setThresholds(thresholds.filter((t) => t.id !== id));
  };

  const handleSave = () => {
    if (!validation.isValid) {
      alert(`Cannot save invalid thresholds:\n\n${validation.errors.join('\n')}`);
      return;
    }
    updateFramework(frameworkId, { thresholds });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Score Risk Thresholds</h2>
          <p className="text-sm text-slate-500">
            Map weighted percentage scores (0% to 100%) to baseline recommendation tiers.
          </p>
        </div>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" /> Add Threshold
        </Button>
      </div>

      {validation.errors.length > 0 && (
        <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          <div className="font-semibold flex items-center mb-1">
            <AlertTriangle className="h-4 w-4 mr-2" /> Threshold Configuration Errors
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {validation.errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
          <div className="font-semibold flex items-center mb-1">
            <Info className="h-4 w-4 mr-2" /> Configuration Notice
          </div>
          <ul className="list-disc pl-5 space-y-1">
            {validation.warnings.map((warn, i) => (
              <li key={i}>{warn}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3">
        {thresholds
          .sort((a, b) => a.minScore - b.minScore)
          .map((th) => (
            <Card key={th.id} className="p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-3">
                  <label className="text-xs text-slate-500 font-medium block mb-1">Min %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field text-sm"
                    value={th.minScore}
                    onChange={(e) =>
                      handleUpdate(th.id, { minScore: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="text-xs text-slate-500 font-medium block mb-1">Max %</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="input-field text-sm"
                    value={th.maxScore}
                    onChange={(e) =>
                      handleUpdate(th.id, { maxScore: parseFloat(e.target.value) || 0 })
                    }
                  />
                </div>

                <div className="sm:col-span-5">
                  <label className="text-xs text-slate-500 font-medium block mb-1">Outcome Level</label>
                  <select
                    className="input-field text-sm"
                    value={th.recommendation}
                    onChange={(e) =>
                      handleUpdate(th.id, {
                        recommendation: e.target.value as RecommendationLevel,
                      })
                    }
                  >
                    {RECOMMENDATIONS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-1 flex justify-end pt-5 sm:pt-0">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleRemove(th.id)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove Threshold"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button onClick={handleSave} disabled={!validation.isValid}>
          Save Thresholds
        </Button>
        {saveSuccess && (
          <span className="text-sm text-green-700 font-medium flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Thresholds successfully updated
          </span>
        )}
      </div>
    </div>
  );
}
