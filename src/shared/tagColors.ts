/** Colore bordo etichetta (stile Jira) derivato dal testo. */
export function tagBorderColor(label: string): string {
  let h = 0;
  for (let i = 0; i < label.length; i++) h = (h * 31 + label.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue} 52% 42%)`;
}

export function formatTagsList(tags: string[] | undefined): string {
  if (!tags?.length) return '';
  return tags.join(', ');
}
