
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Copy, Trash2, Edit, Star, ShieldCheck } from 'lucide-react';

export function Frameworks() {
  const { frameworks, activeFrameworkId, setActiveFrameworkId, duplicateFramework, deleteFramework } = useStore();
  const navigate = useNavigate();

  const handleDuplicate = (id: string, name: string) => {
    duplicateFramework(id, `${name} (Copy)`);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this framework? This action cannot be undone.')) {
      deleteFramework(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ethics Frameworks</h1>
          <p className="text-sm text-slate-500">Manage templates and assessment rubrics.</p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {frameworks.map((fw) => (
          <Card key={fw.id} className={`relative ${fw.id === activeFrameworkId ? 'ring-2 ring-slate-900' : ''}`}>
            {fw.id === activeFrameworkId && (
              <div className="absolute top-4 right-4 text-slate-900" title="Active Framework">
                <ShieldCheck className="h-5 w-5" />
              </div>
            )}
            <CardHeader>
              <CardTitle className="pr-8">{fw.name}</CardTitle>
              <CardDescription className="line-clamp-2 min-h-[2.5rem]">
                {fw.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {fw.criteria.length} Criteria
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {fw.rules.length} Rules
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-800">
                  {fw.safeguards.length} Safeguards
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => navigate(`/frameworks/${fw.id}`)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button size="sm" variant="ghost" onClick={() => handleDuplicate(fw.id, fw.name)} title="Duplicate">
                <Copy className="h-4 w-4" />
              </Button>
              {!fw.isDefault && (
                <Button size="sm" variant="ghost" onClick={() => handleDelete(fw.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" title="Delete">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
              {fw.id !== activeFrameworkId && (
                <Button size="sm" variant="ghost" onClick={() => setActiveFrameworkId(fw.id)} title="Set as Active">
                  <Star className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
