import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useComentarChamado } from '../../hooks/useChamados';
import { aplicarErrosDaApi } from '../../lib/formulario';
import { Alerta } from '../ui/Alerta';
import { Botao } from '../ui/Botao';
import { CampoAreaTexto } from '../ui/Campo';

const comentarioSchema = z.object({
  texto: z
    .string()
    .trim()
    .min(2, 'Escreva o comentário.')
    .max(2000, 'O comentário pode ter no máximo 2000 caracteres.'),
});

type Formulario = z.infer<typeof comentarioSchema>;

export function FormularioComentario({ chamadoId }: { chamadoId: number }) {
  const comentar = useComentarChamado(chamadoId);
  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(comentarioSchema),
    defaultValues: { texto: '' },
  });

  async function aoEnviar({ texto }: Formulario) {
    try {
      await comentar.mutateAsync(texto);
      reset();
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, ['texto']);
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="mt-6 space-y-3">
      {errors.root && <Alerta tipo="erro">{errors.root.message}</Alerta>}
      <CampoAreaTexto
        id="comentario"
        rotulo="Adicionar comentário"
        rows={3}
        erro={errors.texto?.message}
        {...register('texto')}
      />
      <div className="flex justify-end">
        <Botao type="submit" variante="secundario" disabled={isSubmitting}>
          {isSubmitting ? 'Enviando…' : 'Comentar'}
        </Botao>
      </div>
    </form>
  );
}
