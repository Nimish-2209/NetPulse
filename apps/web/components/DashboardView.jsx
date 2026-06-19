"use client";

import ChecksPanel from "./ChecksPanel";
import DashboardHeader from "./DashboardHeader";
import DashboardSidebar from "./DashboardSidebar";
import IncidentsPanel from "./IncidentsPanel";
import MetricsGrid from "./MetricsGrid";
import ServicesPanel from "./ServicesPanel";
import TeamMembersPanel from "./TeamMembersPanel";

export default function DashboardView({ dashboard }) {
  function selectSection(sectionId) {
    const section = document.getElementById(sectionId);

    if (!section) return;

    section.scrollIntoView({ behavior: "smooth", block: "start" });
    section.classList.remove("panel-highlight");

    window.setTimeout(() => {
      section.classList.add("panel-highlight");
      window.setTimeout(() => section.classList.remove("panel-highlight"), 1200);
    }, 150);
  }

  return (
    <main className="dashboard-shell">
      <DashboardSidebar
        currentTeamId={dashboard.currentTeamId}
        isAdmin={dashboard.isAdmin}
        onSectionSelect={selectSection}
        onSignOut={dashboard.signOut}
        setCurrentTeamId={dashboard.setCurrentTeamId}
        teams={dashboard.teams}
      />

      <section className="workspace">
        <DashboardHeader
          currentTeam={dashboard.currentTeam}
          message={dashboard.message}
          socketState={dashboard.socketState}
        />

        <MetricsGrid currentRole={dashboard.currentRole} summary={dashboard.summary} />

        <section className="content-grid">
          <ServicesPanel
            busy={dashboard.busy}
            canMaintain={dashboard.canMaintain}
            onCreateService={dashboard.createService}
            onRunCheck={dashboard.runCheck}
            selectedServiceId={dashboard.selectedServiceId}
            serviceForm={dashboard.serviceForm}
            services={dashboard.services}
            setSelectedServiceId={dashboard.setSelectedServiceId}
            setServiceForm={dashboard.setServiceForm}
          />

          <IncidentsPanel
            busy={dashboard.busy}
            canMaintain={dashboard.canMaintain}
            incidentForm={dashboard.incidentForm}
            incidents={dashboard.incidents}
            onCreateIncident={dashboard.createIncident}
            onResolveIncident={dashboard.resolveIncident}
            selectedService={dashboard.selectedService}
            selectedServiceId={dashboard.selectedServiceId}
            setIncidentForm={dashboard.setIncidentForm}
          />
        </section>

        <ChecksPanel
          chartChecks={dashboard.chartChecks}
          checks={dashboard.checks}
          selectedService={dashboard.selectedService}
        />

        {dashboard.isAdmin ? (
          <TeamMembersPanel
            busy={dashboard.busy}
            invitations={dashboard.invitations}
            memberForm={dashboard.memberForm}
            members={dashboard.members}
            onInviteMember={dashboard.inviteMember}
            onRemoveMember={dashboard.removeMember}
            onUpdateMemberRole={dashboard.updateMemberRole}
            setMemberForm={dashboard.setMemberForm}
          />
        ) : null}
      </section>
    </main>
  );
}
