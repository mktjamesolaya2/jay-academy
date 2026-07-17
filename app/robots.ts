import type { MetadataRoute } from "next";

// robots.txt — o domínio canônico já é jayacademy.com.br (metas das LPs apontam
// pra lá; o apontamento de DNS pro app é iminente). Área admin e APIs fora do índice.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/dashboard",
          "/analytics",
          "/forms",
          "/lixeira",
          "/lps",
          "/midia",
          "/settings",
          "/sugestoes",
          "/websites",
          "/wordpress",
          "/wp-pages",
          "/login",
        ],
      },
    ],
    sitemap: "https://jayacademy.com.br/sitemap.xml",
  };
}
