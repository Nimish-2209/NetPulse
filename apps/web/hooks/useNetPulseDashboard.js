"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "../lib/api";
import { clearStoredAuth, getStoredAuth, saveStoredAuth } from "../lib/auth";
import { createStatusSocket } from "../lib/socket";

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
  teamName: "",
  inviteToken: ""
};

const emptyServiceForm = {
  name: "",
  url: "",
  checkIntervalSeconds: 60,
  timeoutMs: 5000
};

const emptyIncidentForm = {
  title: "",
  severity: "medium",
  description: "",
  assignedTo: ""
};

const emptyMemberForm = {
  email: "",
  role: "viewer"
};

const emptyTeamMetrics = {
  uptimePercentage: null,
  uptimeWindowHours: 24,
  totalChecks: 0,
  successfulChecks: 0
};

function upsertById(items, nextItem) {
  const nextId = String(nextItem.id || nextItem._id);
  const exists = items.some((item) => String(item.id || item._id) === nextId);

  if (exists) {
    return items.map((item) => (String(item.id || item._id) === nextId ? nextItem : item));
  }

  return [nextItem, ...items];
}

export function useNetPulseDashboard() {
  const [auth, setAuth] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [registerMode, setRegisterMode] = useState("createTeam");
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [teams, setTeams] = useState([]);
  const [currentTeamId, setCurrentTeamId] = useState("");
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [checks, setChecks] = useState([]);
  const [members, setMembers] = useState([]);
  const [teamMetrics, setTeamMetrics] = useState(emptyTeamMetrics);
  const [invitations, setInvitations] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceForm, setServiceForm] = useState(emptyServiceForm);
  const [incidentForm, setIncidentForm] = useState(emptyIncidentForm);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [socketState, setSocketState] = useState("offline");
  const selectedServiceIdRef = useRef("");

  const token = auth?.token;
  const currentTeam = useMemo(
    () => teams.find((team) => team.id === currentTeamId),
    [currentTeamId, teams]
  );
  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId),
    [selectedServiceId, services]
  );
  const currentRole = currentTeam?.role || "viewer";
  const isAdmin = currentRole === "admin";
  const canMaintain = currentRole === "admin" || currentRole === "maintainer";
  const chartChecks = useMemo(() => checks.slice(0, 30), [checks]);
  const summary = useMemo(
    () => ({
      total: services.length,
      down: services.filter((service) => service.currentStatus === "down").length,
      degraded: services.filter((service) => service.currentStatus === "degraded").length,
      openIncidents: incidents.filter((incident) => incident.status !== "resolved").length,
      uptimePercentage: teamMetrics.uptimePercentage,
      uptimeWindowHours: teamMetrics.uptimeWindowHours,
      totalChecks: teamMetrics.totalChecks
    }),
    [incidents, services, teamMetrics]
  );

  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (storedAuth?.token) {
      setAuth(storedAuth);
      loadSession(storedAuth.token).catch(handleRequestError);
    }
  }, []);

  useEffect(() => {
    selectedServiceIdRef.current = selectedServiceId;
  }, [selectedServiceId]);

  useEffect(() => {
    if (token && currentTeamId) {
      loadTeamData(currentTeamId).catch(handleRequestError);
    }
  }, [token, currentTeamId]);

  useEffect(() => {
    if (token && currentTeamId && selectedServiceId) {
      loadChecks(selectedServiceId).catch(handleRequestError);
    }
  }, [token, currentTeamId, selectedServiceId]);

  useEffect(() => {
    if (token && currentTeamId) {
      loadMembers(currentTeamId).catch(handleRequestError);
    } else {
      setMembers([]);
    }
  }, [token, currentTeamId]);

  useEffect(() => {
    if (token && currentTeamId && isAdmin) {
      loadInvitations(currentTeamId).catch(handleRequestError);
    } else {
      setInvitations([]);
    }
  }, [token, currentTeamId, isAdmin]);

  useEffect(() => {
    if (!token || !currentTeamId) return undefined;

    const socket = createStatusSocket();
    setSocketState("connecting");

    socket.on("connect", () => {
      setSocketState("live");
      socket.emit("team:join", currentTeamId);
    });

    socket.on("disconnect", () => setSocketState("offline"));
    socket.on("connect_error", () => setSocketState("offline"));

    socket.on("service:created", ({ service }) => {
      setServices((currentServices) => upsertById(currentServices, service));
    });

    socket.on("service:updated", ({ service }) => {
      setServices((currentServices) => upsertById(currentServices, service));
    });

    socket.on("service:deleted", ({ serviceId }) => {
      setServices((currentServices) =>
        currentServices.filter((service) => String(service.id) !== String(serviceId))
      );
    });

    socket.on("check:created", ({ service, check }) => {
      setServices((currentServices) => upsertById(currentServices, service));

      if (String(service.id) === String(selectedServiceIdRef.current)) {
        setChecks((currentChecks) => upsertById(currentChecks, check).slice(0, 100));
      }
    });

    socket.on("incident:created", ({ incident }) => {
      setIncidents((currentIncidents) => upsertById(currentIncidents, incident));
    });

    socket.on("incident:updated", ({ incident }) => {
      setIncidents((currentIncidents) => upsertById(currentIncidents, incident));
    });

    return () => {
      socket.emit("team:leave", currentTeamId);
      socket.disconnect();
    };
  }, [currentTeamId, token]);

  async function loadSession(nextToken = token) {
    const data = await apiRequest("/auth/me", { token: nextToken });
    setTeams(data.teams);
    setCurrentTeamId(data.teams[0]?.id || "");
    setAuth((currentAuth) => {
      const nextAuth = { ...(currentAuth || {}), token: nextToken, user: data.user, teams: data.teams };
      saveStoredAuth(nextAuth);
      return nextAuth;
    });
  }

  async function loadTeamData(teamId) {
    const [serviceData, incidentData, metricsData] = await Promise.all([
      apiRequest(`/teams/${teamId}/services`, { token }),
      apiRequest(`/teams/${teamId}/incidents`, { token }),
      apiRequest(`/teams/${teamId}/metrics`, { token })
    ]);

    setServices(serviceData.services);
    setIncidents(incidentData.incidents);
    setTeamMetrics(metricsData.metrics || emptyTeamMetrics);
    setSelectedServiceId((currentId) => currentId || serviceData.services[0]?.id || "");
  }

  async function loadChecks(serviceId) {
    const data = await apiRequest(`/teams/${currentTeamId}/services/${serviceId}/checks`, { token });
    setChecks(data.checks);
  }

  async function loadMembers(teamId) {
    const data = await apiRequest(`/teams/${teamId}/members`, { token });
    setMembers(data.members);
  }

  async function loadInvitations(teamId) {
    const data = await apiRequest(`/teams/${teamId}/invitations`, { token });
    setInvitations(data.invitations);
  }

  function isSessionError(error) {
    return ["Invalid token", "User no longer exists", "Authentication required"].includes(error?.message);
  }

  function resetSession(nextMessage = "") {
    clearStoredAuth();
    setAuth(null);
    setTeams([]);
    setCurrentTeamId("");
    setServices([]);
    setIncidents([]);
    setChecks([]);
    setMembers([]);
    setTeamMetrics(emptyTeamMetrics);
    setInvitations([]);
    setSelectedServiceId("");
    setAuthMode("login");
    setRegisterMode("createTeam");
    setSocketState("offline");
    setMessage(nextMessage);
  }

  function handleRequestError(error) {
    if (isSessionError(error)) {
      resetSession("Session reset. Please log in again.");
      return;
    }

    setMessage(error.message || "Request failed.");
  }

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      const path = authMode === "register" ? "/auth/register" : "/auth/login";
      const body =
        authMode === "register"
          ? {
              name: authForm.name,
              email: authForm.email,
              password: authForm.password,
              ...(registerMode === "joinInvite"
                ? { inviteToken: authForm.inviteToken }
                : { teamName: authForm.teamName })
            }
          : { email: authForm.email, password: authForm.password };
      const data = await apiRequest(path, { method: "POST", body });
      const nextTeams = data.teams || [data.team];
      const nextAuth = { token: data.token, user: data.user, teams: nextTeams };

      saveStoredAuth(nextAuth);
      setAuth(nextAuth);
      setTeams(nextTeams);
      setCurrentTeamId(nextTeams[0]?.id || "");
      setAuthForm(emptyAuthForm);
      setRegisterMode("createTeam");
      setMessage(authMode === "register" ? "Account created." : "Signed in.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function createService(event) {
    event.preventDefault();

    if (!canMaintain) {
      setMessage("Your role can view services but cannot add them.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/services`, {
        method: "POST",
        token,
        body: {
          ...serviceForm,
          checkIntervalSeconds: Number(serviceForm.checkIntervalSeconds),
          timeoutMs: Number(serviceForm.timeoutMs)
        }
      });

      setServices((currentServices) => upsertById(currentServices, data.service));
      setSelectedServiceId(data.service.id);
      setServiceForm(emptyServiceForm);
      setMessage("Service added.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function runCheck(service) {
    if (!canMaintain) {
      setMessage("Your role can view checks but cannot run them.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/services/${service.id}/checks/run`, {
        method: "POST",
        token
      });

      setServices((currentServices) =>
        currentServices.map((item) => (item.id === data.service.id ? data.service : item))
      );
      setSelectedServiceId(data.service.id);
      await Promise.all([loadChecks(data.service.id), loadTeamData(currentTeamId)]);
      setMessage("Check recorded.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function createIncident(event) {
    event.preventDefault();

    if (!canMaintain) {
      setMessage("Your role can view incidents but cannot create them.");
      return;
    }

    if (!selectedServiceId) {
      setMessage("Select a service before creating an incident.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/incidents`, {
        method: "POST",
        token,
        body: {
          ...incidentForm,
          serviceId: selectedServiceId,
          assignedTo: incidentForm.assignedTo || undefined
        }
      });

      setIncidents((currentIncidents) => upsertById(currentIncidents, data.incident));
      setIncidentForm(emptyIncidentForm);
      setMessage("Incident created.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function resolveIncident(incident) {
    return updateIncident(incident, { status: "resolved" }, "Incident resolved.");
  }

  async function assignIncident(incident, assignedTo) {
    return updateIncident(
      incident,
      { assignedTo: assignedTo || null },
      assignedTo ? "Incident assigned." : "Incident unassigned."
    );
  }

  async function updateIncident(incident, body, successMessage) {
    if (!canMaintain) {
      setMessage("Your role can view incidents but cannot update them.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/incidents/${incident.id}`, {
        method: "PATCH",
        token,
        body
      });

      setIncidents((currentIncidents) =>
        currentIncidents.map((item) => (item.id === data.incident.id ? data.incident : item))
      );
      setMessage(successMessage);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function addIncidentTimelineEntry(incident, timelineMessage) {
    if (!canMaintain) {
      setMessage("Your role can view incident timelines but cannot add notes.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/incidents/${incident.id}/timeline`, {
        method: "POST",
        token,
        body: { message: timelineMessage }
      });

      setIncidents((currentIncidents) =>
        currentIncidents.map((item) => (item.id === data.incident.id ? data.incident : item))
      );
      setMessage("Timeline note added.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function inviteMember(event) {
    event.preventDefault();

    if (!isAdmin) {
      setMessage("Only admins can manage team members.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/invitations`, {
        method: "POST",
        token,
        body: memberForm
      });

      if (data.member) {
        setMembers((currentMembers) => upsertById(currentMembers, data.member));
        setMessage("Existing user added to team.");
      }

      if (data.invitation) {
        setInvitations((currentInvitations) => upsertById(currentInvitations, data.invitation));
        setMessage(`Invitation created. Share code: ${data.invitation.token}`);
      }

      setMemberForm(emptyMemberForm);
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function updateMemberRole(member, role) {
    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/members/${member.id}`, {
        method: "PATCH",
        token,
        body: { role }
      });

      setMembers((currentMembers) => upsertById(currentMembers, data.member));
      setMessage("Role updated.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  async function removeMember(member) {
    setBusy(true);
    setMessage("");

    try {
      await apiRequest(`/teams/${currentTeamId}/members/${member.id}`, {
        method: "DELETE",
        token
      });

      setMembers((currentMembers) => currentMembers.filter((item) => item.id !== member.id));
      setMessage("Team member removed.");
    } catch (error) {
      handleRequestError(error);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    resetSession("");
  }

  return {
    auth,
    authForm,
    authMode,
    addIncidentTimelineEntry,
    assignIncident,
    busy,
    canMaintain,
    chartChecks,
    checks,
    createIncident,
    createService,
    currentRole,
    currentTeam,
    currentTeamId,
    incidentForm,
    incidents,
    invitations,
    isAdmin,
    memberForm,
    members,
    message,
    removeMember,
    resolveIncident,
    runCheck,
    selectedService,
    selectedServiceId,
    serviceForm,
    services,
    setAuthForm,
    setAuthMode,
    setCurrentTeamId,
    setIncidentForm,
    setMemberForm,
    setSelectedServiceId,
    setServiceForm,
    setRegisterMode,
    signOut,
    socketState,
    submitAuth,
    summary,
    teamMetrics,
    teams,
    updateMemberRole,
    registerMode,
    inviteMember
  };
}
