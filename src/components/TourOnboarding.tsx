'use client';

import { useState } from 'react';
import { Icone, type NomeIcone } from '@/components/Icones';

const CHAVE = 'tata:tour-completo';

interface Passo {
  icone?: NomeIcone;
  emoji?: string;
  titulo: string;
  texto: string;
  dica?: string;
}

const PASSOS: Passo[] = [
  {
    emoji: '👋',
    titulo: 'Bem-vindo ao Tatá House',
    texto: 'O sistema que transforma o refeitório em operação de precisão. Este tour leva 30 segundos.',
    dica: 'Pule a qualquer momento — o tour não aparece de novo.',
  },
  {
    icone: 'painel',
    titulo: 'Início',
    texto: 'Briefing automático todos os dias: alertas de preço, estoque baixo, etapa da semana e atalhos para o que importa agora.',
    dica: 'O sistema avisa antes de você precisar perguntar.',
  },
  {
    icone: 'cardapio',
    titulo: 'Cardápio',
    texto: 'Monte os pratos de cada dia. A lista de compras é gerada automaticamente a partir daqui.',
    dica: 'Use "Sugerir" para que a IA preencha os dias vazios com base no histórico.',
  },
  {
    icone: 'compras',
    titulo: 'Compras',
    texto: 'Lista de compras, cotação via WhatsApp, notas fiscais, estoque e preços — tudo conectado.',
    dica: 'Cole a mensagem do fornecedor e a IA extrai os preços automaticamente.',
  },
  {
    icone: 'insights',
    titulo: 'Relatórios',
    texto: 'Aceitação dos pratos, desperdício, custo por refeição, DNA do cardápio e auditoria completa.',
    dica: 'Use o QR code para coletar avaliações diretamente dos funcionários.',
  },
  {
    icone: 'ajustes',
    titulo: 'Ajustes',
    texto: 'Configure os PINs de cada perfil, faça upload do logo do restaurante e ative a nuvem.',
    dica: 'Comece aqui: troque o PIN padrão antes de distribuir o acesso à equipe.',
  },
];

export function TourOnboarding() {
  const [passo, setPasso] = useState(0);
  const [saindo, setSaindo] = useState(false);
  const [visivel, setVisivel] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !localStorage.getItem(CHAVE);
  });

  if (!visivel) return null;

  const fechar = () => {
    setSaindo(true);
    localStorage.setItem(CHAVE, '1');
    setTimeout(() => setVisivel(false), 250);
  };

  const avancar = () => {
    if (passo === PASSOS.length - 1) { fechar(); return; }
    setPasso((p) => p + 1);
  };

  const voltar = () => { if (passo > 0) setPasso((p) => p - 1); };

  const atual = PASSOS[passo];
  const isUltimo = passo === PASSOS.length - 1;
  const isIntro = passo === 0;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center px-4 pb-24 transition-opacity duration-200 lg:items-center lg:pb-0 ${saindo ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
    >
      <div className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-carvao-900 dark:ring-1 dark:ring-carvao-700">
        {/* Barra de marca */}
        <div className="h-1 bg-gradient-to-r from-brand-500 to-brand-700" />

        <div className="p-6">
          {/* Ícone da etapa */}
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${isIntro ? 'bg-brand-50 dark:bg-carvao-800' : 'bg-brand-50 dark:bg-carvao-800'}`}>
            {atual.emoji ? (
              <span className="text-3xl leading-none">{atual.emoji}</span>
            ) : atual.icone ? (
              <Icone nome={atual.icone} tam={28} className="text-brand-600 dark:text-brand-400" />
            ) : null}
          </div>

          {/* Título + texto */}
          <h2 className="font-display text-xl font-bold text-carvao-900 dark:text-white">
            {atual.titulo}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-carvao-600 dark:text-areia-300">
            {atual.texto}
          </p>
          {atual.dica && (
            <p className="mt-3 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 dark:bg-carvao-800 dark:text-brand-300">
              → {atual.dica}
            </p>
          )}

          {/* Progresso */}
          <div className="mt-5 flex items-center gap-1.5">
            {PASSOS.map((_, i) => (
              <button
                key={i}
                onClick={() => setPasso(i)}
                aria-label={`Passo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === passo
                    ? 'w-6 bg-brand-600 dark:bg-brand-400'
                    : i < passo
                    ? 'w-1.5 bg-brand-300 dark:bg-brand-700'
                    : 'w-1.5 bg-carvao-200 dark:bg-carvao-700'
                }`}
              />
            ))}
            <span className="ml-auto text-micro font-semibold text-texto-suave">
              {passo + 1} / {PASSOS.length}
            </span>
          </div>

          {/* Botões */}
          <div className="mt-4 flex gap-2">
            {passo > 0 ? (
              <button
                onClick={voltar}
                className="flex-1 rounded-2xl border border-carvao-200 py-2.5 text-sm font-semibold text-carvao-500 transition hover:bg-carvao-50 dark:border-carvao-700 dark:text-carvao-400 dark:hover:bg-carvao-800"
              >
                ← Voltar
              </button>
            ) : (
              <button
                onClick={fechar}
                className="flex-1 rounded-2xl border border-carvao-200 py-2.5 text-sm font-semibold text-carvao-500 transition hover:bg-carvao-50 dark:border-carvao-700 dark:text-carvao-400 dark:hover:bg-carvao-800"
              >
                Pular
              </button>
            )}
            <button
              onClick={avancar}
              className="flex-[2] rounded-2xl bg-brand-700 py-2.5 text-sm font-bold text-white shadow-suave transition hover:bg-brand-800 active:scale-[0.98]"
            >
              {isUltimo ? 'Começar' : 'Próximo →'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
