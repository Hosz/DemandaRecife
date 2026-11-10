const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_ID_KEY = "user_id";
const USER_NAME_KEY = "user_name";
const USER_EMAIL_KEY = "user_email";
const TENANT_ID_KEY = "tenant_id";

export type AuthUser = {
  userId: string;
  nome: string;
  email: string;
  tenantId?: string | null;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  userId?: string;
  tenantId?: string | null;
  nome?: string;
  email?: string;
};

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getTenantId(): string | null {
  if (typeof window === "undefined") return null;
  const tid = localStorage.getItem(TENANT_ID_KEY);
  if (!tid || tid === "null" || tid === "undefined") return null;
  return tid;
}

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const userId = localStorage.getItem(USER_ID_KEY);
  const nome = localStorage.getItem(USER_NAME_KEY);
  const email = localStorage.getItem(USER_EMAIL_KEY);
  const tenantId = getTenantId();

  if (!userId && !nome && !email) return null;

  return {
    userId: userId ?? "",
    nome: nome ?? "",
    email: email ?? "",
    tenantId,
  };
}

export function isAuthenticated(): boolean {
  return Boolean(getAccessToken());
}

export function saveAuthSession(session: AuthSession) {
  if (typeof window === "undefined") return;

  if (session.accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  if (session.userId) localStorage.setItem(USER_ID_KEY, session.userId);
  if (session.nome) localStorage.setItem(USER_NAME_KEY, session.nome);
  if (session.email) localStorage.setItem(USER_EMAIL_KEY, session.email);
  if (session.tenantId !== undefined) {
    if (session.tenantId && session.tenantId !== "null") {
      localStorage.setItem(TENANT_ID_KEY, session.tenantId);
    } else {
      localStorage.removeItem(TENANT_ID_KEY);
    }
  }
}

export function clearAuthSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(USER_ID_KEY);
  localStorage.removeItem(USER_NAME_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(TENANT_ID_KEY);
}

export function redirectToLogin() {
  clearAuthSession();
  if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
    window.location.replace("/login");
  }
}

export function withAuth(init: RequestInit = {}): RequestInit {
  const token = getAccessToken();

  if (!token) return init;

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);

  return { ...init, headers };
}
