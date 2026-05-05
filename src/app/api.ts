import type { AppState } from "./types";

const API_BASE = "/api";

export function getToken() {
  return localStorage.getItem("smartdorm_token") || "";
}

export function setToken(token: string) {
  if (token) {
    localStorage.setItem("smartdorm_token", token);
  } else {
    localStorage.removeItem("smartdorm_token");
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (credentials: any) =>
      fetchWithAuth("/auth/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      }),
    me: () => fetchWithAuth("/auth/me"),
    changePassword: (data: any) =>
      fetchWithAuth("/auth/change-password", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  users: {
    list: () => fetchWithAuth("/users"),
    update: (id: string, data: any) =>
      fetchWithAuth(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchWithAuth(`/users/${id}`, { method: "DELETE" }),
    create: (data: any) =>
      fetchWithAuth("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
  rooms: {
    list: () => fetchWithAuth("/rooms"),
    create: (data: any) =>
      fetchWithAuth("/rooms", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth(`/rooms/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchWithAuth(`/rooms/${id}`, { method: "DELETE" }),
  },
  bills: {
    list: () => fetchWithAuth("/bills"),
    create: (data: any) =>
      fetchWithAuth("/bills", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: any) =>
      fetchWithAuth(`/bills/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) => fetchWithAuth(`/bills/${id}`, { method: "DELETE" }),
  },
  maintenance: {
    list: () => fetchWithAuth("/maintenance"),
    create: (data: any) =>
      fetchWithAuth("/maintenance", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchWithAuth(`/maintenance/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchWithAuth(`/maintenance/${id}`, { method: "DELETE" }),
  },
  announcements: {
    list: () => fetchWithAuth("/announcements"),
    create: (data: any) =>
      fetchWithAuth("/announcements", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      fetchWithAuth(`/announcements/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      fetchWithAuth(`/announcements/${id}`, { method: "DELETE" }),
  },
};

export async function fetchAppState(
  role: "admin" | "tenant",
): Promise<AppState> {
  const [rooms, announcements, bills, maintenanceRequests] = await Promise.all([
    api.rooms.list(),
    api.announcements.list(),
    api.bills.list(),
    api.maintenance.list(),
  ]);

  let users = [];
  if (role === "admin") {
    users = await api.users.list();
  }

  return {
    users,
    rooms,
    announcements,
    bills,
    maintenanceRequests,
  };
}
