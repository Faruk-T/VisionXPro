/** Excel uyumlu CSV indirme (UTF-8 BOM + tırnak kaçışı). */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (cell: string | number) => `"${String(cell ?? '').replace(/"/g, '""')}"`;
  const bom = '\uFEFF';
  const lines = [
    headers.map(escape).join(','),
    ...rows.map((row) => row.map(escape).join(',')),
  ];
  const blob = new Blob([bom + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
