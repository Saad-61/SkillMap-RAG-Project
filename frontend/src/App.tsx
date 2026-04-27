import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "./components/app-shell";
import { CvProvider } from "./state/cv-context";
import LandingPage from "./pages/landing-page";
import AnalyzingPage from "./pages/analyzing-page";
import ResultsPage from "./pages/results-page";

export default function App() {
  return (
    <CvProvider>
      <div className="app-wash min-h-screen">
        <AppShell>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/analyzing" element={<AnalyzingPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </div>
    </CvProvider>
  );
}

