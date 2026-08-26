"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";

import type {
  Service,
  ServiceStatus,
  Route,
  HttpMethod,
  User,
  UserRole,
  ApiKey,
  Project,
} from "./types";

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  helpers — map Prisma API shapes → frontend types
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toService(raw: any): Service {
  return {
    id: raw.id,
    name: raw.name,
    project_id: raw.projectId ?? null,
    base_url: raw.baseUrl,
    status: raw.healthy ? "healthy" : "down",
    created_at: raw.createdAt,
    route_count: raw.routes?.length ?? raw._count?.routes ?? 0,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toRoute(raw: any): Route {
  return {
    id: raw.id,
    path: raw.path,
    method: "GET" as HttpMethod, // routes don't have a method column in Prisma — default
    service_id: raw.serviceId,
    project_id: raw.service?.projectId ?? null,
    service_name: raw.service?.name ?? "",
    rate_limit: raw.rateLimit,
    is_active: true, // no active flag in Prisma schema — routes are always active if they exist
    created_at: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toUser(raw: any): User {
  return {
    id: raw.id,
    name: raw.name ?? "",
    email: raw.email,
    role: "developer" as UserRole, // no role column in Prisma — default
    key_count: raw.apiKeys?.length ?? 0,
    created_at: raw.createdAt,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toApiKey(raw: any): ApiKey {
  return {
    id: raw.id,
    label: raw.label,
    user_name: raw.user?.name ?? raw.user?.email ?? "Unknown user",
    key_preview: raw.key ? `${raw.key.slice(0, 12)}…` : "••••••••",
    user_id: raw.userId,
    is_active: raw.active,
    last_used_at: null,
    created_at: raw.createdAt,
  };
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Store shape
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

interface Store {
// state
  services: Service[];
  routes: Route[];
  users: User[];
  apiKeys: ApiKey[];
  projects: Project[];
  activeProjectId: string | null;
  setActiveProject: (id: string) => void;
  addProject: (draft: { name: string; description?: string }) => Promise<Project>;
  deleteProject: (id: string) => Promise<void>;
  loading: boolean;

  // services
  addService: (draft: { name: string; base_url: string; status: ServiceStatus }) => Promise<void>;
  updateService: (id: string, draft: Partial<{ name: string; base_url: string; status: ServiceStatus }>) => Promise<void>;
  deleteService: (id: string) => Promise<void>;

  // routes
  addRoute: (draft: { path: string; method: HttpMethod; service_id: string; is_active: boolean }) => Promise<void>;
  updateRoute: (id: string, draft: Partial<{ path: string; method: HttpMethod; service_id: string; is_active: boolean }>) => Promise<void>;
  deleteRoute: (id: string) => Promise<void>;

  // users
  addUser: (draft: { name: string; email: string; role: UserRole }) => Promise<void>;
  updateUser: (id: string, draft: Partial<{ name: string; email: string; role: UserRole }>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;

// api keys
  addApiKey: (draft: { label: string; user_id: string; is_active: boolean }) => Promise<string | null>;
  updateApiKey: (id: string, draft: Partial<{ is_active: boolean }>) => Promise<void>;
  deleteApiKey: (id: string) => Promise<void>;

  // refresh
  refresh: () => Promise<void>;
}

const StoreContext = createContext<Store | null>(null);

export function useStore(): Store {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Provider — fetches from API on mount, exposes CRUD operations
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */

export function StoreProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<Service[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── fetch all data ─────────────────────────────────────────────── */

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [projectRes, svcRes, routeRes, userRes, keyRes] = await Promise.all([
        fetch("/api/projects"),
        fetch("/api/services"),
        fetch("/api/routes"),
        fetch("/api/users"),
        fetch("/api/api-keys"),
      ]);

      if (projectRes.ok) {
        const data = await projectRes.json();
        const mappedProjects: Project[] = data.map((project: {
          id: string;
          name: string;
          description: string | null;
          orgId: string;
          createdAt: string;
          _count?: { services: number };
        }) => ({
          id: project.id,
          name: project.name,
          description: project.description,
          orgId: project.orgId,
          service_count: project._count?.services ?? 0,
          created_at: project.createdAt,
        }));
        setProjects(mappedProjects);
        setActiveProjectIdState((current) => {
          if (current && mappedProjects.some((project) => project.id === current)) return current;
          const saved = localStorage.getItem("activeProjectId");
          return saved && mappedProjects.some((project) => project.id === saved)
            ? saved
            : mappedProjects[0]?.id ?? null;
        });
      }

      if (svcRes.ok) {
        const data = await svcRes.json();
        setServices(data.map(toService));
      }
      if (routeRes.ok) {
        const data = await routeRes.json();
        setRoutes(data.map(toRoute));
      }
      if (userRes.ok) {
        const data = await userRes.json();
        setUsers(data.map(toUser));
      }
      if (keyRes.ok) {
        const data = await keyRes.json();
        if (Array.isArray(data)) setApiKeys(data.map(toApiKey));
      }
    } catch (err) {
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const setActiveProject = useCallback((id: string) => {
    setActiveProjectIdState(id);
    localStorage.setItem("activeProjectId", id);
  }, []);

  const addProject = useCallback(async (draft: { name: string; description?: string }) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to create project");
    const project: Project = {
      id: data.id,
      name: data.name,
      description: data.description,
          orgId: data.orgId,
      service_count: data._count?.services ?? 0,
      created_at: data.createdAt,
    };
    setProjects((previous) => [project, ...previous]);
    setActiveProject(project.id);
    return project;
  }, [setActiveProject]);

  const deleteProject = useCallback(async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Failed to delete project");
    setProjects((previous) => previous.filter((project) => project.id !== id));
    if (activeProjectId === id) {
      setActiveProjectIdState(null);
      localStorage.removeItem("activeProjectId");
    }
  }, [activeProjectId]);

  useEffect(() => {
    // Defer to a microtask so we don't call setState synchronously in the effect body
    const id = setTimeout(refresh, 0);
    return () => clearTimeout(id);
  }, [refresh]);

  /* ── services ───────────────────────────────────────────────────── */

  const addService = useCallback(
    async (draft: { name: string; base_url: string; status: ServiceStatus }) => {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          baseUrl: draft.base_url,
          ...(activeProjectId ? { projectId: activeProjectId } : {}),
        }),
      });
      if (!res.ok) throw new Error("Failed to create service");
      const raw = await res.json();
      setServices((prev) => [toService(raw), ...prev]);
    },
    [activeProjectId]
  );

  const updateService = useCallback(
    async (
      id: string,
      draft: Partial<{ name: string; base_url: string; status: ServiceStatus }>
    ) => {
      const body: Record<string, unknown> = {};
      if (draft.name !== undefined) body.name = draft.name;
      if (draft.base_url !== undefined) body.baseUrl = draft.base_url;
      if (draft.status !== undefined) body.healthy = draft.status === "healthy";

      const res = await fetch(`/api/services/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update service");
      const raw = await res.json();
      setServices((prev) =>
        prev.map((s) => (s.id === id ? toService(raw) : s))
      );
    },
    []
  );

  const deleteService = useCallback(async (id: string) => {
    const res = await fetch(`/api/services/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete service");
    setServices((prev) => prev.filter((s) => s.id !== id));
    // cascade: remove routes that belonged to this service
    setRoutes((prev) => prev.filter((r) => r.service_id !== id));
  }, []);

  /* ── routes ─────────────────────────────────────────────────────── */

  const addRoute = useCallback(
    async (draft: { path: string; method: HttpMethod; service_id: string; is_active: boolean }) => {
      const res = await fetch("/api/routes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: draft.path,
          serviceId: draft.service_id,
        }),
      });
      if (!res.ok) throw new Error("Failed to create route");
      const raw = await res.json();
      setRoutes((prev) => [toRoute(raw), ...prev]);
      // increment service route count
      setServices((prev) =>
        prev.map((s) =>
          s.id === draft.service_id
            ? { ...s, route_count: s.route_count + 1 }
            : s
        )
      );
    },
    []
  );

  const updateRoute = useCallback(
    async (
      id: string,
      draft: Partial<{ path: string; method: HttpMethod; service_id: string; is_active: boolean }>
    ) => {
      const body: Record<string, unknown> = {};
      if (draft.path !== undefined) body.path = draft.path;
      if (draft.service_id !== undefined) body.serviceId = draft.service_id;

      const res = await fetch(`/api/routes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update route");
      const raw = await res.json();
      setRoutes((prev) =>
        prev.map((r) => (r.id === id ? { ...toRoute(raw), ...draft } : r))
      );
    },
    []
  );

  const deleteRoute = useCallback(async (id: string) => {
    const route = routes.find((r) => r.id === id);
    const res = await fetch(`/api/routes/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete route");
    setRoutes((prev) => prev.filter((r) => r.id !== id));
    // decrement service route count
    if (route) {
      setServices((prev) =>
        prev.map((s) =>
          s.id === route.service_id
            ? { ...s, route_count: Math.max(0, s.route_count - 1) }
            : s
        )
      );
    }
  }, [routes]);

  /* ── users ──────────────────────────────────────────────────────── */

  const addUser = useCallback(
    async (draft: { name: string; email: string; role: UserRole }) => {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name,
          email: draft.email,
        }),
      });
      if (!res.ok) throw new Error("Failed to create user");
      const raw = await res.json();
      setUsers((prev) => [toUser(raw), ...prev]);
    },
    []
  );

  const updateUser = useCallback(
    async (
      id: string,
      draft: Partial<{ name: string; email: string; role: UserRole }>
    ) => {
      const body: Record<string, unknown> = {};
      if (draft.name !== undefined) body.name = draft.name;
      if (draft.email !== undefined) body.email = draft.email;

      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update user");
      const raw = await res.json();
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? toUser(raw) : u))
      );
    },
    []
  );

  const deleteUser = useCallback(async (id: string) => {
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete user");
    setUsers((prev) => prev.filter((u) => u.id !== id));
    // cascade: remove api keys that belonged to this user
    setApiKeys((prev) => prev.filter((k) => k.user_id !== id));
  }, []);

  /* ── api keys ───────────────────────────────────────────────────── */

  const addApiKey = useCallback(
    async (draft: { label: string; user_id: string; is_active: boolean }): Promise<string | null> => {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: draft.user_id,
          label: draft.label,
        }),
      });
      if (!res.ok) throw new Error("Failed to create API key");
      const data = await res.json();
      // data.apiKey is the raw key — shown once
      // re-fetch keys to get the updated list
      await refresh();
      return data.apiKey ?? null;
    },
    [refresh]
  );

  const updateApiKey = useCallback(
    async (id: string, draft: Partial<{ is_active: boolean }>) => {
      const body: Record<string, unknown> = {};
      if (draft.is_active !== undefined) body.active = draft.is_active;

      const res = await fetch(`/api/api-keys/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Failed to update API key");
      setApiKeys((prev) =>
        prev.map((k) =>
          k.id === id ? { ...k, is_active: draft.is_active ?? k.is_active } : k
        )
      );
    },
    []
  );

  const deleteApiKey = useCallback(async (id: string) => {
    const res = await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete API key");
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  /* ── context value ──────────────────────────────────────────────── */

  const value: Store = {
    services: activeProjectId ? services.filter((service) => service.project_id === activeProjectId) : services,
    routes: activeProjectId ? routes.filter((route) => route.project_id === activeProjectId) : routes,
    users,
    apiKeys,
    projects,
    activeProjectId,
    setActiveProject,
    addProject,
    deleteProject,
    loading,
    addService,
    updateService,
    deleteService,
    addRoute,
    updateRoute,
    deleteRoute,
    addUser,
    updateUser,
    deleteUser,
    addApiKey,
    updateApiKey,
    deleteApiKey,
    refresh,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}