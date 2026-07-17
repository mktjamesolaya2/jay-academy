import { getCurrentUser, canEdit } from "@/lib/auth";
import { listAllSubmissions, listForms } from "@/lib/forms-store";
import { getLpHtmlEntry } from "@/lib/lp-html-registry";

export const dynamic = "force-dynamic";

function csvCell(v: string): string {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

/** Rótulo da página de origem a partir do formId. */
function originLabel(formId: string, formNames: Map<string, string>): string {
  if (formId.startsWith("wp:")) {
    const slug = formId.slice(3);
    return getLpHtmlEntry(slug)?.title || `/${slug}`;
  }
  return formNames.get(formId) || formId;
}

export async function GET(req: Request) {
  const me = await getCurrentUser();
  if (!canEdit(me)) {
    return new Response("Acesso negado", { status: 403 });
  }

  const url = new URL(req.url);
  const origem = url.searchParams.get("origem") || "";

  const [{ submissions }, forms] = await Promise.all([
    listAllSubmissions(),
    listForms(),
  ]);
  const formNames = new Map(forms.map((f) => [f.id, f.name]));

  const rows = submissions.filter((s) => !origem || s.formId === origem);

  const header = ["Nome", "Email", "WhatsApp", "Origem", "Data", "Webhook"];
  const lines = [header.map(csvCell).join(",")];
  for (const s of rows) {
    lines.push(
      [
        s.name || "",
        s.email || "",
        s.whatsapp || "",
        originLabel(s.formId, formNames),
        s.submittedAt || "",
        s.webhookStatus || "",
      ]
        .map(csvCell)
        .join(",")
    );
  }
  // BOM pra Excel abrir acentos certo
  const csv = "﻿" + lines.join("\r\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-jayacademy.csv"`,
    },
  });
}
