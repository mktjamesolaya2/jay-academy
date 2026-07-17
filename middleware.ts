import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "jayacademy-dev-secret-change-in-production-please"
);

// Áreas internas do portal — SÓ essas exigem login.
// Todo o resto é público: /, /login, /cadastro, /p/, /f/, /api/*, sub-projetos
// e — importante — qualquer slug raiz (páginas publicadas: /metodo-fio-a-fio).
// Isso permite servir as páginas no domínio próprio SEM o /p/, batendo
// exatamente as URLs que já existem nos anúncios.
const ADMIN_PREFIXES = [
  "/dashboard",
  "/analytics",
  "/forms",
  "/leads",
  "/lixeira",
  "/lps",
  "/midia",
  "/paginas",
  "/settings",
  "/sugestoes",
  "/websites",
  "/wordpress",
  "/wp-pages",
];

function needsAuth(pathname: string): boolean {
  return ADMIN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Estáticos/infra + tudo que não é área admin = liberado (público)
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".") ||
    !needsAuth(pathname)
  ) {
    return NextResponse.next();
  }

  // Verifica cookie
  const token = req.cookies.get("jay_session")?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  // Valida token
  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    const res = NextResponse.redirect(url);
    res.cookies.delete("jay_session");
    return res;
  }
}

export const config = {
  matcher: [
    /*
     * Match todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagem)
     * - favicon.ico
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
