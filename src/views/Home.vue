<template>
  <Header title="JSON-UI Dumper"></Header>
  <main>
    <div class="nav">
      <Dropdown
        id="version-dropdown"
        dropdown-name="v-dropdown"
        default-label="Loading..."
        :default-selected-index="selectedVersionIndex"
        :dropdown-items="availableVersions.map((v) => v.text)"
      ></Dropdown>
    </div>
    <div class="main">
      <div class="content-wd">
        <TextField
          id="search-bar"
          placeholder="Search properties..."
        ></TextField>
      </div>
      <div class="content">
        <!-- Loading -->
        <img
          v-if="isContentLoading"
          src="../assets/loading.gif"
          alt="Loading"
          class="loading"
        />
        <!-- Content -->
        <ScrollArea
          :items="items"
          :item-height="getItemHeight"
          :style="{
            opacity: isContentLoading ? 0.5 : 1,
            'pointer-events': isContentLoading ? 'none' : 'auto',
          }"
        >
          <template #default="{ item, index }"
            ><PropertyItem
              :code="item.code"
              :expanded="items[index].isExpanded"
              :title="items[index].name"
              v-on:toggle="handleToggle(index)"
            ></PropertyItem
          ></template>
        </ScrollArea>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import Header from "../components/ui/Header.vue";
import Dropdown from "../components/ui/Dropdown.vue";
import TextField from "../components/ui/TextField.vue";
import PropertyItem from "../components/ui/PropertyItem.vue";
import ScrollArea from "../components/ui/ScrollArea.vue";

import Files from "../services/getFiles.ts";
import Metadata from "../services/getMetadata.ts";
import DropdownSelection from "../composables/useDropdownSelection.ts";
import UIProperties from "../utils/parseProperties.ts";

import type { VersionItem } from "../types/metadata";

const availableVersions = ref<VersionItem[]>([]);
const selectedVersionIndex = ref<number>(0);

const isContentLoading = ref(false);
const items = ref<{ name: string; code: string; isExpanded: boolean }[]>([]);

const route = useRoute();
const router = useRouter();

function handleToggle(index: number) {
  const toggle = items.value[index];
  toggle.isExpanded = !toggle.isExpanded;
}

function getItemHeight(index: number): number {
  const toggle = items.value[index];
  return toggle.isExpanded ? 200 : 61.6;
}

let currentRequest = 0;
async function updateItems(sha: string): Promise<void> {
  const requestId = ++currentRequest;
  isContentLoading.value = true;

  try {
    const uiFiles = await Files.getUI(sha);
    if (requestId !== currentRequest) return; // stale data so return

    const parsedContents = Files.parsedFiles(uiFiles);
    const parsedProps = UIProperties.parse(parsedContents);

    const newItems = Object.keys(parsedProps)
      .sort()
      .map((k) => ({
        name: k,
        code: JSON.stringify((parsedProps as any)[k], null, 2),
        isExpanded: false,
      }));

    items.value = newItems; // update the whole array
  } finally {
    if (requestId === currentRequest) isContentLoading.value = false;
  }
}

watch(
  () => DropdownSelection.getSelection("v-dropdown"),
  async (v) => {
    if (!v) return;

    // Change the route query first
    await router.replace({ query: { ...route.query, index: v.index } });

    // then update items.
    await updateItems(availableVersions.value[v.index].sha);
  },
);

onMounted(async () => {
  const url = new URL(window.location.href);
  const version = url.searchParams.get("version");
  const versionIndex = url.searchParams.get("index");

  if (versionIndex) selectedVersionIndex.value = parseInt(versionIndex) || 0;

  const versions = await Metadata.getVersions(version ?? "stable");
  availableVersions.value = versions;
});
</script>

<style scoped>
main {
  flex: 1;
  display: flex;
  min-height: 0;
}

.loading {
  position: absolute;
  width: 24px;
  height: 24px;
  inset: 0;
  place-self: center;
  z-index: 2;
}

.content-wd {
  padding: 8px 10px;
  border-top: 2px solid #5a5b5c;
  border-bottom: 2px solid #3a3a3b;
  background-color: #48494a;
}

.nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: #313233;
  border-top: 2px solid #1e1e1f;
  border-right: 2px solid #1e1e1f;
  padding: 10px 10px 14px;
  gap: 8px;
}

.main {
  flex: 3;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background-color: green;
  position: relative;
  transform: translateZ(0); /* Necessary so the scroll bar inherit the height */
}

#search-bar {
  width: 100%;
}

@media (max-width: 600px) {
  main {
    flex-direction: column;
  }

  .nav {
    flex: 0;
    border-top: none;
    border-right: none;
    border-bottom: 2px solid #1e1e1f;
  }

  .main {
    flex: 1;
  }
}
</style>
