<template>
  <footer class="edumatch-dashboard-footer">
    &copy; 2026 EduMatch. Choose the right path.
  </footer>
</template>

<style scoped>
@reference "../styles/tailwind.css";

.edumatch-dashboard-footer {
  @apply tw:shrink-0 tw:[grid-column:1/-1] tw:[min-width:0] tw:w-full;
  @apply tw:[margin:1.5rem_0_0] tw:[padding:1rem_0_0];
  @apply tw:[border-top:1px_solid_var(--border-color,_#dfe7dc)];
  @apply tw:[color:var(--text-secondary,_#687563)];
  @apply tw:text-center tw:[font-size:0.75rem] tw:[line-height:1.6];
}
</style>
