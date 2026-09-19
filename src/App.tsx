import { useState } from 'react';
import { DigitalTwinProvider } from './context/DigitalTwinContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { TopBar } from './components/TopBar/TopBar';
import { TwinView } from './components/TwinView/TwinView';
import { FleetView } from './components/FleetView/FleetView';
import { CSSView } from './components/CSSView/CSSView';
import { SRPView } from './components/SRPView/SRPView';
import { ReportsView } from './components/ReportsView/ReportsView';
import { DatabaseView } from './components/DatabaseView/DatabaseView';
import { AnalyticsView } from './components/AnalyticsView/AnalyticsView';
import { RightPanel } from './components/RightPanel/RightPanel';
import './App.css';

export type ActiveView = 'dashboard' | 'wells' | 'analytics' | 'css' | 'srp' | 'reports' | 'database';

function AppContent() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <TwinView />;
      case 'wells':
        return <FleetView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'css':
        return <CSSView />;
      case 'srp':
        return <SRPView />;
      case 'reports':
        return <ReportsView />;
      case 'database':
        return <DatabaseView />;
      default:
        return <TwinView />;
    }
  };

  // Only show the RightPanel in dashboard / SRP / CSS modes where telemetry inspectors matter most
  const showRightPanel = activeView === 'dashboard' || activeView === 'srp';

  return (
    <div className="shell">
      <TopBar />
      <div className="shell-body">
        <Sidebar active={activeView} onNavigate={setActiveView} />
        <main className="shell-main">
          <div className="shell-center">
            {renderActiveView()}
          </div>
          {showRightPanel && (
            <div className="shell-right">
              <RightPanel />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <DigitalTwinProvider>
      <AppContent />
    </DigitalTwinProvider>
  );
}
