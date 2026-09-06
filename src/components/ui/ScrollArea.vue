<template>
  <div class="scroll-area" ref="viewport" @scroll="update">
    <input
      class="scroll-bar"
      type="range"
      value="0"
      @input="updateScrollManual"
    />
    <div
      class="spacer"
      :style="{
        height: `${scrollArea.items.length * scrollArea.itemHeight}px`,
      }"
    >
      <div
        class="scroll-item"
        v-for="i in visibleContent"
        :key="i"
        :style="{ transform: `translateY(${i * scrollArea.itemHeight}px)` }"
      >
        <slot :item="items[i]" :index="i" />
      </div>
    </div>
  </div>
</template>

<!-- https://dev.to/adamklein/build-your-own-virtual-scroll-part-i-11ib -->
<!-- https://dev.to/adamklein/build-your-own-virtual-scroll-part-ii-3j86 -->

<script setup lang="ts">
import { onMounted, ref } from "vue";

interface ScrollAreaProps {
  items: unknown[];
  // itemHeight: number | (() => number);
  itemHeight: number;
  overscan?: number;
}

const viewport = ref<HTMLElement>();
const viewportHeight = ref(0);
const visibleContent = ref<number[]>([]);

const scrollArea = withDefaults(defineProps<ScrollAreaProps>(), {
  overscan: 1,
});

function updateScroll() {
  if (!viewport.value) return;
  const scrollBar = viewport.value.querySelector("input");
  if (!scrollBar) return;

  const contentHeight = viewport.value.scrollHeight;
  const visibleHeight = viewport.value.clientHeight;

  if (contentHeight <= visibleHeight) return (scrollBar.style.display = "none");

  const thumbHeight = (visibleHeight / contentHeight) * 100;
  scrollBar.style.setProperty("--thumb-height", `${thumbHeight}%`);

  scrollBar.max = `${Math.max(0, contentHeight - visibleHeight)}`;
  scrollBar.value = `${viewport.value.scrollTop}`;
}

function updateScrollManual() {
  if (!viewport.value) return;
  const scrollBar = viewport.value.querySelector("input");
  if (!scrollBar) return;
  viewport.value.scrollTop = scrollBar.valueAsNumber;
}

function update() {
  updateScroll();

  const scrollTop = viewport.value?.scrollTop ?? 0;

  let start =
    Math.floor(scrollTop / scrollArea.itemHeight) - scrollArea.overscan;
  start = Math.max(0, start);

  let count =
    Math.ceil(viewportHeight.value / scrollArea.itemHeight) +
    2 * scrollArea.overscan;

  count = Math.min(scrollArea.items.length - start, count);

  visibleContent.value = Array.from({ length: count }, (_, i) => start + i);
}

onMounted(() => {
  if (viewport.value) {
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      if (height > 0) {
        observer.disconnect();
        viewportHeight.value = height;
        update();
      }
    });
    observer.observe(viewport.value);
  }
});
</script>

<style scoped>
.scroll-area {
  position: relative;
  overflow-y: auto;
  scrollbar-width: none;
  width: 100%;
}

.spacer {
  position: relative;
  width: 100%;
}

.scroll-item {
  position: absolute;
  width: 100%;
}

.scroll-bar {
  appearance: none;
  writing-mode: vertical-lr;
  width: 8px;
  position: fixed;
  height: calc(100% - 20px);
  top: 6px;
  right: 6px;
  z-index: 1;
  --thumb-height: 0%;
}

.scroll-bar::-webkit-slider-runnable-track {
  background-color: #58585a;
  width: 100%;
}

.scroll-bar::-webkit-slider-thumb {
  appearance: none;
  height: var(--thumb-height);
  width: 8px;
  background-color: #e6e8eb;
  border: 2px solid #f5f6f7;
  box-shadow:
    0px 4px 0px #58585a,
    0 0 0 2px #000,
    0 4px 0 2px #000;
}
</style>
