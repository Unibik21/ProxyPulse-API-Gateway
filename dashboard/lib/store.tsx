"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { ApiKey, Route, Service, User } from "./types";
import { seedApiKeys, seedRoutes, seedServices, seedUsers } from "./seed";

const STORAGE_KEY = "gateway-dashboard-state-v1";

interface State {
  services: Service[];
  routes: Route[];
  users: User[];
  apiKeys: ApiKey[];
}

interface StoreValue extends State {
  addService: (s: Omit<Service, "id" | "created_at">) => void;
  updateService: (id: string, s: Partial<Service>) => void;
  deleteService: (id: string) => void;

  addRoute: (r: Omit<Route, "id" | "created_at">) => void;
  updateRoute: (id: string, r: Partial<Route>) => void;
  deleteRoute: (id: string) => void;

  addUser: (u: Omit<User, "id" | "created_at">) => void;
  updateUser: (id: string, u: Partial<User>) => void;
  deleteUser: (id: string) => void;

  addApiKey: (k: Omit<ApiKey, "id" | "created_at" | "key_preview" | "last_used_at">) => void;
  updateApiKey: (id: string, k: Partial<ApiKey>) => void;
  deleteApiKey: (id: string) => void;

  resetToSeed: () => void;
  isMock: true;
}

const StoreContext = createContext<StoreValue | null>(null);

function makeId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function loadInitial(): State {
  if (typeof window === "undefined") {
    return { services: seedServices, routes: seedRoutes, users: seedUsers, apiKeys: seedApiKeys };
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as State;
  } catch {
    // fall through to seed
  }
  return { services: seedServices, routes: seedRoutes, users: seedUsers, apiKeys: seedApiKeys };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(() => ({
    services: seedServices,
    routes: seedRoutes,
    users: seedUsers,
    apiKeys: seedApiKeys,
  }));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadInitial());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  const value = useMemo<StoreValue>(
    () => ({
      ...state,
      isMock: true,

      addService: (s) =>
        setState((prev) => ({
          ...prev,
          services: [...prev.services, { ...s, id: makeId("svc"), created_at: new Date().toISOString() }],
        })),
      updateService: (id, s) =>
        setState((prev) => ({
          ...prev,
          services: prev.services.map((x) => (x.id === id ? { ...x, ...s } : x)),
        })),
      deleteService: (id) =>
        setState((prev) => ({
          ...prev,
          services: prev.services.filter((x) => x.id !== id),
          routes: prev.routes.filter((r) => r.service_id !== id),
        })),

      addRoute: (r) =>
        setState((prev) => ({
          ...prev,
          routes: [...prev.routes, { ...r, id: makeId("rt"), created_at: new Date().toISOString() }],
        })),
      updateRoute: (id, r) =>
        setState((prev) => ({
          ...prev,
          routes: prev.routes.map((x) => (x.id === id ? { ...x, ...r } : x)),
        })),
      deleteRoute: (id) =>
        setState((prev) => ({ ...prev, routes: prev.routes.filter((x) => x.id !== id) })),

      addUser: (u) =>
        setState((prev) => ({
          ...prev,
          users: [...prev.users, { ...u, id: makeId("usr"), created_at: new Date().toISOString() }],
        })),
      updateUser: (id, u) =>
        setState((prev) => ({
          ...prev,
          users: prev.users.map((x) => (x.id === id ? { ...x, ...u } : x)),
        })),
      deleteUser: (id) =>
        setState((prev) => ({
          ...prev,
          users: prev.users.filter((x) => x.id !== id),
          apiKeys: prev.apiKeys.filter((k) => k.user_id !== id),
        })),

      addApiKey: (k) =>
        setState((prev) => ({
          ...prev,
          apiKeys: [
            ...prev.apiKeys,
            {
              ...k,
              id: makeId("key"),
              key_preview: `gw_live_${Math.random().toString(16).slice(2, 6)}...${Math.random()
                .toString(16)
                .slice(2, 6)}`,
              last_used_at: null,
              created_at: new Date().toISOString(),
            },
          ],
        })),
      updateApiKey: (id, k) =>
        setState((prev) => ({
          ...prev,
          apiKeys: prev.apiKeys.map((x) => (x.id === id ? { ...x, ...k } : x)),
        })),
      deleteApiKey: (id) =>
        setState((prev) => ({ ...prev, apiKeys: prev.apiKeys.filter((x) => x.id !== id) })),

      resetToSeed: () =>
        setState({ services: seedServices, routes: seedRoutes, users: seedUsers, apiKeys: seedApiKeys }),
    }),
    [state]
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
