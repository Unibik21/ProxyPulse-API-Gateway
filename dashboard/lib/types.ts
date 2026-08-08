export type ServiceStatus = "healthy" | "degraded" | "down";

export interface Service {
  id: string;
  name: string;
  base_url: string;
  status: ServiceStatus;
  created_at: string;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Route {
  id: string;
  path: string;
  method: HttpMethod;
  service_id: string;
  is_active: boolean;
  created_at: string;
}

export type UserRole = "admin" | "developer" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export interface ApiKey {
  id: string;
  label: string;
  key_preview: string;
  user_id: string;
  is_active: boolean;
  last_used_at: string | null;
  created_at: string;
}
