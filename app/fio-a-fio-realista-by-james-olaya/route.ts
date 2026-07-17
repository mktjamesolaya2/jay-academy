import { serveLp } from "@/lib/serve-lp";

// Fio a Fio Realista — servida no MESMO slug do WordPress (o portal vai
// substituir o site). Os slugs antigos (/metodo-fio-a-fio-by-james-olaya e
// /fio-a-fio-realista) redirecionam pra cá. de-lazy + tracking via serveLp().
export const dynamic = "force-static";

export function GET(req: Request) {
  return serveLp(req, { file: "fio-a-fio-realista-by-james-olaya.html", delazy: true });
}
