// Dados fixos do seed. Tudo que é "cadastro" fica aqui para o seed.ts
// só orquestrar a criação.

export const SENHA_PADRAO = 'Senha@123';

export const DOMINIO_EMAIL = 'chamados.dev';

export const CATEGORIAS = [
  'Impressora',
  'Rede/Internet',
  'Computador',
  'Projetor',
  'Software',
  'Periféricos',
  'Telefonia',
  'Outros',
] as const;

export type NomeCategoria = (typeof CATEGORIAS)[number];

type DadosEscola = {
  nome: string;
  codigoInep: string;
  endereco: string;
  // Usado no e-mail do solicitante (ex.: direcao.monteirolobato@chamados.dev)
  apelido: string;
};

export const ESCOLAS: DadosEscola[] = [
  {
    nome: 'EMEF Professora Maria José da Silva',
    codigoInep: '35123401',
    endereco: 'Rua das Palmeiras, 120 - Jardim Esperança',
    apelido: 'mariajose',
  },
  {
    nome: 'EMEF Monteiro Lobato',
    codigoInep: '35123402',
    endereco: 'Avenida Brasil, 2450 - Vila Nova',
    apelido: 'monteirolobato',
  },
  {
    nome: 'EMEI Cecília Meireles',
    codigoInep: '35123403',
    endereco: 'Rua Sete de Setembro, 88 - Centro',
    apelido: 'ceciliameireles',
  },
  {
    nome: 'Escola Municipal Paulo Freire',
    codigoInep: '35123404',
    endereco: 'Rua José Bonifácio, 515 - Parque São Jorge',
    apelido: 'paulofreire',
  },
  {
    nome: 'EMEF Dom Pedro II',
    codigoInep: '35123405',
    endereco: 'Travessa Santos Dumont, 37 - Jardim das Flores',
    apelido: 'dompedro',
  },
];

export const QUANTIDADE_TECNICOS = 3;

type TipoEquipamento = {
  tipo: string;
  quantidadePorEscola: number;
  modelos: { marca: string; modelo: string }[];
  localizacoes: string[];
};

// 8 equipamentos por escola x 5 escolas = 40 equipamentos
export const TIPOS_EQUIPAMENTO: TipoEquipamento[] = [
  {
    tipo: 'Computador',
    quantidadePorEscola: 3,
    modelos: [
      { marca: 'Dell', modelo: 'OptiPlex 3080' },
      { marca: 'Lenovo', modelo: 'ThinkCentre M70q' },
      { marca: 'Positivo', modelo: 'Master D3400' },
    ],
    localizacoes: ['Laboratório de Informática', 'Secretaria', 'Sala dos Professores', 'Diretoria'],
  },
  {
    tipo: 'Notebook',
    quantidadePorEscola: 1,
    modelos: [
      { marca: 'Positivo', modelo: 'Duo C4128' },
      { marca: 'Lenovo', modelo: 'IdeaPad 3' },
    ],
    localizacoes: ['Coordenação Pedagógica', 'Diretoria'],
  },
  {
    tipo: 'Impressora',
    quantidadePorEscola: 1,
    modelos: [
      { marca: 'HP', modelo: 'LaserJet Pro M404n' },
      { marca: 'Brother', modelo: 'DCP-L5652DN' },
      { marca: 'Epson', modelo: 'EcoTank L3250' },
    ],
    localizacoes: ['Secretaria', 'Sala dos Professores'],
  },
  {
    tipo: 'Projetor',
    quantidadePorEscola: 1,
    modelos: [
      { marca: 'Epson', modelo: 'PowerLite X49' },
      { marca: 'BenQ', modelo: 'MS560' },
    ],
    localizacoes: ['Sala de Vídeo', 'Auditório', 'Sala 5'],
  },
  {
    tipo: 'Roteador',
    quantidadePorEscola: 1,
    modelos: [
      { marca: 'TP-Link', modelo: 'Archer C6' },
      { marca: 'Intelbras', modelo: 'Twibi Giga' },
    ],
    localizacoes: ['Secretaria', 'Corredor Principal'],
  },
  {
    tipo: 'Telefone IP',
    quantidadePorEscola: 1,
    modelos: [
      { marca: 'Intelbras', modelo: 'TIP 125i' },
      { marca: 'Grandstream', modelo: 'GXP1610' },
    ],
    localizacoes: ['Secretaria', 'Diretoria'],
  },
];
