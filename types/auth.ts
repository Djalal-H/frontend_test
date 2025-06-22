export interface User {
  uuid: string;
  phone: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  has_van: boolean;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface LoginRequest {
  phone: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

declare module "next-auth" {
  interface Session {
    access?: string;
    refresh?: string;
    user?: any;
    error?: string;
  }

  interface User {
    access?: string;
    refresh?: string;
    user?: any;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access?: string;
    refresh?: string;
    user?: any;
    error?: string;
  }
}
