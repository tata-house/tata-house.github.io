import type { Metadata, Viewport } from 'next';
import { RegistroSw } from '@/components/RegistroSw';
import './globals.css';

export const metadata: Metadata = {
  title: 'TATÁ Sushi — Operação Dia dos Namorados',
  description: 'Mapa de mesas e operação do Dia dos Namorados — TATÁ Sushi',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TATÁ Sushi',
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
  themeColor: '#00b14f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('tema');if(t==='escuro'||(!t&&matchMedia('(prefers-color-scheme: dark)').matches))document.documentElement.classList.add('dark')}catch(e){}`,
          }}
        />
      </head>
      <body>
        <RegistroSw />
        {children}
      </body>
    </html>
  );
}
