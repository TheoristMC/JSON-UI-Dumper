<template>
  <input
    ref="scroll"
    class="scroll-bar"
    type="range"
    value="0"
    v-show="scrollVisible"
    @input="useScroll"
  />
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

interface ScrollBarProps {
  isScrollDynamic?: boolean;
}

const props = withDefaults(defineProps<ScrollBarProps>(), {
  isScrollDynamic: false,
});

const scrollVisible = ref(true);
const scroll = ref<HTMLInputElement>();

let viewport: HTMLElement | null | undefined;
let resizeObs: ResizeObserver | null = null;

function render() {
  const bar = scroll.value;
  if (!bar || !viewport) return;

  const contentHeight = viewport.scrollHeight;
  const visibleHeight = viewport.clientHeight;

  scrollVisible.value = contentHeight > visibleHeight;
  if (contentHeight <= visibleHeight) return;

  const thumbHeight = (visibleHeight / contentHeight) * 100;
  bar.style.setProperty("--thumb-height", `${thumbHeight}%`);

  bar.style.height = `${visibleHeight - 20}px`;
  bar.max = `${Math.max(0, contentHeight - visibleHeight)}`;
}

function update() {
  const bar = scroll.value;
  if (!bar || !viewport) return;
  bar.value = `${viewport.scrollTop}`;
}

function useScroll() {
  if (!viewport || !scroll.value) return;
  viewport.scrollTop = scroll.value.valueAsNumber;
}

onMounted(() => {
  viewport = scroll.value?.parentElement;
  if (!viewport) return;

  resizeObs = new ResizeObserver(render);
  resizeObs.observe(viewport);

  // Since ResizeObserver does not catch on scroll height changes
  // we also observe its children since if the height of them
  // changes, and so is the scroll height.
  // We also used the index 1 to ignore the scroll bar, therefore,
  // it is hardcoded that the scroll bar must be defined first on
  // the list.
  if (props.isScrollDynamic) {
    const refChild = viewport.children[1];
    resizeObs.observe(refChild);
  }

  viewport.addEventListener("scroll", update, { passive: true });

  render();
});

onUnmounted(() => {
  resizeObs?.disconnect();
  viewport?.removeEventListener("scroll", update);
});
</script>

<style>
.scroll-bar {
  appearance: none;
  writing-mode: vertical-lr;
  width: 4px;
  position: fixed;
  bottom: 10px;
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
  background-color: #d0d1d4;
  border: 2px solid #e1e1e4;
  box-shadow:
    0px 4px 0px #58585a,
    0px 6px 0px 2px rgba(0, 0, 0, 0.3),
    0 0 0 2px #1e1e1f,
    0 4px 0 2px #1e1e1f;
}
</style>
