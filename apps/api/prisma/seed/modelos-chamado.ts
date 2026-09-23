import type { NomeCategoria } from './dados.js';

type Problema = { titulo: string; descricao: string };

type ModeloCategoria = {
  problemas: Problema[];
  solucoes: string[];
  // Peças que podem deixar o chamado em AGUARDANDO_PECA (vazio = nunca espera peça)
  pecas: string[];
};

export const MODELOS_POR_CATEGORIA: Record<NomeCategoria, ModeloCategoria> = {
  Impressora: {
    problemas: [
      {
        titulo: 'Impressora não puxa papel',
        descricao:
          'A impressora da secretaria faz barulho, mas não puxa a folha. Já trocamos o papel e o problema continua.',
      },
      {
        titulo: 'Impressão saindo manchada',
        descricao:
          'As folhas estão saindo com faixas pretas na lateral. Precisamos imprimir as avaliações desta semana.',
      },
      {
        titulo: 'Papel enroscando na impressora',
        descricao: 'O papel enrosca toda vez que imprimimos frente e verso.',
      },
      {
        titulo: 'Impressora não aparece na rede',
        descricao: 'Os computadores da sala dos professores não encontram mais a impressora.',
      },
    ],
    solucoes: [
      'Rolete de tração limpo e ajustado. Impressão testada com 20 folhas sem falhas.',
      'Cilindro substituído e impressora recalibrada.',
      'Fragmento de papel removido do fusor. Orientado o uso de papel 75 g/m².',
      'IP fixo configurado na impressora e fila reinstalada nos computadores.',
    ],
    pecas: ['cilindro de imagem', 'rolete de tração', 'toner'],
  },
  'Rede/Internet': {
    problemas: [
      {
        titulo: 'Sem internet na escola',
        descricao: 'Desde o início da manhã nenhum computador acessa a internet.',
      },
      {
        titulo: 'Wi-Fi caindo toda hora',
        descricao: 'A rede sem fio desconecta várias vezes por hora, principalmente no intervalo.',
      },
      {
        titulo: 'Internet muito lenta no laboratório',
        descricao: 'As páginas demoram minutos para abrir no laboratório de informática.',
      },
      {
        titulo: 'Ponto de rede sem sinal na secretaria',
        descricao: 'O computador da secretaria mostra "cabo de rede desconectado".',
      },
    ],
    solucoes: [
      'Roteador reiniciado e firmware atualizado. Link normalizado.',
      'Canal do Wi-Fi alterado para evitar interferência e potência ajustada.',
      'Cabo de rede refeito e conector RJ45 substituído.',
      'Chamado aberto com a operadora; link restabelecido após troca do modem.',
    ],
    pecas: ['roteador de reposição', 'fonte do roteador'],
  },
  Computador: {
    problemas: [
      {
        titulo: 'Computador não liga',
        descricao: 'O computador não dá nenhum sinal ao apertar o botão de ligar.',
      },
      {
        titulo: 'Computador muito lento',
        descricao: 'Demora mais de 10 minutos para iniciar e trava ao abrir o navegador.',
      },
      {
        titulo: 'Tela azul ao iniciar',
        descricao: 'O computador reinicia sozinho com tela azul logo depois de ligar.',
      },
      {
        titulo: 'Computador desligando sozinho',
        descricao: 'Desliga sem aviso depois de alguns minutos de uso.',
      },
    ],
    solucoes: [
      'Fonte de alimentação substituída. Equipamento testado por 1 hora.',
      'Disco substituído por SSD e sistema reinstalado.',
      'Memória RAM reassentada e teste de memória sem erros.',
      'Limpeza interna e troca da pasta térmica do processador.',
    ],
    pecas: ['fonte de alimentação', 'SSD de 240 GB', 'pente de memória'],
  },
  Projetor: {
    problemas: [
      {
        titulo: 'Projetor não liga',
        descricao: 'O projetor não liga; a luz de alerta fica piscando em vermelho.',
      },
      {
        titulo: 'Imagem do projetor escura',
        descricao: 'A imagem está muito escura mesmo com as luzes da sala apagadas.',
      },
      {
        titulo: 'Projetor sem sinal do notebook',
        descricao: 'O projetor mostra "sem sinal" ao conectar o notebook pelo HDMI.',
      },
    ],
    solucoes: [
      'Lâmpada substituída e contador de horas zerado.',
      'Filtro de ar limpo; superaquecimento resolvido.',
      'Cabo HDMI substituído e resolução do notebook ajustada.',
    ],
    pecas: ['lâmpada do projetor', 'cabo HDMI de 10 m'],
  },
  Software: {
    problemas: [
      {
        titulo: 'Sistema de notas não abre',
        descricao: 'O sistema de lançamento de notas mostra erro ao fazer login.',
      },
      {
        titulo: 'Pacote Office pedindo ativação',
        descricao: 'O Word e o Excel abrem em modo somente leitura pedindo ativação.',
      },
      {
        titulo: 'Instalação de programa educativo',
        descricao: 'Precisamos instalar o programa de matemática nos computadores do laboratório.',
      },
      {
        titulo: 'Navegador abrindo propagandas',
        descricao: 'O navegador abre páginas de propaganda sozinho.',
      },
    ],
    solucoes: [
      'Certificado do sistema atualizado e cache do navegador limpo.',
      'Licença reativada com a conta institucional.',
      'Programa instalado em todas as máquinas do laboratório.',
      'Extensões maliciosas removidas e antivírus atualizado.',
    ],
    pecas: [],
  },
  Periféricos: {
    problemas: [
      {
        titulo: 'Teclado com teclas falhando',
        descricao: 'Várias teclas do teclado não funcionam.',
      },
      {
        titulo: 'Mouse não funciona',
        descricao: 'O mouse não responde em nenhuma porta USB.',
      },
      {
        titulo: 'Caixa de som sem áudio',
        descricao: 'A caixa de som não emite som durante as aulas.',
      },
    ],
    solucoes: [
      'Teclado substituído.',
      'Mouse substituído e portas USB testadas.',
      'Cabo P2 substituído e driver de áudio reinstalado.',
    ],
    pecas: ['teclado USB', 'mouse USB'],
  },
  Telefonia: {
    problemas: [
      {
        titulo: 'Telefone sem linha',
        descricao: 'O telefone da secretaria está mudo, sem tom de discagem.',
      },
      {
        titulo: 'Chamadas caindo',
        descricao: 'As ligações caem depois de poucos segundos.',
      },
    ],
    solucoes: [
      'Telefone reconfigurado no servidor de ramais.',
      'Cabo de rede do telefone substituído e ramal registrado novamente.',
    ],
    pecas: ['fonte PoE do telefone'],
  },
  Outros: {
    problemas: [
      {
        titulo: 'Criação de e-mail institucional',
        descricao: 'Nova coordenadora precisa de e-mail institucional.',
      },
      {
        titulo: 'Troca de senha do sistema',
        descricao: 'Professor esqueceu a senha de acesso ao computador da sala.',
      },
      {
        titulo: 'Apoio para evento na escola',
        descricao: 'Precisamos de apoio com som e projeção para a reunião de pais.',
      },
    ],
    solucoes: [
      'Conta criada e credenciais entregues à direção.',
      'Senha redefinida e usuário orientado.',
      'Equipamentos instalados e testados antes do evento.',
    ],
    pecas: [],
  },
};

export const COMENTARIOS_TECNICO = [
  'Visita agendada para amanhã pela manhã.',
  'Equipamento testado no local; seguimos investigando.',
  'Solicitei à escola que não desligue o equipamento até a visita.',
  'Acesso remoto realizado para diagnóstico inicial.',
  'Contato feito com a direção para confirmar o horário da visita.',
];

// Categoria provável de um chamado a partir do tipo do equipamento.
// Repetir uma categoria aumenta a chance dela ser sorteada.
export const CATEGORIAS_POR_TIPO: Record<string, NomeCategoria[]> = {
  Computador: ['Computador', 'Computador', 'Computador', 'Software', 'Software', 'Periféricos'],
  Notebook: ['Computador', 'Computador', 'Software'],
  Impressora: ['Impressora'],
  Projetor: ['Projetor'],
  Roteador: ['Rede/Internet'],
  'Telefone IP': ['Telefonia'],
};

// Categorias de chamados que não apontam para um equipamento específico.
export const CATEGORIAS_SEM_EQUIPAMENTO: NomeCategoria[] = [
  'Rede/Internet',
  'Software',
  'Periféricos',
  'Outros',
];
