import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { z } from 'zod';

import { RodapeFormulario } from '../../components/RodapeFormulario';
import { Alerta } from '../../components/ui/Alerta';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoTexto } from '../../components/ui/Campo';
import { EstadoCarregando, EstadoErro } from '../../components/ui/Estados';
import { useCategoria, useSalvarCategoria } from '../../hooks/useCategorias';
import { mensagemDoErro } from '../../lib/api';
import { aplicarErrosDaApi } from '../../lib/formulario';

const categoriaSchema = z.object({
  nome: z.string().trim().min(2, 'O nome precisa ter pelo menos 2 caracteres.').max(60),
});

type Formulario = z.infer<typeof categoriaSchema>;

const CAMPOS = ['nome'];

export default function FormularioCategoriaPage() {
  const { id: idNaUrl } = useParams();
  const id = idNaUrl ? Number(idNaUrl) : undefined;
  const editando = id !== undefined;

  const categoria = useCategoria(id);
  const salvar = useSalvarCategoria();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(categoriaSchema),
    defaultValues: { nome: '' },
    values: categoria.data ? { nome: categoria.data.nome } : undefined,
  });

  async function aoEnviar(dados: Formulario) {
    try {
      await salvar.mutateAsync({ id, dados });
      navigate('/categorias', { state: { mensagem: 'Categoria salva com sucesso.' } });
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, CAMPOS);
    }
  }

  if (editando && categoria.isPending) return <EstadoCarregando />;
  if (editando && categoria.isError) {
    return <EstadoErro mensagem={mensagemDoErro(categoria.error, 'Categoria não encontrada.')} />;
  }

  return (
    <section className="max-w-2xl">
      <CabecalhoPagina titulo={editando ? 'Editar categoria' : 'Nova categoria'} />

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

        <RodapeFormulario enviando={isSubmitting} voltarPara="/categorias" />
      </form>
    </section>
  );
}
