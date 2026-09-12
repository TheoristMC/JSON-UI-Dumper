<template>
  <div class="scroll-area" ref="viewport" @scroll.passive="throttleRender">
    <input
      ref="scrollBar"
      class="scroll-bar"
      type="range"
      value="0"
      @input="useScroll"
    />
    <div
      class="spacer"
      :style="{
        height: `${totalHeight}px`,
      }"
    >
      <div
        class="scroll-item"
        v-for="i in visibleContent"
        :key="i"
        :style="{ transform: `translateY(${itemOffsets[i]}px)` }"
      >
        <slot :item="items[i]" :index="i" />
      </div>
    </div>
  </div>
</template>

<!-- https://dev.to/adamklein/build-your-own-virtual-scroll-part-i-11ib -->
<!-- https://dev.to/adamklein/build-your-own-virtual-scroll-part-ii-3j86 -->

<script setup lang="ts" generic="T">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

interface ScrollAreaProps {
  items: T[];
  itemHeight: (index: number) => number;
  overscan?: number;
}

defineSlots<{ default(props: { item: T; index: number }): any }>();

const viewport = ref<HTMLElement>();
const scrollBar = ref<HTMLInputElement>();
const viewportHeight = ref(0);
const visibleContent = ref<number[]>([]);

const scrollArea = withDefaults(defineProps<ScrollAreaProps>(), {
  overscan: 1,
});

const itemOffsets = computed<number[]>(() => {
  const offsets = new Array(scrollArea.items.length + 1);
  offsets[0] = 0;
  for (let i = 0; i < scrollArea.items.length; i++) {
    offsets[i + 1] = offsets[i] + scrollArea.itemHeight(i);
  }
  return offsets;
});

const totalHeight = computed<number>(
  () => itemOffsets.value[scrollArea.items.length] ?? 0,
);

/**
 * Finds the item index that should be visible at the given offset.
 * @param target The source offset to be based on.
 */
function indexAtOffset(target: number): number {
  const o = itemOffsets.value;
  let low = 0;
  let high = scrollArea.items.length - 1;
  if (high < 0) return 0;

  let candidate = scrollArea.items.length;
  while (low <= high) {
    // This is the same as diving the low and high to 2
    const mid = (low + high) >> 1;

    if (o[mid] > target) {
      candidate = mid;
      high = mid - 1;
    } else {
      low = mid + 1;
    }
  }

  return candidate;
}

let ticking = false;
function throttleRender() {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    render();
    ticking = false;
  });
}

function render() {
  renderScroll();

  if (scrollArea.items.length < 1) {
    visibleContent.value = [];
    return;
  }

  const scrollTop = viewport.value?.scrollTop ?? 0;

  let start = indexAtOffset(scrollTop) - scrollArea.overscan - 1;
  start = Math.max(0, start);

  const viewportBottom = scrollTop + viewportHeight.value;
  let end = indexAtOffset(viewportBottom) + scrollArea.overscan;
  end = Math.min(scrollArea.items.length - 1, end);

  const count = Math.max(0, end - start + 1);

  visibleContent.value = Array.from({ length: count }, (_, i) => start + i);
}

function renderScroll() {
  const scroll = scrollBar.value;
  if (!viewport.value || !scroll) return;

  const contentHeight = viewport.value.scrollHeight;
  const visibleHeight = viewport.value.clientHeight;

  scroll.style.display = contentHeight <= visibleHeight ? "none" : "block";
  if (contentHeight <= visibleHeight) return;

  const thumbHeight = (visibleHeight / contentHeight) * 100;
  scroll.style.setProperty("--thumb-height", `${thumbHeight}%`);

  scroll.max = `${Math.max(0, contentHeight - visibleHeight)}`;
  scroll.value = `${viewport.value.scrollTop}`;
}

function useScroll() {
  if (!viewport.value || !scrollBar.value) return;
  viewport.value.scrollTop = scrollBar.value.valueAsNumber;
}

// This fixes a visual bug where the items won't update
// if the scroll area is not visible first hand. Therefore
// we update the viewport height immediately once available.
onMounted(() => {
  if (viewport.value) {
    const observer = new ResizeObserver((entries) => {
      const height = entries[0].contentRect.height;
      if (height > 0) {
        viewportHeight.value = height;
        render();
      }
    });
    observer.observe(viewport.value);
    onUnmounted(() => observer.disconnect());
  }
});

watch(itemOffsets, () => throttleRender());
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
  width: 4px;
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
  margin-left: -2px;
  width: 8px;
  background-color: #e6e8eb;
  border: 2px solid #f5f6f7;
  box-shadow:
    0px 4px 0px #58585a,
    0px 6px 0px 2px rgba(0, 0, 0, 0.3),
    0 0 0 2px #000,
    0 4px 0 2px #000;
}
</style>
