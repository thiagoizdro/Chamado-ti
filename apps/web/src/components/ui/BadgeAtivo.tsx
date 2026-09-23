export function BadgeAtivo({ ativo }: { ativo: boolean }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        ativo ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-700'
      }`}
    >
      {ativo ? 'Ativo' : 'Inativo'}
    </span>
  );
}
