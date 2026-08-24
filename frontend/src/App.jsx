import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { SessionProvider } from './shared/state/SessionContext';
import KeyGate from './shared/components/KeyGate';
import Layout from './shared/components/Layout';
import AuditTerminalPage from './features/audit-terminal/pages/AuditTerminalPage';
import ApprovalQueuePage from './features/approval-queue/pages/ApprovalQueuePage';
import MandatePage from './features/policy-mandates/pages/MandatePage';
import CatalogPage from './features/catalog/pages/CatalogPage';
import AgentStudioPage from './features/agent-studio/pages/AgentStudioPage';

function App() {
  return (
    <SessionProvider>
      <KeyGate>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<AuditTerminalPage />} />
              <Route path="/agent-studio" element={<AgentStudioPage />} />
              <Route path="/queue" element={<ApprovalQueuePage />} />
              <Route path="/mandate" element={<MandatePage />} />
              <Route path="/catalog" element={<CatalogPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </Router>
      </KeyGate>
    </SessionProvider>
  );
}

export default App;
