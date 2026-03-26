<template>
  <div class="loading-block" aria-live="polite">
    <div class="loading-block__line loading-block__line--strong" />
    <div class="loading-block__line" />
    <div class="loading-block__line loading-block__line--short" />
  </div>
</template>

<style scoped>
.loading-block {
  display: grid;
  gap: 0.65rem;
  border: 1px solid rgba(89, 101, 94, 0.18);
  border-radius: 1.4rem;
  padding: 1.15rem;
  background: rgba(255, 255, 255, 0.72);
}

.loading-block__line {
  height: 0.9rem;
  border-radius: 999px;
  background:
    linear-gradient(90deg, rgba(207, 213, 209, 0.7), rgba(241, 243, 241, 1), rgba(207, 213, 209, 0.7));
  background-size: 220% 100%;
  animation: shimmer 1.6s linear infinite;
}

.loading-block__line--strong {
  width: 78%;
}

.loading-block__line--short {
  width: 55%;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -20% 0;
  }
}
</style>
