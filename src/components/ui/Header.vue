<template>
  <header>
    <h1>{{ titleWithVersion }}</h1>
  </header>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { getMetadata } from '@/js/getUIFiles';

const gameVersion = ref("Loading...");

onMounted(async() => {
  try {
    const metadata = await getMetadata();
    gameVersion.value = metadata.version;
  } catch (err) {
    console.error("Failed to load metadata:", err);
    gameVersion.value = "???";
  }
});

const props = defineProps({
  title: {
    type: String,
    default: "Placeholder"
  }
});

const titleWithVersion = computed(() => `${props.title} (${gameVersion.value})`)
</script>

<style scoped>
header {
  background-color: #e6e8eb;
  padding: 10px;
  border-bottom: 6px solid #b1b2b5;
  box-shadow:
    0 2px 0 1px rgba(0, 0, 0, 0.5);
}

header>h1 {
  text-align: center;
  font-family: "MinecraftTen";
  font-size: 1.8rem;
  color: #1a1a1b;
  margin: 0 0 1px 0; /* Center the title a bit */
  box-sizing: border-box;
  text-rendering: optimizeLegibility;
}
</style>