import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Criterion } from '../../models/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Edit, Trash2, Plus, Check, X, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { findDependentRules } from '../../utils/assessmentEngine';

export function CriteriaTab({ frameworkId }: { frameworkId: string }) {
  const { frameworks, updateFramework } = useStore();
  const framework = frameworks.find((f) => f.id === frameworkId);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Criterion>>({});

  if (!framework) return null;

  const handleAddCriterion = () => {
    const newCrit: Criterion = {
      id: uuidv4(),
      title: 'New Evaluation Criterion',
      description: 'Describe the ethical expectation or boundary...',
      weight: 3,
      scoringScale: {
        type: 'numeric',
        min: 0,
        max: 3,
        labels: {
          0: 'Unacceptable / High Risk',
          1: 'Needs Improvement',
          2: 'Acceptable',
          3: 'Excellent / No Risk',
        },
      },
      guidanceNotes: '',
      category: 'Governance',
      displayOrder: framework.criteria.length + 1,
    };
    updateFramework(frameworkId, { criteria: [...framework.criteria, newCrit] });
    setEditingId(newCrit.id);
    setEditForm(newCrit);
  };

  const handleStartEdit = (crit: Criterion) => {
    setEditingId(crit.id);
    setEditForm({ ...crit });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const handleSaveEdit = (id: string) => {
    if (!editForm.title?.trim()) {
      alert('Criterion title is required.');
      return;
    }
    const weight = Number(editForm.weight);
    if (isNaN(weight) || weight < 1) {
      alert('Weight must be a positive number (minimum 1).');
      return;
    }

    const updatedCriteria = framework.criteria.map((c) =>
      c.id === id
        ? {
            ...c,
            ...editForm,
            title: editForm.title!.trim(),
            weight,
          }
        : c
    );

    updateFramework(frameworkId, { criteria: updatedCriteria });
    setEditingId(null);
    setEditForm({});
  };

  const handleRemoveCriterion = (id: string) => {
    // Check rule dependencies first
    const dependentRules = findDependentRules(id, framework.rules);
    if (dependentRules.length > 0) {
      const ruleDesc = dependentRules[0].description || dependentRules[0].id;
      alert(
        `Cannot delete this criterion: it is referenced by rule "${ruleDesc}".\nPlease remove or edit the dependent rule before deleting this criterion.`
      );
      return;
    }

    if (framework.criteria.length <= 1) {
      alert('A framework must retain at least one criterion.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this criterion?')) {
      updateFramework(frameworkId, {
        criteria: framework.criteria.filter((c) => c.id !== id),
      });
      if (editingId === id) {
        setEditingId(null);
      }
    }
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Evaluation Criteria</h2>
          <p className="text-sm text-slate-500">
            Define the ethical principles, weighting, and guidance for reviewers.
          </p>
        </div>
        <Button size="sm" onClick={handleAddCriterion}>
          <Plus className="mr-2 h-4 w-4" /> Add Criterion
        </Button>
      </div>

      <div className="grid gap-4">
        {framework.criteria
          .slice()
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((crit) => {
            const isEditing = editingId === crit.id;
            const dependentRules = findDependentRules(crit.id, framework.rules);

            if (isEditing) {
              return (
                <Card key={crit.id} className="border-slate-900 ring-1 ring-slate-900 p-4 space-y-4">
                  <div className="flex justify-between items-center border-b pb-2">
                    <span className="font-semibold text-slate-900 text-sm">Edit Criterion</span>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={() => handleSaveEdit(crit.id)}>
                        <Check className="mr-1 h-3 w-3" /> Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleCancelEdit}>
                        <X className="mr-1 h-3 w-3" /> Cancel
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8">
                      <label className="text-xs text-slate-500 font-medium block mb-1">Title</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={editForm.title || ''}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="text-xs text-slate-500 font-medium block mb-1">Category</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={editForm.category || ''}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        placeholder="e.g. Governance, Impact"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-500 font-medium block mb-1">Description</label>
                    <textarea
                      className="input-field min-h-[60px] text-sm"
                      value={editForm.description || ''}
                      onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-4">
                      <label className="text-xs text-slate-500 font-medium block mb-1">Weight Factor (1–10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input-field text-sm"
                        value={editForm.weight ?? 1}
                        onChange={(e) =>
                          setEditForm({ ...editForm, weight: parseInt(e.target.value, 10) || 1 })
                        }
                      />
                    </div>
                    <div className="sm:col-span-8">
                      <label className="text-xs text-slate-500 font-medium block mb-1">Guidance Notes for Reviewer</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={editForm.guidanceNotes || ''}
                        onChange={(e) => setEditForm({ ...editForm, guidanceNotes: e.target.value })}
                        placeholder="Specific questions reviewer should consider..."
                      />
                    </div>
                  </div>
                </Card>
              );
            }

            return (
              <Card key={crit.id}>
                <CardHeader className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center space-x-2">
                        <CardTitle>{crit.title}</CardTitle>
                        {crit.category && (
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                            {crit.category}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 mt-1">{crit.description}</p>
                      {crit.guidanceNotes && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded mt-2 border border-slate-100 italic">
                          <strong>Guidance:</strong> {crit.guidanceNotes}
                        </p>
                      )}
                      {dependentRules.length > 0 && (
                        <div className="text-xs text-amber-700 flex items-center mt-2">
                          <AlertTriangle className="h-3 w-3 mr-1 inline" />
                          Referenced by {dependentRules.length} red-flag rule(s)
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleStartEdit(crit)}
                        title="Edit Criterion"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveCriterion(crit.id)}
                        className="text-red-600 hover:bg-red-50"
                        title="Delete Criterion"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="flex space-x-4 text-xs text-slate-600">
                    <div><strong>Weight:</strong> {crit.weight}</div>
                    <div><strong>Scoring Scale:</strong> {crit.scoringScale.min} to {crit.scoringScale.max}</div>
                    <div><strong>Internal ID:</strong> <code className="text-slate-500">{crit.id}</code></div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        {framework.criteria.length === 0 && (
          <div className="text-center text-slate-500 py-8 bg-slate-50 rounded-lg">
            No criteria added yet.
          </div>
        )}
      </div>
    </div>
  );
}
