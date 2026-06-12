'use client';

import { NavBar } from '@/components/NavBar';
import { AvisoOffline } from '@/components/AvisoOffline';
import { TelaAcesa } from '@/components/TelaAcesa';
import { DataProvider } from '@/lib/data-context';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <DataProvider>
      <TelaAcesa />
      <AvisoOffline />
      <NavBar />
      <main className="mx-auto max-w-7xl px-4 py-5 pb-10 sm:px-6">{children}</main>
    </DataProvider>
  );
}
