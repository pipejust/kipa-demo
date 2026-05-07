export type UserRole = 'admin' | 'staff' | 'family' | 'owner' | string;

export interface AuthTenant {
  id: string;
  slug: string;
  name: string;
}

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  status: string;
}

export interface AuthMeResponse {
  user: AuthUser;
  tenant: AuthTenant;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenant_slug: string;
  remember_me?: boolean;
}

export interface PasswordForgotRequest {
  email: string;
  tenant_slug: string;
}

export interface PasswordResetRequest {
  token: string;
  new_password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}
