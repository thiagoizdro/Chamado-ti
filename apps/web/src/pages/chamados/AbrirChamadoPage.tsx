import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, type UseFormRegisterReturn, useWatch } from 'react-hook-form';
import { useNavigate } from 'react-router';
import { z } from 'zod';

import { Alerta } from '../../components/ui/Alerta';
import { Botao, LinkBotao } from '../../components/ui/Botao';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoAreaTexto, CampoSelect, CampoTexto } from '../../components/ui/Campo';
import { useAuth } from '../../hooks/useAuth';
import { useListaCategorias } from '../../hooks/useCategorias';
import { useAbrirChamado } from '../../hooks/useChamados';
import { useListaEquipamentos } from '../../hooks/useEquipamentos';
import { useOpcoesEscolas } from '../../hooks/useOpcoesEscolas';
import { PRIORIDADES, ROTULO_PRIORIDADE } from '../../lib/chamados';
import { aplicarErrosDaApi } from '../../lib/formulario';
import type { Prioridade } from '../../types/chamado';

// Cada escola tem poucas dezenas de equipamentos: uma página de 100 cobre o select.
const LIMITE_OPCOES = 100;

function criarSchema(escolherEscola: boolean) {
  return z.object({
    titulo: z
      .string()
      .trim()
      .min(5, 'O título precisa ter pelo menos 5 caracteres.')
      .max(120, 'O título pode ter no máximo 120 caracteres.'),
    descricao: z
      .string()
      .trim()
      .min(10, 'Descreva o problema com pelo menos 10 caracteres.')
      .max(2000, 'A descrição pode ter no máximo 2000 caracteres.'),
    prioridade: z.enum(PRIORIDADES as [Prioridade, ...Prioridade[]]),
    categoriaId: z.string().min(1, 'Selecione a categoria.'),
    equipamentoId: z.string(),
    // Só o admin escolhe a escola; o solicitante abre sempre na dele.
    escolaId: escolherEscola ? z.string().min(1, 'Selecione a escola.') : z.string(),
  });
}

type Formulario = z.infer<ReturnType<typeof criarSchema>>;

const CAMPOS = ['titulo', 'descricao', 'prioridade', 'categoriaId', 'equipamentoId', 'escolaId'];
const VAZIO: Formulario = {
  titulo: '',
  descricao: '',
  prioridade: 'MEDIA',
  categoriaId: '',
  equipamentoId: '',
  escolaId: '',
};

// Escola só para o admin (GET /escolas é dele).
function SelectEscola({ erro, registro }: { erro?: string; registro: UseFormRegisterReturn }) {
  const escolas = useOpcoesEscolas();
  return (
    <CampoSelect id="escolaId" rotulo="Escola" obrigatorio erro={erro} {...registro}>
      <option value="">{escolas.carregando ? 'Carregando…' : 'Selecione…'}</option>
      {escolas.opcoes.map((escola) => (
        <option key={escola.id} value={escola.id}>
          {escola.nome}
        </option>
      ))}
    </CampoSelect>
  );
}

export default function AbrirChamadoPage() {
  const { usuario } = useAuth();
  const escolherEscola = usuario?.perfil === 'ADMIN';
  const navigate = useNavigate();
  const abrir = useAbrirChamado();

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(criarSchema(escolherEscola)),
    defaultValues: VAZIO,
  });

  const escolaId = useWatch({ control, name: 'escolaId' });
  const categorias = useListaCategorias({ porPagina: LIMITE_OPCOES });
  // Para o solicitante a API já devolve só os equipamentos da escola dele.
  const aguardandoEscola = escolherEscola && !escolaId;
  const equipamentos = useListaEquipamentos(
    { porPagina: LIMITE_OPCOES, ativo: 'ativos', escolaId: escolaId || undefined },
    !aguardandoEscola,
  );

  async function aoEnviar(dados: Formulario) {
    try {
      const chamado = await abrir.mutateAsync({
        titulo: dados.titulo,
        descricao: dados.descricao,
        prioridade: dados.prioridade,
        categoriaId: Number(dados.categoriaId),
        equipamentoId: dados.equipamentoId ? Number(dados.equipamentoId) : null,
        escolaId: dados.escolaId ? Number(dados.escolaId) : null,
      });
      navigate(`/chamados/${chamado.id}`, {
        state: { mensagem: 'Chamado aberto com sucesso. A equipe técnica já pode vê-lo.' },
      });
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, CAMPOS);
    }
  }

  function textoOpcaoEquipamento() {
    if (aguardandoEscola) return 'Selecione a escola primeiro';
    if (equipamentos.isPending) return 'Carregando…';
    return 'Nenhum / não se aplica';
  }

  return (
    <section className="max-w-2xl">
      <CabecalhoPagina
        titulo="Abrir chamado"
        descricao="Descreva o problema. A equipe técnica acompanha tudo pelo histórico do chamado."
      />

      <form
        onSubmit={handleSubmit(aoEnviar)}
        noValidate
        className="space-y-4 rounded-lg bg-white p-6 ring-1 ring-slate-200"
      >
        {errors.root && <Alerta tipo="erro">{errors.root.message}</Alerta>}

        {escolherEscola && (
          <SelectEscola
            erro={errors.escolaId?.message}
            registro={register('escolaId', {
              // Os equipamentos dependem da escola: trocar a escola limpa a escolha.
              onChange: () => setValue('equipamentoId', ''),
            })}
          />
        )}

        <CampoTexto
          id="titulo"
          rotulo="Título"
          obrigatorio
          placeholder="Ex.: Impressora da secretaria não liga"
          erro={errors.titulo?.message}
          {...register('titulo')}
        />

        <CampoAreaTexto
          id="descricao"
          rotulo="Descrição"
          obrigatorio
          rows={5}
          dica="O que acontece, desde quando e onde fica o equipamento."
          erro={errors.descricao?.message}
          {...register('descricao')}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelect
            id="categoriaId"
            rotulo="Categoria"
            obrigatorio
            erro={errors.categoriaId?.message}
            {...register('categoriaId')}
          >
            <option value="">{categorias.isPending ? 'Carregando…' : 'Selecione…'}</option>
            {categorias.data?.dados.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>
                {categoria.nome}
              </option>
            ))}
          </CampoSelect>

          <CampoSelect
            id="prioridade"
            rotulo="Prioridade"
            obrigatorio
            erro={errors.prioridade?.message}
            {...register('prioridade')}
          >
            {PRIORIDADES.map((prioridade) => (
              <option key={prioridade} value={prioridade}>
                {ROTULO_PRIORIDADE[prioridade]}
              </option>
            ))}
          </CampoSelect>
        </div>

        <CampoSelect
          id="equipamentoId"
          rotulo="Equipamento"
          dica="Opcional. Ajuda a equipe a identificar máquinas que quebram com frequência."
          disabled={aguardandoEscola}
          erro={errors.equipamentoId?.message}
          {...register('equipamentoId')}
        >
          <option value="">{textoOpcaoEquipamento()}</option>
          {equipamentos.data?.dados.map((equipamento) => (
            <option key={equipamento.id} value={equipamento.id}>
              {equipamento.patrimonio} · {equipamento.tipo}
              {equipamento.localizacao && ` (${equipamento.localizacao})`}
            </option>
          ))}
        </CampoSelect>

        <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
          <LinkBotao variante="secundario" to="/chamados">
            Cancelar
          </LinkBotao>
          <Botao type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Enviando…' : 'Abrir chamado'}
          </Botao>
        </div>
      </form>
    </section>
  );
}
