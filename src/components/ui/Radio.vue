<template>
  <div class="container">
    <div
      class="radio-container"
      v-for="({ label, value }, index) in items"
      :key="index"
    >
      <input
        type="radio"
        :name="radioName"
        :value="value"
        :checked="selectedIndex === index"
        @change="selectRadio(index)"
      />
      <p>{{ label }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";

import type { RadioItem } from "../../types/radio";

interface RadioProps {
  items: RadioItem[];
  radioName: string;
  defaultSelectedIndex?: number;
}

const emit = defineEmits<{ radioClick: [index: number] }>();
const props = withDefaults(defineProps<RadioProps>(), {
  defaultSelectedIndex: 0,
});

const selectedIndex = ref(props.defaultSelectedIndex);

function selectRadio(index: number) {
  selectedIndex.value = index;
  emit("radioClick", index);
}

onMounted(() => {
  emit("radioClick", props.defaultSelectedIndex);
});
</script>

<style scoped>
.container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(0, 1fr));
  column-gap: 2px;
}

.radio-container {
  position: relative;
  padding: 10px 20px;
  background-color: #d0d1d4;
  color: #1e1e1f;
  border: 2px solid #e1e1e4;
  box-shadow:
    0px 4px 0px #58585a,
    0 0 0 2px #1e1e1f,
    0 4px 0 2px #1e1e1f;
}

.radio-container:has(input:hover) {
  background-color: #b1b2b5;
  border-color: #f4f6f9;
}

.radio-container:has(input:active) {
  background-color: #b1b2b5;
  border-color: #dcdcdc;
  box-shadow: 0 0 0 2px #1e1e1f;
  transform: translateY(4px);
}

.radio-container:has(input:checked) {
  background-color: #3c8527;
  border-color: #639d52;
  box-shadow: 0 0 0 2px #1e1e1f;
  transform: translateY(4px);
}

.radio-container:has(input:checked) > p {
  color: #fff;
}

.radio-container:has(input:checked) > p {
  text-decoration: underline;
  text-underline-offset: calc(100% - 2px);
}

.radio-container > p {
  margin: 0;
  font-family: "MinecraftSeven";
  text-align: center;
}

.radio-container > input {
  appearance: none;
  position: absolute;
  inset: 0;
  margin: 0;
}
</style>
