
import { useStore } from '../../store/useStore';
import type { Criterion } from '../../models/types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Edit, Trash2, Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export function CriteriaTab({ frameworkId }: { frameworkId: string }) {
  const { frameworks, updateFramework } = useStore();
  const framework = frameworks.find((f) => f.id === frameworkId);

  if (!framework) return null;

  const handleAddCriterion = () => {
    const newCrit: Criterion = {
      id: uuidv4(),
      title: 'New Criterion',
      description: 'Description here',
      weight: 1,
      scoringScale: { type: 'numeric', min: 0, max: 3 },
      guidanceNotes: '',
      displayOrder: framework.criteria.length + 1,
    };
    updateFramework(frameworkId, { criteria: [...framework.criteria, newCrit] });
  };

  const handleRemoveCriterion = (id: string) => {
    updateFramework(frameworkId, { criteria: framework.criteria.filter((c) => c.id !== id) });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium text-slate-900">Criteria</h2>
        <Button size="sm" onClick={handleAddCriterion}><Plus className="mr-2 h-4 w-4" /> Add Criterion</Button>
      </div>

      <div className="grid gap-4">
        {framework.criteria.sort((a, b) => a.displayOrder - b.displayOrder).map((crit) => (
          <Card key={crit.id}>
            <CardHeader className="py-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{crit.title}</CardTitle>
                  <p className="text-sm text-slate-500 mt-1">{crit.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button size="sm" variant="secondary" title="Edit">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleRemoveCriterion(crit.id)} className="text-red-600 hover:bg-red-50" title="Delete">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex space-x-4 text-sm text-slate-600">
                <div><strong>Weight:</strong> {crit.weight}</div>
                <div><strong>Scale:</strong> {crit.scoringScale.min} - {crit.scoringScale.max}</div>
                {crit.category && <div><strong>Category:</strong> {crit.category}</div>}
              </div>
            </CardContent>
          </Card>
        ))}
        {framework.criteria.length === 0 && (
          <div className="text-center text-slate-500 py-8">No criteria added yet.</div>
        )}
      </div>
    </div>
  );
}
