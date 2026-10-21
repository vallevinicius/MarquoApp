import { useState, type FormEvent, type ReactNode } from 'react';
import type { PlanoSaaS } from '@/types';

/** Mesmo teto do servidor (MAX_DIAS_CARENCIA). */
export const MAX_DIAS_CARENCIA = 730;
const ATALHOS_CARENCIA = [30, 60, 90, 180];

/** Data em que a carência termina, no formato do painel (dd/mm/aaaa). */
export function fimDaCarencia(dias: number, desde = new Date()): string {
  const d = new Date(desde);
  d.setDate(d.getDate() + dias);
  return d.toLocaleDateString('pt-BR');
}

/** Dias digitados válidos (inteiro de 1 a MAX_DIAS_CARENCIA) ou null. */
export function diasValidos(texto: string): number | null {
  if (!/^\d+$/.test(texto.trim())) return null;
  const n = Number(texto);
  return n >= 1 && n <= MAX_DIAS_CARENCIA ? n : null;
}

function Fundo({ children, onFechar }: { children: ReactNode; onFechar: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => e.target === e.currentTarget && onFechar()}
    >
      {children}
    </div>
  );
}

interface ExcluirProps {
  titulo: string;
  descricao: string;
  /** Texto que a pessoa precisa digitar pra liberar o botão. */
  confirmacao: string;
  onCancelar: () => void;
  onConfirmar: () => Promise<void>;
}

/** Confirmação de exclusão definitiva: só libera o botão depois de digitar o
 * nome (ou CNPJ) do que será apagado, pra ninguém excluir por engano. */
export function ModalExcluir({ titulo, descricao, confirmacao, onCancelar, onConfirmar }: ExcluirProps) {
  const [digitado, setDigitado] = useState('');
  const [excluindo, setExcluindo] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (digitado !== confirmacao) return;
    setExcluindo(true);
    try {
      await onConfirmar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <Fundo onFechar={onCancelar}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">{titulo}</p>
        <p className="mt-2 text-sm text-ink-400">{descricao}</p>
        <p className="mt-4 text-sm text-ink-300">
          Digite <span className="font-mono text-ink-100">{confirmacao}</span> para confirmar:
        </p>
        <input
          autoFocus
          value={digitado}
          onChange={(e) => setDigitado(e.target.value)}
          className="mt-2 w-full rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-sm text-ink-100 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
        />
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={excluindo || digitado !== confirmacao}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {excluindo ? 'Excluindo…' : 'Excluir para sempre'}
          </button>
        </div>
      </form>
    </Fundo>
  );
}

interface PlanoProps {
  empresaNome: string;
  planoAtual: PlanoSaaS;
  novoPlano: PlanoSaaS;
  onCancelar: () => void;
  /** `diasCarencia` undefined = plano sem prazo (cortesia). */
  onConfirmar: (diasCarencia?: number) => Promise<void>;
}

/** Troca de plano pelo admin, com carência opcional: a empresa usa o plano sem
 * cobrança até a data e depois cai na tela de assinar. */
