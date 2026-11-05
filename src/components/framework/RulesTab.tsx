import { useState } from 'react';
import { useStore } from '../../store/useStore';
import type { Rule, RecommendationLevel } from '../../models/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Plus, Trash2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

const OUTCOME_LEVELS: RecommendationLevel[] = [
  'Critical Risk',
  'High Risk',
  'Moderate Risk',
  'Low Risk',
];

export function RulesTab({ frameworkId }: { frameworkId: string }) {
  const { frameworks, updateFramework } = useStore();
  const framework = frameworks.find((f) => f.id === frameworkId);

  const [rules, setRules] = useState<Rule[]>(
    framework ? JSON.parse(JSON.stringify(framework.rules)) : []
  );
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!framework) return null;

  const handleAddRule = () => {
    if (framework.criteria.length === 0) {
      alert('Cannot add a rule: Framework has no criteria defined.');
      return;
    }

    const firstCrit = framework.criteria[0];
    const newRule: Rule = {
      id: uuidv4(),
      description: `Critical escalation if ${firstCrit.title} is unacceptable`,
      outcomeLevel: 'Critical Risk',
      conditionGroup: {
        id: uuidv4(),
        logic: 'AND',
        conditions: [
          {
            id: uuidv4(),
            field: firstCrit.id,
            operator: 'lessThan',
            value: 2,
          },
        ],
      },
    };
    setRules([...rules, newRule]);
  };

  const handleRemoveRule = (id: string) => {
    setRules(rules.filter((r) => r.id !== id));
  };

  const handleUpdateRule = (id: string, updates: Partial<Rule>) => {
    setRules(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const handleUpdateCondition = (
    ruleId: string,
    condIndex: number,
    updates: { field?: string; operator?: 'lessThan' | 'greaterThan' | 'equals'; value?: number }
  ) => {
    setRules(
      rules.map((r) => {
        if (r.id !== ruleId) return r;
        const newConditions = [...r.conditionGroup.conditions];
        newConditions[condIndex] = {
          ...newConditions[condIndex],
          ...updates,
        };
        return {
          ...r,
          conditionGroup: {
            ...r.conditionGroup,
            conditions: newConditions,
          },
        };
      })
    );
  };

  const handleSave = () => {
    // Validate all rules
    for (const rule of rules) {
      if (!rule.description.trim()) {
        alert('All rules must have a clear description.');
        return;
      }
      for (const cond of rule.conditionGroup.conditions) {
        if (!framework.criteria.some((c) => c.id === cond.field)) {
          alert(`Rule "${rule.description}" references an unknown or deleted criterion.`);
          return;
        }
      }
    }

    updateFramework(frameworkId, { rules });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Conditional Red-Flag Rules</h2>
          <p className="text-sm text-slate-500">
            Establish non-compensatory overrides that elevate risk tiers when critical criteria fail.
          </p>
        </div>
        <Button size="sm" onClick={handleAddRule}>
          <Plus className="mr-2 h-4 w-4" /> Add Rule
        </Button>
      </div>

      <div className="space-y-4">
        {rules.map((rule) => {
          const condition = rule.conditionGroup.conditions[0];
          const referencedCrit = framework.criteria.find((c) => c.id === condition?.field);

          return (
            <Card key={rule.id} className="border-slate-200">
              <CardHeader className="py-4 border-b border-slate-100 bg-slate-50 flex flex-row items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldAlert className="h-5 w-5 text-red-600" />
                  <CardTitle className="text-base text-slate-900">Red-Flag Override</CardTitle>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleRemoveRule(rule.id)}
                  className="text-red-500 hover:text-red-700"
                  title="Remove Rule"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">Rule Description</label>
                  <input
                    type="text"
                    className="input-field text-sm"
                    value={rule.description}
                    onChange={(e) => handleUpdateRule(rule.id, { description: e.target.value })}
                    placeholder="e.g., Critical risk override if human oversight is absent"
                  />
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Condition Trigger (IF)
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                    <div className="sm:col-span-5">
                      <label className="text-xs text-slate-500 block mb-1">Criterion</label>
                      <select
                        className="input-field text-sm"
                        value={condition?.field || ''}
                        onChange={(e) =>
                          handleUpdateCondition(rule.id, 0, { field: e.target.value })
                        }
                      >
                        {framework.criteria.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-4">
                      <label className="text-xs text-slate-500 block mb-1">Operator</label>
                      <select
                        className="input-field text-sm"
                        value={condition?.operator || 'lessThan'}
                        onChange={(e) =>
                          handleUpdateCondition(rule.id, 0, {
                            operator: e.target.value as 'lessThan' | 'greaterThan' | 'equals',
                          })
                        }
                      >
                        <option value="lessThan">&lt; Less Than</option>
                        <option value="greaterThan">&gt; Greater Than</option>
                        <option value="equals">= Equals</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3">
                      <label className="text-xs text-slate-500 block mb-1">Threshold Score</label>
                      <input
                        type="number"
                        min="0"
                        max={referencedCrit?.scoringScale.max || 3}
                        className="input-field text-sm"
                        value={typeof condition?.value === 'number' ? condition.value : 2}
                        onChange={(e) =>
                          handleUpdateCondition(rule.id, 0, {
                            value: parseInt(e.target.value, 10) || 0,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-500 font-medium block mb-1">
                    Override Outcome (THEN ESCALATE TO)
                  </label>
                  <select
                    className="input-field text-sm"
                    value={rule.outcomeLevel}
                    onChange={(e) =>
                      handleUpdateRule(rule.id, {
                        outcomeLevel: e.target.value as RecommendationLevel,
                      })
                    }
                  >
                    {OUTCOME_LEVELS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {rules.length === 0 && (
          <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-300">
            No red-flag rules configured. Standard threshold percentages will apply without overrides.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button onClick={handleSave}>Save Rules</Button>
        {saveSuccess && (
          <span className="text-sm text-green-700 font-medium flex items-center">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Rules successfully updated
          </span>
        )}
      </div>
    </div>
  );
}
