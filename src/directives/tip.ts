import type { Directive, DirectiveBinding } from 'vue';

type Place = 'top' | 'bottom' | 'right' | 'left';

type TipState = {
  binding: DirectiveBinding<string | null | undefined>;
  show: () => void;
  hide: () => void;
  move: () => void;
};

let bubble: HTMLDivElement | null = null;
let activeEl: HTMLElement | null = null;

function ensureBubble(): HTMLDivElement {
  if (bubble) return bubble;
  bubble = document.createElement('div');
  bubble.className = 'app-tip-bubble';
  bubble.setAttribute('role', 'tooltip');
  document.body.appendChild(bubble);
  return bubble;
}

function placeOf(binding: DirectiveBinding): Place {
  if (binding.modifiers.top) return 'top';
  if (binding.modifiers.right) return 'right';
  if (binding.modifiers.left) return 'left';
  return 'bottom';
}

function clampCenterX(centerX: number, bubbleWidth: number): number {
  const pad = 8;
  const half = bubbleWidth / 2;
  const min = pad + half;
  const max = window.innerWidth - pad - half;
  if (max <= min) return window.innerWidth / 2;
  return Math.min(max, Math.max(min, centerX));
}

function applyPlace(el: HTMLElement, place: Place) {
  const b = ensureBubble();
  const r = el.getBoundingClientRect();
  const gap = 8;
  switch (place) {
    case 'top':
      b.style.left = `${r.left + r.width / 2}px`;
      b.style.top = `${r.top - gap}px`;
      b.style.transform = 'translate(-50%, -100%)';
      break;
    case 'right':
      b.style.left = `${r.right + gap}px`;
      b.style.top = `${r.top + r.height / 2}px`;
      b.style.transform = 'translateY(-50%)';
      break;
    case 'left':
      b.style.left = `${r.left - gap}px`;
      b.style.top = `${r.top + r.height / 2}px`;
      b.style.transform = 'translate(-100%, -50%)';
      break;
    default:
      b.style.left = `${r.left + r.width / 2}px`;
      b.style.top = `${r.bottom + gap}px`;
      b.style.transform = 'translateX(-50%)';
  }

  // Re-measure after layout: right-edge anchors used to crush shrink-to-fit width.
  if (place === 'top' || place === 'bottom') {
    const bw = b.getBoundingClientRect().width;
    b.style.left = `${clampCenterX(r.left + r.width / 2, bw)}px`;
  }
}

function flipIfNeeded(preferred: Place): Place {
  const b = ensureBubble();
  const br = b.getBoundingClientRect();
  const pad = 8;
  if (preferred === 'bottom' && br.bottom > window.innerHeight - pad) return 'top';
  if (preferred === 'top' && br.top < pad) return 'bottom';
  if (preferred === 'right' && br.right > window.innerWidth - pad) return 'left';
  if (preferred === 'left' && br.left < pad) return 'right';
  return preferred;
}

function position(el: HTMLElement, preferred: Place) {
  applyPlace(el, preferred);
  const place = flipIfNeeded(preferred);
  if (place !== preferred) applyPlace(el, place);
}

function show(el: HTMLElement, binding: DirectiveBinding<string | null | undefined>) {
  const text = binding.value;
  if (text == null || text === '') return;
  const b = ensureBubble();
  b.textContent = String(text);
  activeEl = el;
  position(el, placeOf(binding));
  requestAnimationFrame(() => b.classList.add('is-on'));
}

function hide(el: HTMLElement) {
  if (activeEl !== el) return;
  activeEl = null;
  bubble?.classList.remove('is-on');
}

export const vTip: Directive<HTMLElement, string | null | undefined> = {
  mounted(el, binding) {
    const state: TipState = {
      binding,
      show: () => show(el, state.binding),
      hide: () => hide(el),
      move: () => {
        if (activeEl === el) position(el, placeOf(state.binding));
      },
    };
    (el as HTMLElement & { __tip?: TipState }).__tip = state;
    el.addEventListener('mouseenter', state.show);
    el.addEventListener('mouseleave', state.hide);
    el.addEventListener('focusin', state.show);
    el.addEventListener('focusout', state.hide);
    window.addEventListener('scroll', state.move, true);
  },
  updated(el, binding) {
    const state = (el as HTMLElement & { __tip?: TipState }).__tip;
    if (state) state.binding = binding;
  },
  unmounted(el) {
    const state = (el as HTMLElement & { __tip?: TipState }).__tip;
    if (!state) return;
    el.removeEventListener('mouseenter', state.show);
    el.removeEventListener('mouseleave', state.hide);
    el.removeEventListener('focusin', state.show);
    el.removeEventListener('focusout', state.hide);
    window.removeEventListener('scroll', state.move, true);
    hide(el);
    delete (el as HTMLElement & { __tip?: TipState }).__tip;
  },
};
