<script setup lang="ts">
import { useI18n } from '../i18n/useI18n';

defineProps<{
  open: boolean;
  version: string;
}>();

const emit = defineEmits<{ close: [] }>();
const { t } = useI18n();
</script>

<template>
  <div v-if="open" class="overlay" @click.self="emit('close')">
    <div class="modal" role="dialog" aria-labelledby="about-title">
      <header>
        <div class="brand">
          <img class="brand-mark" src="/howlong-icon.png" width="44" height="44" alt="" />
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
