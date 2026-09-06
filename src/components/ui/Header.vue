<template>
  <header>
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
interface HeaderProps {
  title?: string;
}

withDefaults(defineProps<HeaderProps>(), {
  title: "Placeholder",
});
</script>

<style scoped>
header {
  flex: 0;
  background-color: #e6e8eb;
  padding: 10px;
  border-bottom: 6px solid #b1b2b5;
  box-shadow: 0 2px 0 1px rgba(0, 0, 0, 0.5);
}

header > h1 {
  text-align: center;
  font-family: "MinecraftTen";
  font-size: 1.8rem;
  color: #000;
  margin: 0 0 1px; /* Center the title vertically */
  text-rendering: optimizeSpeed;
}
</style>
