import "server-only";

// Renderiza a página num Chrome de verdade e devolve o HTML já com JS aplicado +
// a URL FINAL (após redirects) — necessária pra rechecar SSRF e derivar host/slug.
// Local (PC): usa o Chrome instalado. Vercel: @sparticuz/chromium.
export async function renderHeadless(
  url: string
): Promise<{ html: string; finalUrl: string }> {
  const puppeteer = (await import("puppeteer-core")).default;
  const onVercel = !!process.env.VERCEL;

  let launchOpts: Record<string, unknown>;
  if (onVercel) {
    const chromium = (await import("@sparticuz/chromium")).default;
    launchOpts = {
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: true,
    };
  } else {
    // Caminho do Chrome local por plataforma (James usa Windows; mac/linux por
    // segurança). Pode sobrescrever com a env CHROME_PATH.
    const localChrome =
      process.env.CHROME_PATH ||
      (process.platform === "darwin"
        ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        : process.platform === "linux"
          ? "/usr/bin/google-chrome"
          : "C:/Program Files/Google/Chrome/Application/chrome.exe");
    launchOpts = {
      executablePath: localChrome,
      headless: true,
    };
  }

  const browser = await puppeteer.launch(launchOpts);
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2", timeout: 45_000 });
    return { html: await page.content(), finalUrl: page.url() || url };
  } finally {
    await browser.close();
  }
}
