// ----------------------------------------------------------------------
// Exporta uma lista de objetos para CSV e dispara o download no browser.
// Pedido explícito da operação na call de alinhamento: "eu quero baixar
// o Excel disso" — CSV abre nativamente no Excel/Sheets.
// ----------------------------------------------------------------------

function escapeCsvValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (/[",\n;]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

export function exportToCsv(filename: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const lines = [
    headers.join(';'),
    ...rows.map((row) => headers.map((h) => escapeCsvValue(row[h])).join(';')),
  ];

  // BOM para o Excel reconhecer UTF-8 corretamente (acentos).
  const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
