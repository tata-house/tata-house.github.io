'use client';

import { NavBar } from '@/components/NavBar';
import { AvisoOffline } from '@/components/AvisoOffline';
import { DataProvider } from '@/lib/data-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <AvisoOffline />
      <NavBar />
      <main className="mx-auto max-w-6xl px-4 py-4 pb-8">{children}</main>
    </DataProvider>
  );
}
