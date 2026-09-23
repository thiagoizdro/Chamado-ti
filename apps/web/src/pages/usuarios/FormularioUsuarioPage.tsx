import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router';
import { z } from 'zod';

import { RodapeFormulario } from '../../components/RodapeFormulario';
import { Alerta } from '../../components/ui/Alerta';
import { CabecalhoPagina } from '../../components/ui/CabecalhoPagina';
import { CampoSelect, CampoTexto } from '../../components/ui/Campo';
import { EstadoCarregando, EstadoErro } from '../../components/ui/Estados';
import { useAuth } from '../../hooks/useAuth';
import { useOpcoesEscolas } from '../../hooks/useOpcoesEscolas';
import { useSalvarUsuario, useUsuario } from '../../hooks/useUsuarios';
import { mensagemDoErro } from '../../lib/api';
import { aplicarErrosDaApi } from '../../lib/formulario';
import { ROTULO_PERFIL } from '../../lib/navegacao';
import type { Usuario } from '../../types/cadastros';
import type { Perfil } from '../../types/usuario';

const MINIMO_SENHA = 8;
const mensagemSenhaCurta = `A senha precisa ter pelo menos ${MINIMO_SENHA} caracteres.`;

// Na edição a senha é opcional (vazia = manter a atual).
function criarSchema(editando: boolean) {
  return z
    .object({
      nome: z.string().trim().min(3, 'O nome precisa ter pelo menos 3 caracteres.').max(120),
      email: z
        .string()
        .trim()
        .min(1, 'Informe o e-mail.')
        .pipe(z.email('Informe um e-mail válido.')),
      perfil: z.string().min(1, 'Selecione o perfil.'),
      escolaId: z.string(),
      senha: editando
        ? z
            .string()
            .refine((senha) => senha === '' || senha.length >= MINIMO_SENHA, mensagemSenhaCurta)
        : z.string().min(MINIMO_SENHA, mensagemSenhaCurta),
    })
    .superRefine(({ perfil, escolaId }, contexto) => {
      if (perfil === 'SOLICITANTE' && !escolaId) {
        contexto.addIssue({
          code: 'custom',
          path: ['escolaId'],
          message: 'Selecione a escola do solicitante.',
        });
      }
    });
}

type Formulario = z.infer<ReturnType<typeof criarSchema>>;

const CAMPOS = ['nome', 'email', 'perfil', 'escolaId', 'senha'];
const VAZIO: Formulario = { nome: '', email: '', perfil: '', escolaId: '', senha: '' };

function paraFormulario(usuario: Usuario): Formulario {
  return {
    nome: usuario.nome,
    email: usuario.email,
    perfil: usuario.perfil,
    escolaId: usuario.escolaId ? String(usuario.escolaId) : '',
    senha: '',
  };
}

export default function FormularioUsuarioPage() {
  const { id: idNaUrl } = useParams();
  const id = idNaUrl ? Number(idNaUrl) : undefined;
  const editando = id !== undefined;

  const { usuario: eu } = useAuth();
  const editandoASiMesmo = editando && id === eu?.id;

  const usuario = useUsuario(id);
  const escolas = useOpcoesEscolas(usuario.data?.escola);
  const salvar = useSalvarUsuario();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Formulario>({
    resolver: zodResolver(criarSchema(editando)),
    defaultValues: VAZIO,
    values: usuario.data ? paraFormulario(usuario.data) : undefined,
  });

  const perfil = useWatch({ control, name: 'perfil' });
  const ehSolicitante = perfil === 'SOLICITANTE';

  async function aoEnviar(dados: Formulario) {
    try {
      await salvar.mutateAsync({
        id,
        dados: {
          nome: dados.nome,
          email: dados.email,
          perfil: dados.perfil as Perfil,
          // Só solicitante tem escola (regra da API).
          escolaId: dados.perfil === 'SOLICITANTE' ? Number(dados.escolaId) : null,
          senha: dados.senha || undefined,
        },
      });
      navigate('/usuarios', { state: { mensagem: 'Usuário salvo com sucesso.' } });
    } catch (erro) {
      aplicarErrosDaApi(erro, setError, CAMPOS);
    }
  }

  if (editando && usuario.isPending) return <EstadoCarregando />;
  if (editando && usuario.isError) {
    return <EstadoErro mensagem={mensagemDoErro(usuario.error, 'Usuário não encontrado.')} />;
  }

  return (
    <section className="max-w-2xl">
      <CabecalhoPagina titulo={editando ? 'Editar usuário' : 'Novo usuário'} />

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
          autoComplete="off"
          erro={errors.nome?.message}
          {...register('nome')}
        />
        <CampoTexto
          id="email"
          rotulo="E-mail"
          type="email"
          obrigatorio
          autoComplete="off"
          erro={errors.email?.message}
          {...register('email')}
        />
        {editandoASiMesmo ? (
          // Campo desabilitado sairia vazio no envio; aqui o perfil só é exibido
          // e o valor continua no estado do formulário.
          <CampoTexto
            id="perfil"
            rotulo="Perfil"
            value={ROTULO_PERFIL[perfil as Perfil] ?? perfil}
            readOnly
            dica="Você não pode alterar o próprio perfil."
          />
        ) : (
          <CampoSelect
            id="perfil"
            rotulo="Perfil"
            obrigatorio
            erro={errors.perfil?.message}
            {...register('perfil')}
          >
            <option value="">Selecione…</option>
            <option value="SOLICITANTE">{ROTULO_PERFIL.SOLICITANTE}</option>
            <option value="TECNICO">{ROTULO_PERFIL.TECNICO}</option>
            <option value="ADMIN">{ROTULO_PERFIL.ADMIN}</option>
          </CampoSelect>
        )}

        {ehSolicitante && (
          <CampoSelect
            id="escolaId"
            rotulo="Escola"
            obrigatorio
            dica={escolas.erro ? 'Não foi possível carregar as escolas.' : undefined}
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
          id="senha"
          rotulo={editando ? 'Nova senha' : 'Senha'}
          type="password"
          obrigatorio={!editando}
          autoComplete="new-password"
          dica={
            editando
              ? 'Deixe em branco para manter a senha atual.'
              : `Mínimo de ${MINIMO_SENHA} caracteres.`
          }
          erro={errors.senha?.message}
          {...register('senha')}
        />

        <RodapeFormulario enviando={isSubmitting} voltarPara="/usuarios" />
      </form>
    </section>
  );
}
