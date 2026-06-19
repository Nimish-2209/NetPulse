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
  description: ""
};

const emptyMemberForm = {
  email: "",
  role: "viewer"
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
      openIncidents: incidents.filter((incident) => incident.status !== "resolved").length
    }),
    [incidents, services]
  );

  useEffect(() => {
    const storedAuth = getStoredAuth();

    if (storedAuth?.token) {
      setAuth(storedAuth);
      loadSession(storedAuth.token);
    }
  }, []);

  useEffect(() => {
    selectedServiceIdRef.current = selectedServiceId;
  }, [selectedServiceId]);

  useEffect(() => {
    if (token && currentTeamId) {
      loadTeamData(currentTeamId);
    }
  }, [token, currentTeamId]);

  useEffect(() => {
    if (token && currentTeamId && selectedServiceId) {
      loadChecks(selectedServiceId);
    }
  }, [token, currentTeamId, selectedServiceId]);

  useEffect(() => {
    if (token && currentTeamId && isAdmin) {
      loadMembers(currentTeamId);
      loadInvitations(currentTeamId);
    } else {
      setMembers([]);
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
    const [serviceData, incidentData] = await Promise.all([
      apiRequest(`/teams/${teamId}/services`, { token }),
      apiRequest(`/teams/${teamId}/incidents`, { token })
    ]);

    setServices(serviceData.services);
    setIncidents(incidentData.incidents);
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
      setMessage(error.message);
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
      setMessage(error.message);
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
      setMessage(error.message);
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
          serviceId: selectedServiceId
        }
      });

      setIncidents((currentIncidents) => upsertById(currentIncidents, data.incident));
      setIncidentForm(emptyIncidentForm);
      setMessage("Incident created.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function resolveIncident(incident) {
    if (!canMaintain) {
      setMessage("Your role can view incidents but cannot resolve them.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const data = await apiRequest(`/teams/${currentTeamId}/incidents/${incident.id}`, {
        method: "PATCH",
        token,
        body: { status: "resolved" }
      });

      setIncidents((currentIncidents) =>
        currentIncidents.map((item) => (item.id === data.incident.id ? data.incident : item))
      );
      setMessage("Incident resolved.");
    } catch (error) {
      setMessage(error.message);
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
      setMessage(error.message);
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
      setMessage(error.message);
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
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  function signOut() {
    clearStoredAuth();
    setAuth(null);
    setTeams([]);
    setCurrentTeamId("");
    setServices([]);
    setIncidents([]);
    setChecks([]);
    setInvitations([]);
    setSelectedServiceId("");
    setMessage("");
  }

  return {
    auth,
    authForm,
    authMode,
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
    teams,
    updateMemberRole,
    registerMode,
    inviteMember
  };
}
