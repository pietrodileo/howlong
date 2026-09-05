<script setup lang="ts">
defineProps<{ expanded: boolean }>();
</script>

<template>
  <svg
    class="disclosure-icon"
    :class="{ collapsed: !expanded }"
    viewBox="0 0 16 16"
    width="14"
    height="14"
    aria-hidden="true"
  >
    <path d="m4 6 4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
  </svg>
</template>

<style scoped>
.disclosure-icon { display: block; transition: transform .15s ease; }
.disclosure-icon.collapsed { transform: rotate(-90deg); }
</style>
