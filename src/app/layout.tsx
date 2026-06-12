import type { Metadata, Viewport } from 'next';
import { Fraunces, Manrope } from 'next/font/google';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
});

const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'TATÁ Sushi — Cardápios da Equipe',
  description:
    'Planejamento da refeição dos funcionários: cardápio semanal, lista de compras automática e fluxo de aprovação entre setores.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Cardápios',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#15171b',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={`${manrope.variable} ${fraunces.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tema');if(t==='escuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body className="font-sans">{children}</body>
    </html>
  );
}
