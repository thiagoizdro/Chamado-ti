import { useListaCategorias } from '../../hooks/useCategorias';
import { useOpcoesEscolas } from '../../hooks/useOpcoesEscolas';
import { useListaUsuarios } from '../../hooks/useUsuarios';
import { type NomeFiltro, PRIORIDADES, ROTULO_PRIORIDADE, ROTULO_STATUS } from '../../lib/chamados';
import type { StatusChamado } from '../../types/chamado';
import type { UsuarioLogado } from '../../types/usuario';
import { Botao } from '../ui/Botao';
import { CampoSelect, CampoTexto } from '../ui/Campo';
import { CampoBusca } from '../ui/CampoBusca';

const STATUS: StatusChamado[] = ['ABERTO', 'EM_ATENDIMENTO', 'AGUARDANDO_PECA', 'RESOLVIDO'];
// A API aceita vários status separados por vírgula.
const PENDENTES = 'ABERTO,EM_ATENDIMENTO,AGUARDANDO_PECA';
const LIMITE_OPCOES = 100;

type Props = {
  usuario: UsuarioLogado;
  busca: string;
  valor: (nome: NomeFiltro) => string;
  aoBuscar: (texto: string) => void;
  aoMudar: (nome: NomeFiltro, valor: string) => void;
  temFiltros: boolean;
  aoLimpar: () => void;
};

// Escola e técnicos vêm de GET /escolas e GET /usuarios, que são só do admin.
function FiltrosDoAdmin({ valor, aoMudar }: Pick<Props, 'valor' | 'aoMudar'>) {
  const escolas = useOpcoesEscolas();
  const tecnicos = useListaUsuarios({
    perfil: 'TECNICO',
    ativo: 'todos',
    porPagina: LIMITE_OPCOES,
  });
  return (
    <>
      <CampoSelect
        id="filtro-escola"
        rotulo="Escola"
        value={valor('escolaId')}
        onChange={(evento) => aoMudar('escolaId', evento.target.value)}
      >
        <option value="">Todas</option>
        {escolas.opcoes.map((escola) => (
          <option key={escola.id} value={escola.id}>
            {escola.nome}
          </option>
        ))}
      </CampoSelect>
      <CampoSelect
        id="filtro-tecnico"
        rotulo="Técnico"
        value={valor('tecnicoId')}
        onChange={(evento) => aoMudar('tecnicoId', evento.target.value)}
      >
        <option value="">Todos</option>
        {tecnicos.data?.dados.map((tecnico) => (
          <option key={tecnico.id} value={tecnico.id}>
            {tecnico.nome}
          </option>
        ))}
      </CampoSelect>
    </>
  );
}

export function FiltrosChamados({
  usuario,
  busca,
  valor,
  aoBuscar,
  aoMudar,
  temFiltros,
  aoLimpar,
}: Props) {
  const categorias = useListaCategorias({ porPagina: LIMITE_OPCOES });
  const periodoInvalido = Boolean(valor('de') && valor('ate') && valor('de') > valor('ate'));

  return (
    <div
      role="search"
      aria-label="Filtros de chamados"
      className="mb-4 rounded-lg bg-white p-4 ring-1 ring-slate-200"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="sm:col-span-2">
          <CampoBusca
            id="busca-chamados"
            rotulo="Buscar"
            placeholder="Título, descrição ou patrimônio"
            valor={busca}
            aoBuscar={aoBuscar}
          />
        </div>

        <CampoSelect
          id="filtro-status"
          rotulo="Status"
          value={valor('status')}
          onChange={(evento) => aoMudar('status', evento.target.value)}
        >
          <option value="">Todos</option>
          <option value={PENDENTES}>Pendentes (não resolvidos)</option>
          {STATUS.map((status) => (
            <option key={status} value={status}>
              {ROTULO_STATUS[status]}
            </option>
          ))}
        </CampoSelect>

        <CampoSelect
          id="filtro-prioridade"
          rotulo="Prioridade"
          value={valor('prioridade')}
          onChange={(evento) => aoMudar('prioridade', evento.target.value)}
        >
          <option value="">Todas</option>
          {PRIORIDADES.map((prioridade) => (
            <option key={prioridade} value={prioridade}>
              {ROTULO_PRIORIDADE[prioridade]}
            </option>
          ))}
        </CampoSelect>

        <CampoSelect
          id="filtro-categoria"
          rotulo="Categoria"
          value={valor('categoriaId')}
          onChange={(evento) => aoMudar('categoriaId', evento.target.value)}
        >
          <option value="">Todas</option>
          {categorias.data?.dados.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </CampoSelect>

        {usuario.perfil === 'ADMIN' && <FiltrosDoAdmin valor={valor} aoMudar={aoMudar} />}

        {usuario.perfil === 'TECNICO' && (
          <CampoSelect
            id="filtro-tecnico"
            rotulo="Técnico"
            value={valor('tecnicoId')}
            onChange={(evento) => aoMudar('tecnicoId', evento.target.value)}
          >
            <option value="">Todos</option>
            <option value={usuario.id}>Somente os meus</option>
          </CampoSelect>
        )}

        <CampoTexto
          id="filtro-de"
          type="date"
          rotulo="Aberto de"
          value={valor('de')}
          onChange={(evento) => aoMudar('de', evento.target.value)}
        />
        <CampoTexto
          id="filtro-ate"
          type="date"
          rotulo="Aberto até"
          min={valor('de') || undefined}
          value={valor('ate')}
          erro={
            periodoInvalido ? 'A data final precisa ser igual ou posterior à inicial.' : undefined
          }
          onChange={(evento) => aoMudar('ate', evento.target.value)}
        />
      </div>

      {temFiltros && (
        <div className="mt-4 flex justify-end">
          <Botao variante="discreto" onClick={aoLimpar}>
            Limpar filtros
          </Botao>
        </div>
      )}
    </div>
  );
}
