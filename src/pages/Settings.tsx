import { useRef } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Download, Upload, AlertTriangle } from 'lucide-react';

export function Settings() {
  const state = useStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const dataStr = JSON.stringify({
      frameworks: state.frameworks,
      reviews: state.reviews,
      activeFrameworkId: state.activeFrameworkId,
    }, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'ethics-framework.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.frameworks) {
          if (window.confirm('Are you sure you want to import this data? It will merge or overwrite current configurations.')) {
            state.importData(json);
            alert('Import successful!');
          }
        } else {
          alert('Invalid file format. Missing "frameworks" data.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // reset input
  };

  const handleReset = () => {
    if (window.confirm('WARNING: This will delete all your custom frameworks and reviews, resetting the application to its initial state. Are you sure?')) {
      state.resetToDefaults();
      alert('Application reset to defaults.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500">Manage data, export frameworks, and configure application settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Export Configuration</CardTitle>
          <CardDescription>Download all frameworks, criteria, rules, and reviews as a JSON file.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={handleExport}><Download className="mr-2 h-4 w-4" /> Export to JSON</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import Configuration</CardTitle>
          <CardDescription>Upload an ethics-framework.json file to restore or share frameworks.</CardDescription>
        </CardHeader>
        <CardContent>
          <input 
            type="file" 
            accept=".json" 
            className="hidden" 
            ref={fileInputRef} 
            onChange={handleFileChange}
          />
          <Button variant="secondary" onClick={handleImportClick}>
            <Upload className="mr-2 h-4 w-4" /> Import from JSON
          </Button>
        </CardContent>
      </Card>

      <Card className="border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-800 flex items-center">
            <AlertTriangle className="mr-2 h-5 w-5" /> Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600 mb-4">
            Resetting the application will wipe all local data and restore the default frameworks.
          </p>
          <Button variant="danger" onClick={handleReset}>Reset to Defaults</Button>
        </CardContent>
      </Card>
    </div>
  );
}
