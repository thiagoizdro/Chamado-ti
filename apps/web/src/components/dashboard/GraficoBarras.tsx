import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  YAxis,
} from 'recharts';

import { formatarNumero } from '../../lib/datas';
import type { Contagem } from '../../types/dashboard';

// Uma série só: uma cor para todas as barras (o comprimento já mostra o valor).
// Azul do app, validado com contraste >= 3:1 sobre o fundo branco.
const COR_BARRA = '#2563eb';
const COR_GRADE = '#e2e8f0'; // slate-200
const COR_TEXTO = '#334155'; // slate-700

const ALTURA_BARRA = 20; // <= 24px: barra fina, com respiro entre as linhas
const ALTURA_LINHA = 36;
const ALTURA_EIXO = 32;
const LARGURA_ROTULOS = 190;
const MAX_CARACTERES_ROTULO = 26;

function encurtar(texto: string) {
  return texto.length > MAX_CARACTERES_ROTULO
    ? `${texto.slice(0, MAX_CARACTERES_ROTULO - 1)}…`
    : texto;
}

type PropsRotulo = { x?: number | string; y?: number | string; payload?: { value: string } };

// Rótulo do eixo em uma linha só (o padrão do Recharts quebra nomes longos);
// o nome completo aparece no <title> ao passar o mouse, na dica e na tabela.
function RotuloEixo({ x = 0, y = 0, payload }: PropsRotulo) {
  const nome = payload?.value ?? '';
  return (
    <text x={x} y={y} dx={-8} dy={4} textAnchor="end" fill={COR_TEXTO} fontSize={12}>
      <title>{nome}</title>
      {encurtar(nome)}
    </text>
  );
}

// Valor em destaque, nome em segundo plano (o leitor já sabe qual barra apontou).
function Dica({ active, payload }: TooltipContentProps) {
  const item = payload?.[0]?.payload as Contagem | undefined;
  if (!active || !item) return null;
  return (
    <div className="rounded-md bg-white px-3 py-2 text-sm shadow-md ring-1 ring-slate-200">
      <p className="font-semibold text-slate-900">
        {formatarNumero(item.total)} {item.total === 1 ? 'chamado' : 'chamados'}
      </p>
      <p className="text-slate-600">{item.nome}</p>
    </div>
  );
}

type Props = {
  titulo: string;
  dados: Contagem[];
  rotuloItem: string;
};

export function GraficoBarras({ titulo, dados, rotuloItem }: Props) {
  const idTitulo = `grafico-${titulo.toLowerCase().replace(/\W+/g, '-')}`;
  // A altura cresce com o número de barras e já inclui a faixa do eixo.
  const altura = dados.length * ALTURA_LINHA + ALTURA_EIXO;

  return (
    <section aria-labelledby={idTitulo} className="rounded-lg bg-white p-4 ring-1 ring-slate-200">
      <h2 id={idTitulo} className="mb-3 font-semibold text-slate-900">
        {titulo}
      </h2>

      {dados.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-600">Sem dados no período.</p>
      ) : (
        <>
          <div style={{ height: altura }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dados}
                layout="vertical"
                margin={{ top: 0, right: 40, bottom: 0, left: 0 }}
                barSize={ALTURA_BARRA}
              >
                <CartesianGrid horizontal={false} stroke={COR_GRADE} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: COR_TEXTO, fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="nome"
                  width={LARGURA_ROTULOS}
                  axisLine={{ stroke: COR_GRADE }}
                  tickLine={false}
                  tick={RotuloEixo}
                />
                <Tooltip content={Dica} cursor={{ fill: '#f1f5f9' }} />
                <Bar
                  dataKey="total"
                  fill={COR_BARRA}
                  radius={[0, 4, 4, 0]}
                  isAnimationActive={false}
                >
                  <LabelList dataKey="total" position="right" fill={COR_TEXTO} fontSize={12} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Equivalente acessível do gráfico (leitores de tela e quem prefere números). */}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer text-blue-800 hover:underline">
              Ver dados em tabela
            </summary>
            <table className="mt-2 w-full">
              <caption className="sr-only">{titulo}</caption>
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-700">
                  <th scope="col" className="py-1.5 font-semibold">
                    {rotuloItem}
                  </th>
                  <th scope="col" className="py-1.5 text-right font-semibold">
                    Chamados
                  </th>
                </tr>
              </thead>
              <tbody>
                {dados.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-1.5 text-slate-800">{item.nome}</td>
                    <td className="py-1.5 text-right text-slate-800 tabular-nums">{item.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
