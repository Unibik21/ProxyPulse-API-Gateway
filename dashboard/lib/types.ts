/* ─── Frontend-facing types ──────────────────────────────────────────
 *
 *  These mirror the Prisma models but use the naming conventions the
 *  UI components already expect (snake_case fields, status enums, etc.).
 *
 *  The store layer maps the Prisma/API response shape → these types.
 * ───────────────────────────────────────────────────────────────────── */

// ── Services ────────────────────────────────────────────────────────

export type ServiceStatus = "healthy" | "degraded" | "down";

export interface Service {
  id: string;
  name: string;
  base_url: string;
  status: ServiceStatus;
  created_at: string;       // ISO date
  route_count: number;
}

// ── Routes ──────────────────────────────────────────────────────────

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Route {
  id: string;
  path: string;
  method: HttpMethod;       // UI shows single method per row
  service_id: string;
  service_name: string;
  rate_limit: number | null;
  is_active: boolean;
  created_at: string;
}

// ── Users ───────────────────────────────────────────────────────────

export type UserRole = "admin" | "developer" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  key_count: number;
  created_at: string;
}

// ── API Keys ────────────────────────────────────────────────────────

export interface ApiKey {
  id: string;
  label: string;
  key_preview: string;      // first 12 chars, e.g. "gk_a1b2c3d4…"
  user_id: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}
