"use client";

import { useEffect } from "react";
import AuthPanel from "./AuthPanel";
import DashboardView from "./DashboardView";
import { useNetPulseDashboard } from "../hooks/useNetPulseDashboard";

export default function AppShell({ initialAuthMode = "login" }) {
  const dashboard = useNetPulseDashboard();

  useEffect(() => {
    if (!dashboard.auth) {
      dashboard.setAuthMode(initialAuthMode);
    }
  }, [dashboard.auth, dashboard.setAuthMode, initialAuthMode]);

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
