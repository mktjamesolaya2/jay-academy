// 404 público com a cara da marca (antes: texto puro do Next).
export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 16,
        background: "#0a0a0a",
        color: "#e8e8e8",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif",
        padding: 24,
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: 13, letterSpacing: 4, color: "#c9a24b", margin: 0 }}>
        JAY ACADEMY
      </p>
      <h1 style={{ fontSize: 42, fontWeight: 800, margin: 0 }}>404</h1>
      <p style={{ color: "#999", maxWidth: 420, lineHeight: 1.6, margin: 0 }}>
        Esta página não existe ou saiu do ar. Confira o endereço ou volte para
        uma das nossas páginas de cursos.
      </p>
      <a
        href="/fio-a-fio-realista-by-james-olaya"
        style={{
          marginTop: 8,
          padding: "12px 28px",
          borderRadius: 999,
          background: "linear-gradient(90deg,#ec4899,#f97316)",
          color: "#fff",
          fontWeight: 700,
          textDecoration: "none",
        }}
      >
        Conhecer os cursos
      </a>
    </main>
  );
}
