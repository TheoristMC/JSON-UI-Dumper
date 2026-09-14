<template>
  <header>
    <button @click="emit('backClick')" v-if="backButton === 'left'">
      <ArrowSide class="arrow-icon"></ArrowSide>
    </button>
    <h1>{{ title }}</h1>
  </header>
</template>

<script setup lang="ts">
import ArrowSide from "../icons/ArrowSide.vue";

const emit = defineEmits<{ backClick: [] }>();

interface HeaderProps {
  title?: string;
  backButton?: "left";
}

withDefaults(defineProps<HeaderProps>(), {
  title: "...",
});
</script>

<style scoped>
header {
  position: relative;
  background-color: #e6e8eb;
  border-bottom: 6px solid #b1b2b5;
  box-shadow: 0 2px 0 1px rgba(0, 0, 0, 0.5);
  padding: 10px;
  min-height: 63.6px;
}

header > h1 {
  margin: 0 0 2px;
  text-align: center;
  font-family: "MinecraftTen";
  font-size: 1.8rem;
  color: #000;
  text-rendering: optimizeSpeed;
}

header > button {
  position: absolute;
  appearance: none;
  background: none;
  border: none;
  inset: 0;
  aspect-ratio: 1 / 1;
  height: 100%;
  padding: 1px 0 0;
}

header > button:hover {
  background-color: #f4f6f9;
}

.arrow-icon {
  width: 20px;
  height: 20px;
}
</style>
