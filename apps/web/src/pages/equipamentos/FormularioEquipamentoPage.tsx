import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { z } from 'zod';

import { RodapeFormulario } from '../../components/RodapeFormulario';
import { Alerta } from '../../components/ui/Alerta';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoSelect, CampoTexto } from '../../components/ui/Campo';
import { EstadoCarregando, EstadoErro } from '../../components/ui/Estados';
import { useEquipamento, useSalvarEquipamento } from '../../hooks/useEquipamentos';
import { useOpcoesEscolas } from '../../hooks/useOpcoesEscolas';
import { mensagemDoErro } from '../../lib/api';
import { aplicarErrosDaApi } from '../../lib/formulario';
import type { Equipamento } from '../../types/cadastros';

// Sugestões para o campo "Tipo" (o usuário pode digitar outro).
const TIPOS_COMUNS = [
  'Computador',
  'Notebook',
  'Impressora',
  'Projetor',
  'Roteador',
  'Telefone IP',
];

const equipamentoSchema = z.object({
  patrimonio: z
    .string()
    .trim()
    .min(3, 'O patrimônio precisa ter pelo menos 3 caracteres.')
    .max(30, 'O patrimônio pode ter no máximo 30 caracteres.'),
  tipo: z.string().trim().min(2, 'Informe o tipo.').max(60),
  marca: z.string().trim().max(255),
  modelo: z.string().trim().max(255),
  localizacao: z.string().trim().max(255),
  escolaId: z.string().min(1, 'Selecione a escola.'),
});

type Formulario = z.infer<typeof equipamentoSchema>;

const CAMPOS = ['patrimonio', 'tipo', 'marca', 'modelo', 'localizacao', 'escolaId'];
const VAZIO: Formulario = {
  patrimonio: '',
  tipo: '',
  marca: '',
  modelo: '',
  localizacao: '',
  escolaId: '',
};

function paraFormulario(equipamento: Equipamento): Formulario {
  return {
    patrimonio: equipamento.patrimonio,
    tipo: equipamento.tipo,
    marca: equipamento.marca ?? '',
    modelo: equipamento.modelo ?? '',
    localizacao: equipamento.localizacao ?? '',
    escolaId: String(equipamento.escolaId),
  };
}

export default function FormularioEquipamentoPage() {
  const { id: idNaUrl } = useParams();
  const id = idNaUrl ? Number(idNaUrl) : undefined;
  const editando = id !== undefined;

  const equipamento = useEquipamento(id);
  const escolas = useOpcoesEscolas(equipamento.data?.escola);
  const salvar = useSalvarEquipamento();
  const navigate = useNavigate();

  // Regra da API: equipamento com chamados não muda de escola.
  const escolaTravada = (equipamento.data?._count.chamados ?? 0) > 0;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(equipamentoSchema),
    defaultValues: VAZIO,
    values: equipamento.data ? paraFormulario(equipamento.data) : undefined,
  });

  async function aoEnviar(dados: Formulario) {
    try {
      const salvo = await salvar.mutateAsync({
        id,
        dados: {
          patrimonio: dados.patrimonio,
          tipo: dados.tipo,
          marca: dados.marca || null,
          modelo: dados.modelo || null,
          localizacao: dados.localizacao || null,
          escolaId: Number(dados.escolaId),
        },
      });
      navigate(editando ? `/equipamentos/${salvo.id}` : '/equipamentos', {
        state: { mensagem: 'Equipamento salvo com sucesso.' },
      });
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, CAMPOS);
    }
  }

  if (editando && equipamento.isPending) return <EstadoCarregando />;
  if (editando && equipamento.isError) {
    return (
      <EstadoErro mensagem={mensagemDoErro(equipamento.error, 'Equipamento não encontrado.')} />
    );
  }

  return (
    <section className="max-w-2xl">
      <CabecalhoPagina titulo={editando ? 'Editar equipamento' : 'Novo equipamento'} />

      <form
        onSubmit={handleSubmit(aoEnviar)}
        noValidate
        className="space-y-4 rounded-lg bg-white p-6 ring-1 ring-slate-200"
      >
        {errors.root && <Alerta tipo="erro">{errors.root.message}</Alerta>}

        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            id="patrimonio"
            rotulo="Patrimônio"
            obrigatorio
            dica="Ex.: PAT-000123"
            erro={errors.patrimonio?.message}
            {...register('patrimonio')}
          />
          <CampoTexto
            id="tipo"
            rotulo="Tipo"
            obrigatorio
            list="tipos-equipamento"
            erro={errors.tipo?.message}
            {...register('tipo')}
          />
          <datalist id="tipos-equipamento">
            {TIPOS_COMUNS.map((tipo) => (
              <option key={tipo} value={tipo} />
            ))}
          </datalist>
          <CampoTexto
            id="marca"
            rotulo="Marca"
            erro={errors.marca?.message}
            {...register('marca')}
          />
          <CampoTexto
            id="modelo"
            rotulo="Modelo"
            erro={errors.modelo?.message}
            {...register('modelo')}
          />
        </div>

        {escolaTravada ? (
          // Somente leitura (um select desabilitado sairia vazio no envio).
          <CampoTexto
            id="escolaId"
            rotulo="Escola"
            value={equipamento.data?.escola.nome ?? ''}
            readOnly
            dica="Este equipamento já tem chamados e não pode mudar de escola."
          />
        ) : (
          <CampoSelect
            id="escolaId"
            rotulo="Escola"
            obrigatorio
            erro={errors.escolaId?.message}
            {...register('escolaId')}
          >
            <option value="">{escolas.carregando ? 'Carregando…' : 'Selecione…'}</option>
            {escolas.opcoes.map((escola) => (
              <option key={escola.id} value={escola.id}>
                {escola.nome}
              </option>
            ))}
          </CampoSelect>
        )}

        <CampoTexto
          id="localizacao"
          rotulo="Localização na escola"
          placeholder="Ex.: Secretaria, Laboratório de Informática"
          erro={errors.localizacao?.message}
          {...register('localizacao')}
        />

        <RodapeFormulario
          enviando={isSubmitting}
          voltarPara={editando ? `/equipamentos/${id}` : '/equipamentos'}
        />
      </form>
    </section>
  );
}
