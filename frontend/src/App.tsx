import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Layout from "./components/Layout";
import DiscoveryPage from "./pages/DiscoveryPage";
import AuthPage from "./pages/AuthPage";
import DashboardPage from "./pages/DashboardPage";
import AdminDashboard from "./pages/AdminDashboard";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import SettingsPage from "./pages/SettingsPage";

import LandingPage from "./pages/LandingPage";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="discover" element={<DiscoveryPage />} />
            <Route path="profile" element={<DashboardPage />} />
            <Route path="verify-email" element={<VerifyEmailPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="admin" element={<AdminDashboard />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
