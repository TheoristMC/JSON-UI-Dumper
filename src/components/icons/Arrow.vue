<template>
  <svg
    v-bind="$attrs"
    width="9"
    height="5"
    viewBox="0 0 9 5"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="1" y="1" width="1" height="1" />
    <rect x="2" y="2" width="1" height="1" />
    <rect x="3" y="3" width="1" height="1" />
    <rect x="4" y="4" width="1" height="1" />
    <rect x="5" y="3" width="1" height="1" />
    <rect x="6" y="2" width="1" height="1" />
    <rect x="7" y="1" width="1" height="1" />
  </svg>
</template>

<script setup lang="ts">
defineOptions({ inheritAttrs: false });
</script>
