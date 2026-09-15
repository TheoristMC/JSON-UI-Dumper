<template>
  <Header
    v-on:back-click="onBack"
    title="Code Content"
    back-button="left"
  ></Header>
  <p class="title">{{ codeTitle }}</p>
  <p class="content">
    <ScrollBar></ScrollBar>
    {{ codeContent }}
  </p>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { LocationQueryRaw, useRoute, useRouter } from "vue-router";

import Header from "../components/ui/Header.vue";
import ScrollBar from "../components/ui/ScrollBar.vue";

import type { StorageData } from "../types/storage";

const route = useRoute();
const router = useRouter();

const codeTitle = ref<string>("INVALID CODE FOUND");
const codeContent = ref<string>("");

let previousParams: LocationQueryRaw | undefined;
const onBack = () => {
  router
    .push({ path: "/", query: previousParams })
    .then(() => window.location.reload());

  // Reset the storage since it's not needed if the user left the page.
  sessionStorage.clear();
};

onMounted(() => {
  const codeId = route.query.codeId;
  if (typeof codeId !== "string") return;

  const key = `payload-${codeId}`;
  const raw = sessionStorage.getItem(key);
  if (!raw) {
    codeContent.value = "No session storage found.";
    return;
  }

  try {
    const data = JSON.parse(raw).content as StorageData;
    previousParams = data.previousParams;
    codeTitle.value = data.title ?? "Untitled";
    codeContent.value = data.code ?? "";
  } catch {
    codeContent.value = "Corrupted session data.";
  }
});

onUnmounted(onBack);
</script>

<style scoped>
.title {
  font-family: "MinecraftTen";
  color: #fff;
  margin: 2px 0 0;
  border-top: 2px solid #5a5b5c;
  border-bottom: 2px solid #333334;
  background-color: #48494a;
  padding: 10px 20px 12px;
}

.content {
  flex: 1;
  min-height: 0;
  padding: 10px 20px 10px 20.5px;
  border-top: 2px solid #1e1e1f;
  border-bottom: 2px solid #1e1e1f;
  background-color: #313233;
  margin: 0;
  white-space: pre-wrap;
  color: #d0d1d4;
  font-family: "MinecraftSeven";
  overflow-y: auto;
  scrollbar-width: none;
  position: relative;
}
</style>
