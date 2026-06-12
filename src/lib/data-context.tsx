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
  /** Hora em que cada reserva SENTOU pela última vez (evento 'sentada'). */
  sentadoEm: Record<string, string>;
  perfil: Profile | null;
  carregando: boolean;
  /** Mensagem de erro do Supabase na última leitura (RLS, chave errada, rede...). */
  erro: string | null;
  /** Host do projeto Supabase configurado — para conferir se é o projeto certo. */
  supabaseHost: string;
  recarregar: () => Promise<void>;
}

const SUPABASE_HOST = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').host;
  } catch {
    return 'NEXT_PUBLIC_SUPABASE_URL não configurada';
  }
})();

const DataContext = createContext<DataContextValue>({
  reservas: [],
  mesas: [],
  sentadoEm: {},
  perfil: null,
  carregando: true,
  erro: null,
  supabaseHost: SUPABASE_HOST,
  recarregar: async () => {},
});

export function DataProvider({ children }: { children: ReactNode }) {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [mesas, setMesas] = useState<Mesa[]>([]);
  const [sentadoEm, setSentadoEm] = useState<Record<string, string>>({});
  const [perfil, setPerfil] = useState<Profile | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const carregandoRef = useRef(false);

  const recarregar = useCallback(async () => {
    if (carregandoRef.current) return;
    carregandoRef.current = true;
    try {
      const supabase = getSupabase();
      const [resReservas, resMesas, resSentadas] = await Promise.all([
        supabase
          .from('reservations')
          .select('*, mesa:tables(*)')
          .order('data_criacao', { ascending: true }),
        supabase.from('tables').select('*').order('numero'),
        supabase
          .from('reservation_events')
          .select('reservation_id, criado_em')
          .eq('tipo', 'sentada')
          .order('criado_em', { ascending: true }),
      ]);
      if (resReservas.data) setReservas(resReservas.data as Reserva[]);
      if (resMesas.data) setMesas(resMesas.data as Mesa[]);
      if (resSentadas.data) {
        const m: Record<string, string> = {};
        for (const e of resSentadas.data as { reservation_id: string; criado_em: string }[]) {
          m[e.reservation_id] = e.criado_em; // ordenado asc: fica a última
        }
        setSentadoEm(m);
      }
      const falha = resMesas.error ?? resReservas.error;
      setErro(falha ? falha.message : null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha de conexão com o Supabase.');
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
    <DataContext.Provider
      value={{ reservas, mesas, sentadoEm, perfil, carregando, erro, supabaseHost: SUPABASE_HOST, recarregar }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useDados() {
  return useContext(DataContext);
}