export function ModalPlano({ empresaNome, planoAtual, novoPlano, onCancelar, onConfirmar }: PlanoProps) {
  const [comPrazo, setComPrazo] = useState(true);
  const [dias, setDias] = useState('30');
  const [salvando, setSalvando] = useState(false);

  const valor = diasValidos(dias);
  const pronto = !comPrazo || valor !== null;
  const mesmoPlano = planoAtual === novoPlano;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!pronto) return;
    setSalvando(true);
    try {
      await onConfirmar(comPrazo && valor !== null ? valor : undefined);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Fundo onFechar={onCancelar}>
      <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">
          {mesmoPlano ? `Carência de ${empresaNome}` : `Trocar o plano de ${empresaNome}`}
        </p>
        <p className="mt-2 text-sm text-ink-400">
          {mesmoPlano
            ? <>Plano <b className="text-ink-200">{novoPlano}</b>. Defina por quanto tempo ele fica liberado sem cobrança.</>
            : <>De <b className="text-ink-200">{planoAtual}</b> para <b className="text-ink-200">{novoPlano}</b>.</>}
        </p>

        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">Prazo do plano</legend>
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-200">
            <input type="radio" name="prazo" checked={comPrazo} onChange={() => setComPrazo(true)} className="mt-1 accent-[rgb(var(--tenant-primary))]" />
            <span>
              <span className="font-medium text-ink-100">Com carência</span>
              <span className="block text-xs text-ink-400">Usa o plano sem pagar durante os dias abaixo; depois precisa assinar.</span>
            </span>
          </label>
          {comPrazo && (
            <div className="ml-7 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  autoFocus
                  inputMode="numeric"
                  value={dias}
                  onChange={(e) => setDias(e.target.value)}
                  aria-label="Dias de carência"
                  className="w-24 rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2 text-sm text-ink-100 focus:border-tenant focus:outline-none focus:ring-2 focus:ring-tenant/20"
                />
                <span className="text-sm text-ink-400">dias</span>
                {ATALHOS_CARENCIA.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDias(String(n))}
                    className="rounded-full border border-ink-600 px-2.5 py-1 text-xs text-ink-300 hover:border-tenant hover:text-ink-100"
                  >
                    {n}d
                  </button>
                ))}
              </div>
              <p className={['text-xs', valor ? 'text-ink-400' : 'text-red-400'].join(' ')}>
                {valor ? <>Libera até <b className="text-ink-200">{fimDaCarencia(valor)}</b>.</> : `Informe de 1 a ${MAX_DIAS_CARENCIA} dias.`}
              </p>
            </div>
          )}
          <label className="flex cursor-pointer items-start gap-3 text-sm text-ink-200">
            <input type="radio" name="prazo" checked={!comPrazo} onChange={() => setComPrazo(false)} className="mt-1 accent-[rgb(var(--tenant-primary))]" />
            <span>
              <span className="font-medium text-ink-100">Sem prazo (cortesia)</span>
              <span className="block text-xs text-ink-400">Fica liberado até você mudar o plano de novo.</span>
            </span>
          </label>
        </fieldset>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="rounded-lg px-4 py-2 text-sm text-ink-300 hover:text-ink-100">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={salvando || !pronto}
            className="rounded-lg bg-tenant px-4 py-2 text-sm font-semibold text-tenant-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {salvando ? 'Salvando…' : 'Aplicar'}
          </button>
        </div>
      </form>
    </Fundo>
  );
}

export function ModalSenhaGerada({ usuarioNome, senha, onFechar }: { usuarioNome: string; senha: string; onFechar: () => void }) {
  const [copiada, setCopiada] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(senha);
      setCopiada(true);
    } catch {
      // Sem permissão de área de transferência: a senha continua selecionável na tela.
    }
  }

  return (
    <Fundo onFechar={onFechar}>
      <div className="w-full max-w-sm rounded-xl border border-ink-700 bg-ink-800 p-6">
        <p className="font-display text-lg font-semibold text-ink-100">Senha redefinida</p>
        <p className="mt-2 text-sm text-ink-400">
          Nova senha temporária de {usuarioNome}. Copie e repasse com segurança: ela não será mostrada de novo.
        </p>
        <p className="mt-4 select-all rounded-lg border border-ink-600 bg-ink-700/60 px-3 py-2.5 text-center font-mono text-sm text-ink-100">
          {senha}
        </p>
        <div className="mt-5 flex gap-3">
          <button
            onClick={copiar}
            className="flex-1 rounded-lg border border-ink-600 py-2.5 text-sm font-medium text-ink-200 hover:border-ink-500 hover:text-ink-100"
          >
            {copiada ? 'Copiada ✓' : 'Copiar'}
          </button>
          <button onClick={onFechar} className="flex-1 rounded-lg bg-tenant py-2.5 text-sm font-semibold text-tenant-foreground hover:opacity-90">
            Fechar
          </button>
        </div>
      </div>
    </Fundo>
  );
}

export { Fundo as ModalFundo };
