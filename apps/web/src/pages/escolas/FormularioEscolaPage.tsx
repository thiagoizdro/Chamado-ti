import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { z } from 'zod';

import { RodapeFormulario } from '../../components/RodapeFormulario';
import { Alerta } from '../../components/ui/Alerta';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoTexto } from '../../components/ui/Campo';
import { EstadoCarregando, EstadoErro } from '../../components/ui/Estados';
import { useEscola, useSalvarEscola } from '../../hooks/useEscolas';
import { mensagemDoErro } from '../../lib/api';
import { aplicarErrosDaApi } from '../../lib/formulario';
import type { Escola } from '../../types/cadastros';

const escolaSchema = z.object({
  nome: z.string().trim().min(3, 'O nome precisa ter pelo menos 3 caracteres.').max(150),
  codigoInep: z
    .string()
    .trim()
    .regex(/^(\d{8})?$/, 'O código INEP tem 8 dígitos.'),
  endereco: z.string().trim().max(255),
});

type Formulario = z.infer<typeof escolaSchema>;

const CAMPOS = ['nome', 'codigoInep', 'endereco'];
const VAZIO: Formulario = { nome: '', codigoInep: '', endereco: '' };

function paraFormulario(escola: Escola): Formulario {
  return {
    nome: escola.nome,
    codigoInep: escola.codigoInep ?? '',
    endereco: escola.endereco ?? '',
  };
}

export default function FormularioEscolaPage() {
  const { id: idNaUrl } = useParams();
  const id = idNaUrl ? Number(idNaUrl) : undefined;
  const editando = id !== undefined;

  const escola = useEscola(id);
  const salvar = useSalvarEscola();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(escolaSchema),
    defaultValues: VAZIO,
    // Preenche o formulário quando os dados da escola chegam.
    values: escola.data ? paraFormulario(escola.data) : undefined,
  });

  async function aoEnviar(dados: Formulario) {
    try {
      await salvar.mutateAsync({
        id,
        dados: {
          nome: dados.nome,
          codigoInep: dados.codigoInep || null,
          endereco: dados.endereco || null,
        },
      });
      navigate('/escolas', { state: { mensagem: 'Escola salva com sucesso.' } });
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, CAMPOS);
    }
  }

  if (editando && escola.isPending) return <EstadoCarregando />;
  if (editando && escola.isError) {
    return <EstadoErro mensagem={mensagemDoErro(escola.error, 'Escola não encontrada.')} />;
  }

  return (
    <section className="max-w-2xl">
      <CabecalhoPagina titulo={editando ? 'Editar escola' : 'Nova escola'} />

      <form
        onSubmit={handleSubmit(aoEnviar)}
        noValidate
        className="space-y-4 rounded-lg bg-white p-6 ring-1 ring-slate-200"
      >
        {errors.root && <Alerta tipo="erro">{errors.root.message}</Alerta>}

        <CampoTexto
          id="nome"
          rotulo="Nome"
          obrigatorio
          erro={errors.nome?.message}
          {...register('nome')}
        />
        <CampoTexto
          id="codigoInep"
          rotulo="Código INEP"
          inputMode="numeric"
          dica="Opcional. 8 dígitos."
          erro={errors.codigoInep?.message}
          {...register('codigoInep')}
        />
        <CampoTexto
          id="endereco"
          rotulo="Endereço"
          erro={errors.endereco?.message}
          {...register('endereco')}
        />

        <RodapeFormulario enviando={isSubmitting} voltarPara="/escolas" />
      </form>
    </section>
  );
}
