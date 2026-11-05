import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { GeneralTab } from '../components/framework/GeneralTab';
import { CriteriaTab } from '../components/framework/CriteriaTab';
import { ThresholdsTab } from '../components/framework/ThresholdsTab';
import { RulesTab } from '../components/framework/RulesTab';
import { SafeguardsTab } from '../components/framework/SafeguardsTab';

const TABS = ['general', 'criteria', 'thresholds', 'rules', 'safeguards'] as const;
type TabKey = (typeof TABS)[number];

export function FrameworkBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const framework = useStore((state) => state.frameworks.find((f) => f.id === id));

  const [activeTab, setActiveTab] = useState<TabKey>('criteria');
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

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

  const handleTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    let targetIndex = -1;
    if (e.key === 'ArrowRight') {
      targetIndex = (index + 1) % TABS.length;
    } else if (e.key === 'ArrowLeft') {
      targetIndex = (index - 1 + TABS.length) % TABS.length;
    } else if (e.key === 'Home') {
      targetIndex = 0;
    } else if (e.key === 'End') {
      targetIndex = TABS.length - 1;
    }

    if (targetIndex !== -1) {
      e.preventDefault();
      const nextTab = TABS[targetIndex];
      setActiveTab(nextTab);
      tabRefs.current[targetIndex]?.focus();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Editing: {framework.name}</h1>
          <p className="text-sm text-slate-500">Configure criteria, scoring scales, thresholds, and governance rules.</p>
        </div>
        <Button variant="secondary" onClick={() => navigate('/frameworks')}>Back to Frameworks</Button>
      </div>

      <div className="flex space-x-4 border-b border-slate-200" role="tablist" aria-label="Framework Builder Sections">
        {TABS.map((tab, idx) => (
          <button
            key={tab}
            ref={(el) => { tabRefs.current[idx] = el; }}
            role="tab"
            id={`tab-${tab}`}
            aria-controls={`panel-${tab}`}
            aria-selected={activeTab === tab}
            tabIndex={activeTab === tab ? 0 : -1}
            onClick={() => setActiveTab(tab)}
            onKeyDown={(e) => handleTabKeyDown(e, idx)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 rounded-t ${
              activeTab === tab 
                ? 'border-slate-900 text-slate-900 font-semibold' 
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <div className="py-4" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0}>
        {activeTab === 'general' && <GeneralTab frameworkId={framework.id} />}
        {activeTab === 'criteria' && <CriteriaTab frameworkId={framework.id} />}
        {activeTab === 'thresholds' && <ThresholdsTab frameworkId={framework.id} />}
        {activeTab === 'rules' && <RulesTab frameworkId={framework.id} />}
        {activeTab === 'safeguards' && <SafeguardsTab frameworkId={framework.id} />}
      </div>
    </div>
  );
}
