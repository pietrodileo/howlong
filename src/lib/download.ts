/** Download file nel browser (fallback fuori da Tauri). */
export function downloadBrowser(
  filename: string,
  content: string | Uint8Array,
  mime: string,
): string {
  const blob =
    typeof content === 'string'
      ? new Blob([content], { type: mime })
      : new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return url;
}
