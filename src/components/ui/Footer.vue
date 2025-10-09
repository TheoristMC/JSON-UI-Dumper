<template>
  <footer>
    <p>{{ footerWithVersion }}</p>
  </footer>
</template>

<script setup>
const props = defineProps({
  footer: {
    type: String
  }
});

import { computed, onMounted, ref } from 'vue';
import { getMetadata } from '@/js/getUIFiles';

const gameVersion = ref("(Loading...)");

onMounted(async() => {
  try {
    const metadata = await getMetadata();
    gameVersion.value = metadata.version;
  } catch (err) {
    console.error("Failed to load metadata:", err);
    gameVersion.value = "???";
  }
});

const footerWithVersion = computed(() => `${props.footer ? `${props.footer}\n` : ""}Bedrock Stable v${gameVersion.value}`)
</script>

<style scope>
footer {
  background-color: rgba(0, 0, 0, 0.5);
  border-top: 4px solid #444;
  padding: 10px;
}

footer>p {
  text-align: center;
  font-family: "MinecraftSeven";
  color: #f0f0f0;
  word-break: break-word;
  white-space: pre-wrap;
  margin: 0;
}
</style>