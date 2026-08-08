import { ApiKey, Route, Service, User } from "./types";

export const seedServices: Service[] = [
  {
    id: "svc_users",
    name: "users-service",
    base_url: "http://localhost:4001",
    status: "healthy",
    created_at: "2026-06-02T09:12:00Z",
  },
  {
    id: "svc_billing",
    name: "billing-service",
    base_url: "http://localhost:4002",
    status: "healthy",
    created_at: "2026-06-04T14:30:00Z",
  },
  {
    id: "svc_notify",
    name: "notifications-service",
    base_url: "http://localhost:4003",
    status: "degraded",
    created_at: "2026-06-10T11:05:00Z",
  },
  {
    id: "svc_search",
    name: "search-service",
    base_url: "http://localhost:4004",
    status: "down",
    created_at: "2026-06-18T08:47:00Z",
  },
];

export const seedRoutes: Route[] = [
  { id: "rt_1", path: "/api/users", method: "GET", service_id: "svc_users", is_active: true, created_at: "2026-06-03T10:00:00Z" },
  { id: "rt_2", path: "/api/users/:id", method: "GET", service_id: "svc_users", is_active: true, created_at: "2026-06-03T10:02:00Z" },
  { id: "rt_3", path: "/api/users", method: "POST", service_id: "svc_users", is_active: true, created_at: "2026-06-03T10:03:00Z" },
  { id: "rt_4", path: "/api/billing/invoices", method: "GET", service_id: "svc_billing", is_active: true, created_at: "2026-06-05T09:20:00Z" },
  { id: "rt_5", path: "/api/billing/charge", method: "POST", service_id: "svc_billing", is_active: true, created_at: "2026-06-05T09:25:00Z" },
  { id: "rt_6", path: "/api/notify/send", method: "POST", service_id: "svc_notify", is_active: false, created_at: "2026-06-11T13:00:00Z" },
  { id: "rt_7", path: "/api/search", method: "GET", service_id: "svc_search", is_active: true, created_at: "2026-06-19T16:40:00Z" },
];

export const seedUsers: User[] = [
  { id: "usr_1", name: "Priya Nair", email: "priya@edgeworks.dev", role: "admin", created_at: "2026-05-20T08:00:00Z" },
  { id: "usr_2", name: "Marcus Webb", email: "marcus@edgeworks.dev", role: "developer", created_at: "2026-05-22T10:15:00Z" },
  { id: "usr_3", name: "Sara Kim", email: "sara@edgeworks.dev", role: "viewer", created_at: "2026-06-01T12:30:00Z" },
];

export const seedApiKeys: ApiKey[] = [
  { id: "key_1", label: "local dev", key_preview: "gw_live_4f2a...9c1d", user_id: "usr_1", is_active: true, last_used_at: "2026-08-07T22:10:00Z", created_at: "2026-05-20T08:05:00Z" },
  { id: "key_2", label: "ci pipeline", key_preview: "gw_live_8b31...e04f", user_id: "usr_2", is_active: true, last_used_at: "2026-08-06T04:45:00Z", created_at: "2026-05-23T09:00:00Z" },
  { id: "key_3", label: "old staging key", key_preview: "gw_test_1a90...77bc", user_id: "usr_3", is_active: false, last_used_at: null, created_at: "2026-06-02T15:20:00Z" },
];
