import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Portal de Pedidos Promocionais",
  description: "Sistema operacional interno para pedidos promocionais.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
