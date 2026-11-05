import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { GeneralTab } from '../components/framework/GeneralTab';
import { CriteriaTab } from '../components/framework/CriteriaTab';
import { ThresholdsTab } from '../components/framework/ThresholdsTab';
import { RulesTab } from '../components/framework/RulesTab';
import { SafeguardsTab } from '../components/framework/SafeguardsTab';

export function FrameworkBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const framework = useStore((state) => state.frameworks.find((f) => f.id === id));

  const [activeTab, setActiveTab] = useState<'general' | 'criteria' | 'thresholds' | 'rules' | 'safeguards'>('criteria');

  if (!framework) {
    return (
      <div className="space-y-4">
        <div className="text-slate-700">Framework not found.</div>
        <Button variant="secondary" onClick={() => navigate('/frameworks')}>
          Return to Frameworks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Editing: {framework.name}</h1>
          <p className="text-sm text-slate-500">Configure criteria, scoring scales, thresholds, and governance rules.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/frameworks')}>Back to Frameworks</Button>
      </div>

      <div className="flex space-x-4 border-b border-slate-200">
        {(['general', 'criteria', 'thresholds', 'rules', 'safeguards'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab 
                ? 'border-slate-900 text-slate-900 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="py-4">
        {activeTab === 'general' && <GeneralTab frameworkId={framework.id} />}
        {activeTab === 'criteria' && <CriteriaTab frameworkId={framework.id} />}
        {activeTab === 'thresholds' && <ThresholdsTab frameworkId={framework.id} />}
        {activeTab === 'rules' && <RulesTab frameworkId={framework.id} />}
        {activeTab === 'safeguards' && <SafeguardsTab frameworkId={framework.id} />}
      </div>
    </div>
  );
}
