'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { getSupabase } from './supabase/client';
import type { Mesa, Profile, Reserva } from './types';

interface DataContextValue {
  reservas: Reserva[];
  mesas: Mesa[];
  perfil: Profile | null;
  carregando: boolean;
  recarregar: () => Promise<void>;
}

const DataContext = createContext<DataContextValue>({
  reservas: [],
  mesas: [],
  perfil: null,
  carregando: true,
  recarregar: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);
  const carregandoRef = useRef(false);

  const recarregar = useCallback(async () => {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    try {
      const supabase = getSupabase();
      const [resReservas, resMesas] = await Promise.all([
        supabase
          .from('reservations')
          .select('*, mesa:tables(*)')
          .order('data_criacao', { ascending: true }),
        supabase.from('tables').select('*').order('numero'),
      ]);
      if (resReservas.data) setReservas(resReservas.data as Reserva[]);
      if (resMesas.data) setMesas(resMesas.data as Mesa[]);
    } finally {
      carregandoRef.current = false;
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabase();

    void recarregar();

    supabase.auth.getUser().then(async ({ data }) => {
      if (data.user) {
        const { data: p } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
        if (p) setPerfil(p as Profile);
      }
    });

    const canal = supabase
      .channel('operacao')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, () => {
        void recarregar();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tables' }, () => {
        void recarregar();
      })
      .subscribe();

    const aoVoltarOnline = () => void recarregar();
    window.addEventListener('online', aoVoltarOnline);

    return () => {
      supabase.removeChannel(canal);
      window.removeEventListener('online', aoVoltarOnline);
    };
  }, [recarregar]);

  return (
    <DataContext.Provider value={{ reservas, mesas, perfil, carregando, recarregar }}>
      {children}
    </DataContext.Provider>
  );
}

export function useDados() {
  return useContext(DataContext);
}
