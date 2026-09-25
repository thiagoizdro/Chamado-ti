import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { useAssumirChamado, useMudarStatusChamado } from '../../hooks/useChamados';
import { mensagemDoErro } from '../../lib/api';
import { type DestinoStatus, PROXIMOS_STATUS, ROTULO_ACAO_STATUS } from '../../lib/chamados';
import { aplicarErrosDaApi } from '../../lib/formulario';
import type { ChamadoDetalhe } from '../../types/chamado';
import { Alerta } from '../ui/Alerta';
import { Botao } from '../ui/Botao';
import { CampoAreaTexto } from '../ui/Campo';

// Resolver exige a solução; nas outras transições o texto é uma observação opcional.
function schemaDoStatus(destino: DestinoStatus) {
  const texto = z.string().trim().max(2000, 'O texto pode ter no máximo 2000 caracteres.');
  return z.object({
    texto:
      destino === 'RESOLVIDO'
        ? texto.min(5, 'Descreva a solução (pelo menos 5 caracteres).')
        : texto,
  });
}

type FormularioStatus = { texto: string };

function FormularioMudarStatus({
  chamadoId,
  destino,
  aoConcluir,
  aoCancelar,
}: {
  chamadoId: number;
  destino: DestinoStatus;
  aoConcluir: () => void;
  aoCancelar: () => void;
}) {
  const mudarStatus = useMudarStatusChamado(chamadoId);
  const resolvendo = destino === 'RESOLVIDO';
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormularioStatus>({
    resolver: zodResolver(schemaDoStatus(destino)),
    defaultValues: { texto: '' },
  });

  async function aoEnviar({ texto }: FormularioStatus) {
    try {
      await mudarStatus.mutateAsync(
        resolvendo
          ? { status: destino, solucao: texto }
          : { status: destino, observacao: texto || undefined },
      );
      aoConcluir();
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, []);
    }
  }

  return (
    <form onSubmit={handleSubmit(aoEnviar)} noValidate className="mt-4 space-y-3">
      {errors.root && <Alerta tipo="erro">{errors.root.message}</Alerta>}
      <CampoAreaTexto
        id="texto-status"
        rotulo={resolvendo ? 'Solução aplicada' : 'Observação'}
        obrigatorio={resolvendo}
        dica={
          resolvendo
            ? 'O que foi feito para resolver. Fica registrado no chamado e no histórico do equipamento.'
            : 'Opcional. Ex.: peça pedida, previsão de chegada.'
        }
        erro={errors.texto?.message}
        autoFocus
        {...register('texto')}
      />
      <div className="flex justify-end gap-2">
        <Botao variante="secundario" onClick={aoCancelar} disabled={isSubmitting}>
          Cancelar
        </Botao>
        <Botao type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando…' : ROTULO_ACAO_STATUS[destino]}
        </Botao>
      </div>
    </form>
  );
}

// Botões de atendimento (técnico e admin), conforme o status atual.
export function AcoesDoChamado({ chamado }: { chamado: ChamadoDetalhe }) {
  const assumir = useAssumirChamado();
  const [destino, setDestino] = useState<DestinoStatus | null>(null);
  const [sucesso, setSucesso] = useState<string | null>(null);

  const podeAssumir = chamado.status === 'ABERTO' && !chamado.tecnico;
  const destinos = chamado.tecnico ? PROXIMOS_STATUS[chamado.status] : [];

  if (!podeAssumir && destinos.length === 0) return null;

  async function aoAssumir() {
    setSucesso(null);
    try {
      await assumir.mutateAsync(chamado.id);
      setSucesso('Chamado assumido. Ele agora está na sua fila.');
    } catch {
      // O erro aparece pelo assumir.error logo abaixo.
    }
  }

  function escolherDestino(novo: DestinoStatus) {
    setSucesso(null);
    setDestino(novo);
  }

  return (
    <section
      aria-labelledby="titulo-atendimento"
      className="rounded-lg bg-white p-6 ring-1 ring-slate-200"
    >
      <h2 id="titulo-atendimento" className="text-lg font-semibold text-slate-900">
        Atendimento
      </h2>

      <div className="mt-3 space-y-3">
        {sucesso && <Alerta tipo="sucesso">{sucesso}</Alerta>}
        {assumir.isError && (
          <Alerta tipo="erro">
            {mensagemDoErro(assumir.error, 'Não foi possível assumir o chamado.')}
          </Alerta>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {podeAssumir && (
          <Botao onClick={() => void aoAssumir()} disabled={assumir.isPending}>
            {assumir.isPending ? 'Assumindo…' : 'Assumir chamado'}
          </Botao>
        )}
        {destinos.map((opcao) => (
          <Botao
            key={opcao}
            variante={opcao === 'RESOLVIDO' ? 'primario' : 'secundario'}
            aria-pressed={destino === opcao}
            onClick={() => escolherDestino(opcao)}
          >
            {ROTULO_ACAO_STATUS[opcao]}
          </Botao>
        ))}
      </div>

      {destino && (
        <FormularioMudarStatus
          // key: troca de ação recomeça o formulário limpo.
          key={destino}
          chamadoId={chamado.id}
          destino={destino}
          aoConcluir={() => {
            setDestino(null);
            setSucesso('Status atualizado.');
          }}
          aoCancelar={() => setDestino(null)}
        />
      )}
    </section>
  );
}
