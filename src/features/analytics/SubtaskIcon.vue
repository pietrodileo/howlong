<template>
  <span class="subtask-icon" aria-hidden="true">
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">
      <rect x="6" y="1.5" width="4" height="3" rx="1" />
      <path d="M8 4.5v3M3.5 7.5h9M3.5 7.5v2M12.5 7.5v2" />
      <rect x="1.5" y="9.5" width="4" height="3" rx="1" />
      <rect x="10.5" y="9.5" width="4" height="3" rx="1" />
    </svg>
  </span>
</template>

<style scoped>
.subtask-icon {
  display: inline-flex;
  flex: 0 0 auto;
  width: 1rem;
  height: 1rem;
  align-items: center;
  justify-content: center;
  color: var(--accent);
}

.subtask-icon svg {
  width: 100%;
  height: 100%;
}
</style>
