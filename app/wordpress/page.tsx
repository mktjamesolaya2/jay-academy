import { redirect } from "next/navigation";

// A importação do WordPress foi desativada (migração concluída em 07/2026;
// o servidor WP será desligado). Mantido só o redirect pra não quebrar
// links/atalhos antigos que apontam pra /wordpress.
export default function WordPressRedirect() {
  redirect("/wp-pages");
}
