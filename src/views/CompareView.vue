<script setup lang="ts">
import { onMounted } from 'vue';
import { storeToRefs } from 'pinia';
import EstimateCompareTable from '../components/EstimateCompareTable.vue';
import { useCompareStore } from '../stores/compare';
import { useUiStore } from '../stores/ui';
import { useI18n } from '../i18n/useI18n';

const compare = useCompareStore();
const ui = useUiStore();
const { t } = useI18n();
const { estimatePaths, estimates, loading, error } = storeToRefs(compare);

onMounted(() => {
  if (estimatePaths.value.length > 0) {
    compare.loadEstimates(estimatePaths.value);
  }
});

function goBack() {
  ui.navigate('library');
}

function goToLibrary() {
  compare.clear();
  ui.navigate('library');
}
</script>

<template>
  <div class="compare-view">
    <header class="hero">
      <button type="button" class="ghost back-btn" @click="goBack">
        {{ t('compare.backToLibrary') }}
      </button>
      <div class="title-row">
        <h2>{{ t('compare.title') }}</h2>
        <p class="lede">{{ t('compare.lede') }}</p>
      </div>
    </header>

    <div v-if="loading" class="status">
      <p>{{ t('compare.loading') }}</p>
    </div>

    <div v-else-if="error" class="status error">
      <p>{{ error }}</p>
      <button type="button" class="ghost" @click="goToLibrary">
        {{ t('compare.backToLibrary') }}
      </button>
    </div>

    <div v-else-if="estimates.length < 2" class="status empty">
      <p>{{ t('compare.selectAtLeastTwo') }}</p>
      <button type="button" class="ghost" @click="goToLibrary">
        {{ t('compare.backToLibrary') }}
      </button>
    </div>

    <EstimateCompareTable v-else :estimates="estimates" />
  </div>
</template>

<style scoped>
.compare-view {
  max-width: 1400px;
  margin: 0 auto;
}

.hero {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.back-btn {
  flex-shrink: 0;
}

.title-row {
  flex: 1;
  min-width: 200px;
}

.title-row h2 {
  margin: 0 0 0.25rem;
  font-size: 1.45rem;
  font-weight: 650;
}

.lede {
  margin: 0;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.4;
}

.status {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 2rem;
  text-align: center;
}

.status p {
  margin: 0;
  font-size: 1rem;
}

.status.error p {
  color: var(--danger);
}

.status.empty p {
  color: var(--muted);
}
</style>
