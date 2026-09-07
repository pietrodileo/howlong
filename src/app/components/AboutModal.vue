<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue';
import { useI18n } from '../i18n/useI18n';

const props = defineProps<{
  open: boolean;
  version: string;
}>();

const emit = defineEmits<{ close: [] }>();
const { t, tQuotes } = useI18n();

const randomQuote = ref<ReturnType<typeof tQuotes>[number] | null>(null);

function pickQuote() {
  const quotes = tQuotes('welcome.quotes');
  if (quotes.length === 0) {
    randomQuote.value = null;
    return;
  }

  const candidates = quotes.length > 1
    ? quotes.filter((quote) => quote !== randomQuote.value)
    : quotes;
  randomQuote.value = candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

function onKeydown(e: KeyboardEvent) {
  if (!props.open || (!e.ctrlKey && !e.metaKey) || e.key.toLowerCase() !== 'w') return;
  e.preventDefault();
  emit('close');
}

watch(() => props.open, (open) => {
  if (open) pickQuote();
}, { immediate: true });

onMounted(() => window.addEventListener('keydown', onKeydown));
onUnmounted(() => window.removeEventListener('keydown', onKeydown));
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-labelledby="about-title">
      <header>
        <div class="brand">
          <img class="brand-mark" src="/howlong-icon-vector.svg" width="44" height="44" alt="" />
          <div>
            <p class="tagline">Effort, made obvious.</p>
            <h2 id="about-title">HowLong?</h2>
          </div>
        </div>
        <button
          type="button"
          class="ghost"
          :aria-label="t('about.close')"
          @click="emit('close')"
        >
          {{ t('about.close') }}
        </button>
      </header>

      <p class="aim">{{ t('about.aim') }}</p>

      <figure v-if="randomQuote" class="quote">
        <blockquote>“{{ randomQuote.text }}”</blockquote>
        <figcaption>
          {{ randomQuote.author }}, {{ randomQuote.year }}
          <cite v-if="randomQuote.book"> · {{ randomQuote.book }}</cite>
        </figcaption>
      </figure>

      <dl class="meta">
        <div>
          <dt>{{ t('about.version') }}</dt>
          <dd>{{ version }}</dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(23, 25, 30, 0.42);
  backdrop-filter: blur(4px);
  display: grid;
  place-items: center;
  z-index: 100;
  padding: 1.5rem;
}

.modal {
  width: min(480px, 100%);
  background: var(--surface);
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: calc(var(--radius) + 2px);
  padding: 1.65rem 1.7rem;
  box-shadow: var(--shadow-menu);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 1rem;
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  min-width: 0;
}

.brand-mark {
  flex: 0 0 auto;
  width: 44px;
  height: 44px;
  border-radius: 10px;
  display: block;
}

header h2 {
  margin: 0.1rem 0 0;
  font-size: 1.65rem;
}

.tagline {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.quote {
  margin: 0 0 1.25rem;
  padding: 0.85rem 0 0.85rem 1rem;
  border-left: 3px solid var(--accent);
}

.quote blockquote {
  margin: 0;
  color: var(--ink-soft);
  font-family: var(--font-brand);
  font-size: 0.95rem;
  font-style: italic;
  line-height: 1.4;
}

.quote figcaption {
  margin-top: 0.45rem;
  color: var(--muted);
  font-size: 0.78rem;
  line-height: 1.35;
}

.quote cite {
  font-style: italic;
}

.aim {
  margin: 1.25rem 0;
  line-height: 1.6;
  color: var(--ink-soft);
}

.meta {
  margin: 0;
  display: grid;
  gap: 0.65rem;
  padding-top: 1rem;
  border-top: 1px solid var(--line);
}

.meta div {
  display: grid;
  grid-template-columns: 5.5rem 1fr;
  gap: 0.5rem;
}

dt {
  font-weight: 500;
  color: var(--muted);
}

dd {
  margin: 0;
}
</style>
