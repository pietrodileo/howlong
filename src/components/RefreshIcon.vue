<script setup lang="ts">
defineProps<{ spinning?: boolean }>();
</script>

<template>
  <svg :class="{ spinning }" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
    <path
      d="M2.5 11A9.5 9.5 0 0 1 19 4.5M19 1.5v5h-5M21.5 13A9.5 9.5 0 0 1 5 19.5M5 22.5v-5h5"
      fill="none"
      stroke="currentColor"
      stroke-width="2.25"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.spinning {
  animation: refresh-spin 0.7s linear infinite;
}

@keyframes refresh-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
