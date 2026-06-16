// Template re-renderiza a cada navegação (diferente do layout) — por isso a
// animação de entrada roda toda vez que você troca de página.
export default function Template({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="page-enter">{children}</div>;
}
