import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SITE_CONFIG } from "@/config/site";
import { TravelPlannerQuizProvider } from "@/context/TravelPlannerQuizContext";

export const metadata: Metadata = {
  title: SITE_CONFIG.title,
  description: SITE_CONFIG.description,
  icons: {
    icon: [
      { url: "/img/favicon.jpg", type: "image/jpeg" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/img/favicon.jpg",
    apple: "/img/favicon.jpg",
  },
};

export const viewport: Viewport = {
  themeColor: SITE_CONFIG.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="UTF-8" />
        <link rel="icon" href="/img/favicon.jpg" type="image/jpeg" />
        <link rel="shortcut icon" href="/img/favicon.jpg" type="image/jpeg" />
        <link rel="apple-touch-icon" href="/img/favicon.jpg" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alegreya+Sans:wght@400;500;700&family=Ibarra+Real+Nova:ital,wght@0,400;0,600;0,700;1,600;1,700&display=swap"
        />
      </head>
      <body>
        <TravelPlannerQuizProvider>
          <div className="page">{children}</div>
        </TravelPlannerQuizProvider>
      </body>
    </html>
  );
}
