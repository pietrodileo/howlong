/** Esito tipizzato per dialog apri-file (evita confronti su stringhe localizzate). */
export type DialogFailReason = 'cancelled' | 'desktop_only' | 'error';

export type DialogFail = {
  ok: false;
  reason: DialogFailReason;
  error: string;
};

export function dialogCancelled(): DialogFail {
  return { ok: false, reason: 'cancelled', error: 'cancelled' };
}

export function dialogDesktopOnly(): DialogFail {
  return { ok: false, reason: 'desktop_only', error: 'desktop_only' };
}

export function dialogError(error: string): DialogFail {
  return { ok: false, reason: 'error', error };
}

export function isDialogCancelled(result: {
  ok: false;
  reason?: string;
  error: string;
}): boolean {
  if (result.reason === 'cancelled') return true;
  // Retrocompatibilità con vecchi messaggi IT/EN
  const e = result.error;
  return (
    e === 'Annullato' ||
    e === 'Cancelled' ||
    e === 'Operazione annullata' ||
    e === 'cancelled'
  );
}

export function isDialogDesktopOnly(result: {
  ok: false;
  reason?: string;
  error: string;
}): boolean {
  if (result.reason === 'desktop_only') return true;
  return result.error === 'Solo in app desktop' || result.error === 'desktop_only';
}
