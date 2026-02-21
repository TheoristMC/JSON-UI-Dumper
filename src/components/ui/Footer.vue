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
import { getVersion, paramType } from '@/js/getUIFiles';

const gameVersion = ref("(Loading...)");
let gameType = "Stable";
if (paramType === "stable") gameType = "Stable"
else if (paramType === "preview") gameType = "Preview";

onMounted(async () => {
  try {
    const version = await getVersion();
    gameVersion.value = version.latest.version;
  } catch (err) {
    console.error("Failed to apply footer:", err);
  }
})

const footerWithVersion = computed(() => `${props.footer ? `${props.footer}\n` : ""}Bedrock ${gameType} v${gameVersion.value}`)
</script>

<style scope>
footer {
  background-color: rgba(0, 0, 0, 0.45);
  border-top: 4px solid #2b2b2b;
  margin-top: 3px;
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