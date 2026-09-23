import type { NomeCategoria } from './dados.js';

// Cada problema traz as soluções que fazem sentido para ele. Uma solução pode
// depender de uma peça: só nesse caso o chamado pode passar por
// AGUARDANDO_PECA (e a peça esperada é a que a solução usa).
export type Solucao = { texto: string; peca?: string };

export type Problema = {
  titulo: string;
  descricao: string;
  solucoes: Solucao[];
};

export const PROBLEMAS_POR_CATEGORIA: Record<NomeCategoria, Problema[]> = {
  Impressora: [
    {
      titulo: 'Impressora não puxa papel',
      descricao:
        'A impressora da secretaria faz barulho, mas não puxa a folha. Já trocamos o papel e o problema continua.',
      solucoes: [
        { texto: 'Rolete de tração limpo e ajustado. Impressão testada com 20 folhas sem falhas.' },
        { texto: 'Rolete de tração substituído e bandeja realinhada.', peca: 'rolete de tração' },
      ],
    },
    {
      titulo: 'Impressão saindo manchada',
      descricao:
        'As folhas estão saindo com faixas pretas na lateral. Precisamos imprimir as avaliações desta semana.',
      solucoes: [
        { texto: 'Cilindro substituído e impressora recalibrada.', peca: 'cilindro de imagem' },
        { texto: 'Toner trocado e limpeza interna realizada.', peca: 'toner' },
      ],
    },
    {
      titulo: 'Papel enroscando na impressora',
      descricao: 'O papel enrosca toda vez que imprimimos frente e verso.',
      solucoes: [
        { texto: 'Fragmento de papel removido do fusor. Orientado o uso de papel 75 g/m².' },
        {
          texto: 'Unidade fusora substituída; frente e verso testado sem enroscos.',
          peca: 'unidade fusora',
        },
      ],
    },
    {
      titulo: 'Impressora não aparece na rede',
      descricao: 'Os computadores da sala dos professores não encontram mais a impressora.',
      solucoes: [
        { texto: 'IP fixo configurado na impressora e fila reinstalada nos computadores.' },
        { texto: 'Cabo de rede da impressora substituído e fila recriada.' },
      ],
    },
  ],
  'Rede/Internet': [
    {
      titulo: 'Sem internet na escola',
      descricao: 'Desde o início da manhã nenhum computador acessa a internet.',
      solucoes: [
        { texto: 'Chamado aberto com a operadora; link restabelecido após troca do modem.' },
        { texto: 'Roteador reiniciado e firmware atualizado. Link normalizado.' },
        { texto: 'Roteador substituído; link normalizado.', peca: 'roteador de reposição' },
      ],
    },
    {
      titulo: 'Wi-Fi caindo toda hora',
      descricao: 'A rede sem fio desconecta várias vezes por hora, principalmente no intervalo.',
      solucoes: [
        { texto: 'Canal do Wi-Fi alterado para evitar interferência e potência ajustada.' },
        { texto: 'Fonte do roteador substituída; conexão estável.', peca: 'fonte do roteador' },
      ],
    },
    {
      titulo: 'Internet muito lenta no laboratório',
      descricao: 'As páginas demoram minutos para abrir no laboratório de informática.',
      solucoes: [
        { texto: 'Controle de banda por máquina configurado no roteador.' },
        { texto: 'Atualizações automáticas agendadas para fora do horário de aula.' },
      ],
    },
    {
      titulo: 'Ponto de rede sem sinal na secretaria',
      descricao: 'O computador da secretaria mostra "cabo de rede desconectado".',
      solucoes: [
        { texto: 'Cabo de rede refeito e conector RJ45 substituído.' },
        { texto: 'Porta do switch com defeito; cabo remanejado para uma porta livre.' },
      ],
    },
  ],
  Computador: [
    {
      titulo: 'Computador não liga',
      descricao: 'O computador não dá nenhum sinal ao apertar o botão de ligar.',
      solucoes: [
        {
          texto: 'Fonte de alimentação substituída. Equipamento testado por 1 hora.',
          peca: 'fonte de alimentação',
        },
        { texto: 'Cabo de força com mau contato substituído.' },
      ],
    },
    {
      titulo: 'Computador muito lento',
      descricao: 'Demora mais de 10 minutos para iniciar e trava ao abrir o navegador.',
      solucoes: [
        { texto: 'Disco substituído por SSD e sistema reinstalado.', peca: 'SSD de 240 GB' },
        { texto: 'Programas de inicialização desativados e limpeza de disco realizada.' },
      ],
    },
    {
      titulo: 'Tela azul ao iniciar',
      descricao: 'O computador reinicia sozinho com tela azul logo depois de ligar.',
      solucoes: [
        { texto: 'Memória RAM reassentada e teste de memória sem erros.' },
        { texto: 'Pente de memória com defeito substituído.', peca: 'pente de memória' },
      ],
    },
    {
      titulo: 'Computador desligando sozinho',
      descricao: 'Desliga sem aviso depois de alguns minutos de uso.',
      solucoes: [
        { texto: 'Limpeza interna e troca da pasta térmica do processador.' },
        { texto: 'Cooler do processador substituído.', peca: 'cooler do processador' },
      ],
    },
  ],
  Projetor: [
    {
      titulo: 'Projetor não liga',
      descricao: 'O projetor não liga; a luz de alerta fica piscando em vermelho.',
      solucoes: [
        {
          texto: 'Lâmpada substituída e contador de horas zerado.',
          peca: 'lâmpada do projetor',
        },
        { texto: 'Cabo de alimentação interno reconectado; projetor voltou a ligar.' },
      ],
    },
    {
      titulo: 'Imagem do projetor escura',
      descricao: 'A imagem está muito escura mesmo com as luzes da sala apagadas.',
      solucoes: [
        { texto: 'Filtro de ar limpo; superaquecimento resolvido.' },
        { texto: 'Lâmpada no fim da vida útil substituída.', peca: 'lâmpada do projetor' },
      ],
    },
    {
      titulo: 'Projetor sem sinal do notebook',
      descricao: 'O projetor mostra "sem sinal" ao conectar o notebook pelo HDMI.',
      solucoes: [
        {
          texto: 'Cabo HDMI substituído e resolução do notebook ajustada.',
          peca: 'cabo HDMI de 10 m',
        },
        { texto: 'Entrada de vídeo configurada no projetor e modo de tela estendida ativado.' },
      ],
    },
  ],
  Software: [
    {
      titulo: 'Sistema de notas não abre',
      descricao: 'O sistema de lançamento de notas mostra erro ao fazer login.',
      solucoes: [
        { texto: 'Certificado do sistema atualizado e cache do navegador limpo.' },
        { texto: 'Acesso do usuário redefinido junto à secretaria de educação.' },
      ],
    },
    {
      titulo: 'Pacote Office pedindo ativação',
      descricao: 'O Word e o Excel abrem em modo somente leitura pedindo ativação.',
      solucoes: [
        { texto: 'Licença reativada com a conta institucional.' },
        { texto: 'Office reinstalado com a licença da rede.' },
      ],
    },
    {
      titulo: 'Instalação de programa educativo',
      descricao: 'Precisamos instalar o programa de matemática nos computadores do laboratório.',
      solucoes: [{ texto: 'Programa instalado em todas as máquinas do laboratório.' }],
    },
    {
      titulo: 'Navegador abrindo propagandas',
      descricao: 'O navegador abre páginas de propaganda sozinho.',
      solucoes: [{ texto: 'Extensões maliciosas removidas e antivírus atualizado.' }],
    },
  ],
  Periféricos: [
    {
      titulo: 'Teclado com teclas falhando',
      descricao: 'Várias teclas do teclado não funcionam.',
      solucoes: [
        { texto: 'Teclado substituído.', peca: 'teclado USB' },
        { texto: 'Teclado limpo; as teclas voltaram a funcionar.' },
      ],
    },
    {
      titulo: 'Mouse não funciona',
      descricao: 'O mouse não responde em nenhuma porta USB.',
      solucoes: [
        { texto: 'Mouse substituído e portas USB testadas.', peca: 'mouse USB' },
        { texto: 'Driver do mouse reinstalado e porta USB testada.' },
      ],
    },
    {
      titulo: 'Caixa de som sem áudio',
      descricao: 'A caixa de som não emite som durante as aulas.',
      solucoes: [
        { texto: 'Cabo P2 substituído e driver de áudio reinstalado.' },
        { texto: 'Saída de áudio padrão corrigida no sistema.' },
      ],
    },
  ],
  Telefonia: [
    {
      titulo: 'Telefone sem linha',
      descricao: 'O telefone da secretaria está mudo, sem tom de discagem.',
      solucoes: [
        { texto: 'Telefone reconfigurado no servidor de ramais.' },
        {
          texto: 'Fonte PoE substituída; telefone voltou a registrar o ramal.',
          peca: 'fonte PoE do telefone',
        },
      ],
    },
    {
      titulo: 'Chamadas caindo',
      descricao: 'As ligações caem depois de poucos segundos.',
      solucoes: [
        { texto: 'Cabo de rede do telefone substituído e ramal registrado novamente.' },
        { texto: 'Codec de áudio ajustado na configuração do ramal.' },
      ],
    },
  ],
  Outros: [
    {
      titulo: 'Criação de e-mail institucional',
      descricao: 'Nova coordenadora precisa de e-mail institucional.',
      solucoes: [{ texto: 'Conta criada e credenciais entregues à direção.' }],
    },
    {
      titulo: 'Troca de senha do sistema',
      descricao: 'Professor esqueceu a senha de acesso ao computador da sala.',
      solucoes: [{ texto: 'Senha redefinida e usuário orientado.' }],
    },
    {
      titulo: 'Apoio para evento na escola',
      descricao: 'Precisamos de apoio com som e projeção para a reunião de pais.',
      solucoes: [{ texto: 'Equipamentos instalados e testados antes do evento.' }],
    },
  ],
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
