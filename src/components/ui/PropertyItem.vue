<template>
  <div class="checkbox-container">
    <div class="checkbox-nav">
      <p>{{ title }}</p>
      <button @click="emit('toggle')" class="button expand-b">
        {{ expanded ? "Collapse" : "Expand" }}
      </button>
    </div>
    <div v-show="expanded" style="position: relative">
      <p class="checkbox-content">
        {{ code }}
      </p>
      <button @click="copy" class="copy-b">
        <Copy v-if="!isCopied" class="copy-icon"></Copy>
        <Check v-if="isCopied" class="check-icon"></Check>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";

import Check from "../icons/Check.vue";
import Copy from "../icons/Copy.vue";

interface PropertyItemProps {
  title?: string;
  code: string;
  expanded: boolean;
}

const props = withDefaults(defineProps<PropertyItemProps>(), { title: "???" });

const emit = defineEmits<{ toggle: [] }>();
const isCopied = ref(false);

const copy = async () => {
  if (isCopied.value) return;

  try {
    await navigator.clipboard.writeText(props.code);

    isCopied.value = true;
    setTimeout(() => (isCopied.value = false), 2000);
  } catch (err) {
    console.error("Failed to copy text: ", err);
  }
};
</script>

<style scoped>
.checkbox-container {
  display: flex;
  flex-direction: column;
}

.checkbox-nav {
  display: flex;
  align-items: center;
  border-top: 2px solid #5a5b5c;
  border-bottom: 2px solid #3a3a3b;
  background-color: #48494a;
  padding: 10px 20px;
}

.checkbox-nav > p {
  flex: 1;
  margin: 0;
  font-family: "MinecraftSeven";
  color: #fff;
}

.checkbox-content {
  color: #d0d1d4;
  border-top: 2px solid #1e1e1f;
  border-bottom: 2px solid #1e1e1f;
  background-color: #313233;
  margin: 0;
  padding: 10px 20px;
  position: relative;
  font-family: "MinecraftSeven";
  white-space: pre-wrap;
  overflow-y: auto;
  scrollbar-width: none;
  height: 138.4px; /* 200px - button_height */
}

.copy-b {
  position: absolute;
  appearance: none;
  background: none;
  border: none;
  top: 8px;
  right: 24px;
  width: 30px;
  height: 30px;
}

.copy-b > .copy-icon {
  height: 100%;
  width: 100%;
  color: #d0d1d4;
}

.copy-b:hover {
  outline: 2px solid #fff;
}

.copy-b:hover > .copy-icon {
  color: #fff;
}

.copy-b > .check-icon {
  height: 100%;
  width: 100%;
  fill: #fff;
}

.button {
  appearance: none;
  padding: 8px 20px;
  margin: 0 4px 4px 0;
  background-color: #d0d1d4;
  color: #1e1e1f;
  border: 2px solid #e1e1e4;
  font-family: "MinecraftSeven";
  box-shadow:
    0px 4px 0px #58585a,
    0 0 0 2px #1e1e1f,
    0 4px 0 2px #1e1e1f;
}

.button:hover {
  background-color: #b1b2b5;
  border-color: #f4f6f9;
}

.button:active {
  background-color: #b1b2b5;
  border-color: #dcdcdc;
  box-shadow: 0 0 0 2px #1e1e1f;
  transform: translateY(4px);
}
</style>
