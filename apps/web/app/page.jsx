"use client";

import AuthPanel from "../components/AuthPanel";
import DashboardView from "../components/DashboardView";
import { useNetPulseDashboard } from "../hooks/useNetPulseDashboard";

export default function HomePage() {
  const dashboard = useNetPulseDashboard();

  if (!dashboard.auth) {
    return (
      <AuthPanel
        authForm={dashboard.authForm}
        authMode={dashboard.authMode}
        busy={dashboard.busy}
        message={dashboard.message}
        onSubmit={dashboard.submitAuth}
        registerMode={dashboard.registerMode}
        setAuthForm={dashboard.setAuthForm}
        setAuthMode={dashboard.setAuthMode}
        setRegisterMode={dashboard.setRegisterMode}
      />
    );
  }

  return <DashboardView dashboard={dashboard} />;
}
