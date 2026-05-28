import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { kvGet, kvSet } from "./storage";

export type UserRole = "admin" | "editor" | "viewer";

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

// Admin hardcoded — sempre disponível mesmo sem KV
const HARDCODED_ADMIN: User = {
  id: "admin-1",
  email: "suporte@jamesolaya.com.br",
  name: "James Olaya",
  role: "admin",
  passwordHash: "",
  createdAt: "2026-05-28T00:00:00.000Z",
};

async function getAdminHash(): Promise<string> {
  if (!HARDCODED_ADMIN.passwordHash) {
    HARDCODED_ADMIN.passwordHash = await bcrypt.hash("@Suporte123", 10);
  }
  return HARDCODED_ADMIN.passwordHash;
}

async function readUsers(): Promise<User[]> {
  const users = (await kvGet<User[]>(USERS_KEY)) || [];
  // Garante que o admin hardcoded sempre existe na lista
  if (!users.find((u) => u.id === HARDCODED_ADMIN.id)) {
    const adminWithHash = {
      ...HARDCODED_ADMIN,
      passwordHash: await getAdminHash(),
    };
    users.unshift(adminWithHash);
  }
  return users;
}

async function writeUsers(users: User[]): Promise<void> {
  await kvSet(USERS_KEY, users);
}

export async function ensureAdminUser(): Promise<void> {
  const users = await readUsers();
  if (!users.find((u) => u.id === HARDCODED_ADMIN.id)) {
    users.unshift({
      ...HARDCODED_ADMIN,
      passwordHash: await getAdminHash(),
    });
    await writeUsers(users);
  }
}

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

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("Não autenticado");
  if (user.role !== "admin") throw new Error("Acesso negado: precisa ser admin");
  return user;
}

export async function signIn(
  email: string,
  password: string
): Promise<{ ok: true; user: SessionUser } | { ok: false; error: string }> {
  const users = await readUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user) return { ok: false, error: "Email ou senha incorretos" };

  // Pro admin hardcoded, garante hash atualizado
  if (user.id === HARDCODED_ADMIN.id && !user.passwordHash) {
    user.passwordHash = await getAdminHash();
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
