import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { kvGet, kvSet } from "./storage";

export type UserRole = "senior" | "admin" | "viewer";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "jayacademy-dev-secret-change-in-production-please"
);
const COOKIE_NAME = "jay_session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 dias
const USERS_KEY = "users:all";

const SENIOR_EMAIL = "suporte@jamesolaya.com.br";

// Senior hardcoded — sempre disponível mesmo sem KV. Único papel que pode
// gerenciar outros usuários.
const HARDCODED_SENIOR: User = {
  id: "admin-1",
  email: SENIOR_EMAIL,
  name: "James Olaya",
  role: "senior",
  passwordHash: "",
  createdAt: "2026-05-28T00:00:00.000Z",
};

async function getSeniorHash(): Promise<string> {
  if (!HARDCODED_SENIOR.passwordHash) {
    HARDCODED_SENIOR.passwordHash = await bcrypt.hash("@Suporte123", 10);
  }
  return HARDCODED_SENIOR.passwordHash;
}

async function readUsers(): Promise<User[]> {
  const users = (await kvGet<User[]>(USERS_KEY)) || [];
  // Garante que o senior hardcoded sempre existe e tem o role correto
  const seniorIdx = users.findIndex((u) => u.id === HARDCODED_SENIOR.id);
  if (seniorIdx === -1) {
    users.unshift({
      ...HARDCODED_SENIOR,
      passwordHash: await getSeniorHash(),
    });
  } else if (users[seniorIdx].role !== "senior") {
    // Migration: força o user hardcoded como senior caso role tenha ficado antigo
    users[seniorIdx] = { ...users[seniorIdx], role: "senior" };
  }
  // Migration: roles legados ("editor") viram "admin"; demais usuários ficam
  // como estão. Se algum outro user estiver marcado como senior por engano,
  // rebaixa pra admin — senior é exclusivo do email hardcoded.
  for (let i = 0; i < users.length; i++) {
    const u = users[i];
    if (u.id !== HARDCODED_SENIOR.id) {
      const legacyAsAny = u.role as string;
      if (legacyAsAny === "editor") users[i] = { ...u, role: "admin" };
      else if (u.role === "senior") users[i] = { ...u, role: "admin" };
    }
  }
  return users;
}

async function writeUsers(users: User[]): Promise<void> {
  await kvSet(USERS_KEY, users);
}

export async function ensureSeniorUser(): Promise<void> {
  const users = await readUsers();
  await writeUsers(users);
}

// Aliases pra compatibilidade com código existente
export const ensureAdminUser = ensureSeniorUser;

async function createToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SECRET);
}

async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    if (
      typeof payload.id === "string" &&
      typeof payload.email === "string" &&
      typeof payload.name === "string" &&
      typeof payload.role === "string"
    ) {
      return {
        id: payload.id,
        email: payload.email,
        name: payload.name,
        role: payload.role as UserRole,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return await verifyToken(token);
}

/** Senior OU admin podem editar/criar/excluir. Viewer não. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  if (user.role !== "admin" && user.role !== "senior") {
    throw new Error("Acesso negado: precisa ser admin");
  }
  return user;
}

/** Apenas senior. Para gestão de usuários, atribuição de roles, exclusão de perfis. */
export async function requireSenior(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  if (user.role !== "senior") {
    throw new Error("Acesso negado: apenas o senior pode fazer isso");
  }
  return user;
}

/** Pure helpers — não tocam em cookie, podem rodar em qualquer lugar. */
export function canEdit(user: SessionUser | null): boolean {
  return user?.role === "admin" || user?.role === "senior";
}
export function isSenior(user: SessionUser | null): boolean {
  return user?.role === "senior";
}
export function isViewer(user: SessionUser | null): boolean {
  return user?.role === "viewer";
}

/** Lista todos usuários (apenas senior chama). Não retorna passwordHash. */
export async function listUsers(): Promise<Omit<User, "passwordHash">[]> {
  await requireSenior();
  const users = await readUsers();
  return users.map(({ passwordHash: _ph, ...rest }) => rest);
}

/** Senior promove/rebaixa role de outro usuário (admin ↔ viewer). */
export async function setUserRole(
  userId: string,
  role: "admin" | "viewer"
): Promise<{ ok: boolean; error?: string }> {
  await requireSenior();
  if (userId === HARDCODED_SENIOR.id) {
    return { ok: false, error: "Não dá pra mudar o role do senior" };
  }
  const users = await readUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return { ok: false, error: "Usuário não encontrado" };
  users[idx] = { ...users[idx], role };
  await writeUsers(users);
  return { ok: true };
}

/** Senior remove um usuário. Não pode remover a si mesmo. */
export async function deleteUser(
  userId: string
): Promise<{ ok: boolean; error?: string }> {
  await requireSenior();
  if (userId === HARDCODED_SENIOR.id) {
    return { ok: false, error: "Não dá pra excluir o senior" };
  }
  const users = await readUsers();
  const next = users.filter((u) => u.id !== userId);
  if (next.length === users.length) {
    return { ok: false, error: "Usuário não encontrado" };
  }
  await writeUsers(next);
  return { ok: true };
}

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const users = await readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: "Email ou senha incorretos" };

  // Pro admin hardcoded, garante hash atualizado
  if (user.id === HARDCODED_SENIOR.id && !user.passwordHash) {
    user.passwordHash = await getSeniorHash();
  }

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return { ok: false, error: "Email ou senha incorretos" };

  const sessionUser: SessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };

  const token = await createToken(sessionUser);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return { ok: true, user: sessionUser };
}

export async function signUp(
  name: string,
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  if (!name.trim()) return { ok: false, error: "Nome é obrigatório" };
  if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/))
    return { ok: false, error: "Email inválido" };
  if (password.length < 6)
    return { ok: false, error: "Senha precisa ter no mínimo 6 caracteres" };

  const users = await readUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return { ok: false, error: "Já existe uma conta com esse email" };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser: User = {
    id: "user-" + Math.random().toString(36).slice(2, 10),
    email,
    name,
    role: "viewer",
    passwordHash,
    createdAt: new Date().toISOString(),
  };
  users.push(newUser);
  await writeUsers(users);

  const sessionUser: SessionUser = {
    id: newUser.id,
    email: newUser.email,
    name: newUser.name,
    role: newUser.role,
  };

  const token = await createToken(sessionUser);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });

  return { ok: true, user: sessionUser };
}

export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
