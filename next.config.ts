import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Gera um servidor autónomo em .next/standalone, com apenas as dependências
  // que são realmente usadas — mantém a imagem de contentor pequena.
  output: "standalone",

  // Sem isto, o file tracing apanha a base de dados local (data/crm.db) e
  // copia-a para dentro da saída autónoma — ou seja, para dentro da imagem.
  outputFileTracingExcludes: {
    "*": ["./data/**"],
  },
};

export default nextConfig;
