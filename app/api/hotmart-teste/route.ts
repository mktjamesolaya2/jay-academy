import { NextResponse } from "next/server";
import { canEdit, getCurrentUser } from "@/lib/auth";
import { testarCredenciais, vendasDoEmail } from "@/lib/hotmart-api";

/**
 * Confere se as credenciais da Hotmart funcionam.
 *
 * ⚠️ Existe porque as credenciais só vivem na Vercel — não dá pra testar da
 * máquina do dev. O James abre esta URL logado e me conta o que apareceu.
 *
 * Exige login de admin: mesmo sendo só leitura, `?email=` devolve compra de
 * cliente, e isso não pode ficar aberto na internet.
 */

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return NextResponse.json({ error: "Precisa estar logado" }, { status: 403 });
  }

  // ⚠️ Só ESCOLHE qual jogo de credenciais usar — o segredo continua em
  // variável de ambiente. Aceitar credencial pela URL deixaria o client_secret
  // gravado no log de acesso.
  const url0 = new URL(req.url);
  const jogo = url0.searchParams.get("cred") === "2" ? "segunda" : "principal";

  const teste = await testarCredenciais(jogo);
  if (!teste.ok) {
    return NextResponse.json(
      {
        credenciais: "NÃO funcionaram",
        motivo: teste.erro,
        formato: teste.formato,
        tentativas: teste.tentativas,
      },
      { status: 200 }
    );
  }

  if (url0.searchParams.get("sondar") === "1") {
    const { sondar } = await import("@/lib/hotmart-sonda");
    return NextResponse.json({
      aviso: "Só leitura — nada foi executado na sua conta.",
      dica: "Pros endereços do Club, acrescente &subdomain=<o-nome-da-area-de-membros>",
      credencial: jogo,
      achados: await sondar(url0.searchParams.get("subdomain") ?? undefined, jogo),
    });
  }

  if (url0.searchParams.get("assinaturas") === "1") {
    const alvo = url0.searchParams.get("email");
    if (!alvo) {
      return NextResponse.json(
        { error: "Use ?assinaturas=1&email=alguem@email.com" },
        { status: 400 }
      );
    }
    const { sondarAssinaturas } = await import("@/lib/hotmart-sonda");
    return NextResponse.json({
      aviso: "Só leitura. Mostra apenas QUANTOS itens vieram, nunca o conteúdo.",
      email: alvo,
      tentativas: await sondarAssinaturas(alvo, jogo),
    });
  }

  if (url0.searchParams.get("permissoes") === "1") {
    const { permissoesDoToken } = await import("@/lib/hotmart-sonda");
    return NextResponse.json({
      aviso: "O token em si NÃO aparece aqui — só o que ele diz que pode fazer.",
      credencial: jogo,
      ...(await permissoesDoToken(jogo)),
    });
  }

  if (url0.searchParams.get("sondarvendas") === "1") {
    // ⚠️ Aceita `protocolo` além de `email`: quando o caso vem de uma conversa
    // ("o protocolo EF03D5 deu erro"), quem está diagnosticando não tem o
    // e-mail na mão — ele está lá dentro. Sem isso, o caminho era abrir a
    // transcrição, copiar o e-mail e montar outra URL.
    const protocolo = (url0.searchParams.get("protocolo") ?? "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
    let alvo = url0.searchParams.get("email");

    if (!alvo && protocolo) {
      const [{ listarConversas }, { protocoloDe }] = await Promise.all([
        import("@/lib/suporte-store"),
        import("@/lib/protocolo"),
      ]);
      const conversas = await listarConversas().catch(() => []);
      const c = conversas.find((x) => protocoloDe(x.id).startsWith(protocolo));
      if (!c) {
        return NextResponse.json(
          { error: `Nada com o protocolo ${protocolo}.` },
          { status: 404 }
        );
      }
      if (!c.emailAluna) {
        return NextResponse.json(
          { error: `A conversa ${protocolo} não tem e-mail — a aluna não chegou a dar.` },
          { status: 400 }
        );
      }
      alvo = c.emailAluna;
    }

    if (!alvo) {
      return NextResponse.json(
        { error: "Use ?sondarvendas=1&email=... ou &protocolo=ABC123" },
        { status: 400 }
      );
    }
    const { sondarVendas } = await import("@/lib/hotmart-sonda");
    return NextResponse.json({
      aviso: "Só leitura. A resposta mostra apenas QUANTAS compras vieram, nunca os dados.",
      email: alvo,
      credencial: jogo,
      tentativas: await sondarVendas(alvo, jogo),
    });
  }

  const email = url0.searchParams.get("email");
  if (!email) {
    return NextResponse.json({
      credenciais: "OK — a Hotmart aceitou",
      dica: "Pra ver as compras de alguém, acrescente ?email=alguem@email.com",
    });
  }

  try {
    const vendas = await vendasDoEmail(email);
    return NextResponse.json({
      credenciais: "OK — a Hotmart aceitou",
      email,
      compras: vendas.length,
      itens: vendas,
    });
  } catch (e) {
    return NextResponse.json({
      credenciais: "OK — a Hotmart aceitou",
      email,
      erroNaConsulta: e instanceof Error ? e.message : "Erro",
    });
  }
}
