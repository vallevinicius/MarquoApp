import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { EmpresaAdmin, LojaAdmin, PlanoSaaS, UsuarioAdmin } from '@/types';
import { formatarMoeda } from '@/utils/formatters';
import { emTrial } from './AdminResumo';

const PLANOS: PlanoSaaS[] = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
const ROTULOS_PAPEL: Record<string, string> = { ADMIN: 'Admin', GERENTE: 'Gerente', OPERADOR_CAIXA: 'Operador de caixa' };

const data = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

function diasRestantes(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

function Selo({ children, tom }: { children: ReactNode; tom: 'ok' | 'aviso' | 'erro' | 'neutro' }) {
  const cores = {
    ok: 'bg-emerald-500/15 text-emerald-500',
    aviso: 'bg-amber-500/15 text-amber-500',
    erro: 'bg-red-500/15 text-red-400',
    neutro: 'bg-ink-700 text-ink-300',
  }[tom];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cores}`}>{children}</span>;
}

function Botao({ children, onClick, perigo }: { children: ReactNode; onClick: () => void; perigo?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={[
        'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
        perigo ? 'text-red-400 hover:bg-red-500/10' : 'text-ink-300 hover:bg-ink-700 hover:text-ink-100',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function Dado({ rotulo, valor }: { rotulo: string; valor?: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-ink-500">{rotulo}</p>
      <p className="mt-0.5 break-words text-sm text-ink-200">{valor || '—'}</p>
    </div>
  );
}

function enderecoEmTexto(l: LojaAdmin): string {
  const e = l.endereco;
  const rua = [e.logradouro, e.numero].filter(Boolean).join(', ');
  const cidade = [e.cidade, e.uf].filter(Boolean).join(' / ');
  return [rua, e.complemento, e.bairro, cidade, e.cep].filter(Boolean).join(' · ');
}

export interface AcoesEmpresa {
  onTrocarPlano: (empresa: EmpresaAdmin, plano: PlanoSaaS) => void;
  onAlternarEmpresa: (empresa: EmpresaAdmin) => void;
  onExcluirEmpresa: (empresa: EmpresaAdmin) => void;
  onAlternarLoja: (loja: LojaAdmin) => void;
  onExcluirLoja: (empresa: EmpresaAdmin, loja: LojaAdmin) => void;
  onAlternarUsuario: (usuario: UsuarioAdmin) => void;
  onResetarSenha: (usuario: UsuarioAdmin) => void;
}

function LojaDetalhe({ empresa, loja, acoes }: { empresa: EmpresaAdmin; loja: LojaAdmin; acoes: AcoesEmpresa }) {
  const i = loja.indicadores;
  return (
    <div className="rounded-lg border border-ink-700 bg-ink-800 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="flex flex-wrap items-center gap-2 font-medium text-ink-100">
            {loja.nomeFantasia}
            {!loja.ativo && <Selo tom="erro">Desativada</Selo>}
          </p>
          <p className="mt-0.5 font-mono text-xs text-ink-500">{loja.cnpj} · criada em {data(loja.criadoEm)}</p>
        </div>
        <div className="flex gap-1">
          <Botao onClick={() => acoes.onAlternarLoja(loja)}>{loja.ativo ? 'Desativar loja' : 'Reativar loja'}</Botao>
          <Botao perigo onClick={() => acoes.onExcluirLoja(empresa, loja)}>Excluir loja</Botao>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        <Dado rotulo="Razão social" valor={loja.razaoSocial} />
        <Dado rotulo="Tipo / regime" valor={loja.regimeTributario} />
        <Dado rotulo="Inscrição estadual" valor={loja.inscricaoEstadual} />
        <Dado rotulo="Inscrição municipal" valor={loja.inscricaoMunicipal} />
        <Dado rotulo="Telefone" valor={loja.telefone} />
        <Dado rotulo="E-mail" valor={loja.email} />
        <Dado rotulo="Site" valor={loja.site} />
        <Dado rotulo="Produtos ativos" valor={String(i.produtos)} />
        <div className="col-span-2 sm:col-span-4"><Dado rotulo="Endereço" valor={enderecoEmTexto(loja)} /></div>
        <Dado rotulo="Vendas no mês" valor={String(i.vendasDoMes)} />
        <Dado rotulo="Faturamento no mês" valor={formatarMoeda(i.faturamentoDoMes, null)} />
        <Dado rotulo="Última venda no mês" valor={i.ultimaVenda ? new Date(i.ultimaVenda).toLocaleString('pt-BR') : undefined} />
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-ink-700">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="bg-ink-700/40 text-left text-xs uppercase tracking-wide text-ink-400">
              <th className="px-3 py-2 font-medium">Usuário</th>
              <th className="px-3 py-2 font-medium">Contato</th>
              <th className="px-3 py-2 font-medium">Papel</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 text-right font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loja.usuarios.map((u) => (
              <tr key={u.id} className="border-t border-ink-700">
                <td className="px-3 py-2.5">
                  <p className="text-ink-100">{u.nome}</p>
                  <p className="font-mono text-xs text-ink-500">{u.email}</p>
                </td>
                <td className="px-3 py-2.5 text-xs text-ink-400">
                  {u.telefone ?? '—'}
                  {u.cpf && <span className="block font-mono">{u.cpf}</span>}
                </td>
                <td className="px-3 py-2.5 text-ink-300">
                  {ROTULOS_PAPEL[u.papel] ?? u.papel}
                  {u.raiz && <span className="ml-2"><Selo tom="neutro">Principal</Selo></span>}
                </td>
                <td className="px-3 py-2.5"><Selo tom={u.ativo ? 'ok' : 'neutro'}>{u.ativo ? 'Ativo' : 'Desativado'}</Selo></td>
                <td className="px-3 py-2.5 text-right">
                  <Botao onClick={() => acoes.onAlternarUsuario(u)}>{u.ativo ? 'Desativar' : 'Ativar'}</Botao>
                  <Botao onClick={() => acoes.onResetarSenha(u)}>Resetar senha</Botao>
                </td>
              </tr>
            ))}
            {loja.usuarios.length === 0 && (
              <tr><td colSpan={5} className="px-3 py-4 text-center text-ink-500">Nenhum usuário nesta loja.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function EmpresaItem({ empresa, aberta, onAlternar, acoes }: {
  empresa: EmpresaAdmin;
  aberta: boolean;
  onAlternar: () => void;
  acoes: AcoesEmpresa;
}) {
  const usuarios = empresa.lojas.reduce((s, l) => s + l.usuarios.length, 0);
  const faturamento = empresa.lojas.reduce((s, l) => s + l.indicadores.faturamentoDoMes, 0);
  const trialAtivo = emTrial(empresa);

  return (
    <div className={['rounded-xl border bg-ink-800 transition-colors', aberta ? 'border-tenant/40' : 'border-ink-700'].join(' ')}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5">
        <button onClick={onAlternar} aria-expanded={aberta} className="flex min-w-0 flex-1 items-center gap-3 text-left">
          <svg viewBox="0 0 16 16" aria-hidden className={['h-4 w-4 shrink-0 text-ink-400 transition-transform', aberta ? 'rotate-90' : ''].join(' ')}
            fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="m6 3 5 5-5 5" /></svg>
          <span className="min-w-0">
            <span className="flex flex-wrap items-center gap-2">
              <span className="truncate font-medium text-ink-100">{empresa.nome}</span>
              {!empresa.ativo && <Selo tom="erro">Suspensa</Selo>}
              {empresa.assinatura.status === 'ATIVA' && <Selo tom="ok">Assinatura ativa</Selo>}
              {empresa.assinatura.status === 'CANCELADA' && (
                <Selo tom="aviso">Cancelada{empresa.assinatura.acessoAte ? ` · até ${data(empresa.assinatura.acessoAte)}` : ''}</Selo>
              )}
              {empresa.assinatura.status === 'PAUSADA' && <Selo tom="erro">Pagamento pendente</Selo>}
              {empresa.trialExpiraEm && empresa.assinatura.status !== 'ATIVA' && (
                trialAtivo
                  ? <Selo tom="aviso">Prazo: {diasRestantes(empresa.trialExpiraEm)}d</Selo>
                  : <Selo tom="erro">Prazo expirado</Selo>
              )}
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              {empresa.lojas.length} loja(s) · {usuarios} usuário(s) · {formatarMoeda(faturamento, null)} no mês · cliente desde {data(empresa.criadoEm)}
            </span>
          </span>
        </button>

        <select
          value={empresa.planoAtual}
          onChange={(e) => acoes.onTrocarPlano(empresa, e.target.value as PlanoSaaS)}
          aria-label={`Plano de ${empresa.nome}`}
          className="rounded-lg border border-ink-600 bg-ink-700/60 px-2.5 py-1.5 text-sm text-ink-100 focus:border-tenant focus:outline-none"
        >
          {PLANOS.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>

        <div className="flex gap-1">
          <Botao onClick={() => acoes.onTrocarPlano(empresa, empresa.planoAtual)}>Carência</Botao>
          <Botao onClick={() => acoes.onAlternarEmpresa(empresa)}>{empresa.ativo ? 'Suspender' : 'Reativar'}</Botao>
          <Botao perigo onClick={() => acoes.onExcluirEmpresa(empresa)}>Excluir</Botao>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {aberta && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-ink-700 bg-ink-900/40 p-4">
              {empresa.lojas.map((loja) => (
                <LojaDetalhe key={loja.id} empresa={empresa} loja={loja} acoes={acoes} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
