import { redirect } from "next/navigation";

// A tela de importar foi unificada dentro de /wp-pages (seção "Importar do
// WordPress" no topo). Mantido só o redirect pra não quebrar links/atalhos
// antigos que apontam pra /wordpress. As server actions continuam em ./actions.
export default function WordPressRedirect() {
  redirect("/wp-pages#importar");
}
