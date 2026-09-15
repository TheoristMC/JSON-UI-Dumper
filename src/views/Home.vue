<template>
  <Header title="JSON-UI Dumper"></Header>
  <main>
    <div class="nav">
      <Radio
        id="version-radio"
        radio-name="version-radio"
        :items="radioItems"
        :default-selected-index="selectedRadio"
        v-on:radio-click="useVersionRadio"
      ></Radio>
      <Dropdown
        id="version-dropdown"
        dropdown-name="v-dropdown"
        default-label="Loading..."
        :default-selected-index="selectedVersionIndex"
        :dropdown-items="dropdownVersionLabels"
      ></Dropdown>
    </div>
    <div class="main">
      <div class="content-wd">
        <TextField
          id="search-bar"
          placeholder="Search properties..."
          v-on:on-search="searchItems"
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
          :items="filteredItems"
          :item-height="getItemHeight"
          :style="{
            opacity: isContentLoading ? 0.5 : 1,
            'pointer-events': isContentLoading ? 'none' : 'auto',
          }"
        >
          <template #default="{ item }"
            ><PropertyItem
              :code="item.code"
              :expanded="item.isExpanded"
              :title="item.name"
              v-on:toggle="handleToggle(item)"
            ></PropertyItem
          ></template>
        </ScrollArea>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";

import Header from "../components/ui/Header.vue";
import Dropdown from "../components/ui/Dropdown.vue";
import TextField from "../components/ui/TextField.vue";
import PropertyItem from "../components/ui/PropertyItem.vue";
import ScrollArea from "../components/ui/ScrollArea.vue";
import Radio from "../components/ui/Radio.vue";

import Files from "../services/getFiles.ts";
import Metadata from "../services/getMetadata.ts";
import DropdownSelection from "../composables/useDropdownSelection.ts";
import UIProperties from "../utils/parseProperties.ts";

import type { VersionItem } from "../types/metadata";
import type { RadioItem } from "../types/radio";

interface Item {
  name: string;
  code: string;
  isExpanded: boolean;
}

const availableVersions = ref<VersionItem[]>([]);
const selectedVersionIndex = ref<number>(0);
const dropdownVersionLabels = computed(() =>
  availableVersions.value.map((v) => v.text),
);

const items = ref<Item[]>([]);
const isContentLoading = ref(false);

const searchQuery = ref("");
const filteredItems = computed(() => {
  if (!searchQuery.value) return items.value;
  return items.value.filter(({ name }) =>
    name.toLowerCase().includes(searchQuery.value),
  );
});

const selectedRadio = ref(0);
const radioItems = [
  { label: "Stable", value: "stable" },
  { label: "Preview", value: "preview" },
] as RadioItem[];

const route = useRoute();
const router = useRouter();

function handleToggle(target: Item) {
  const toggle = items.value.find(({ name }) => name === target.name);
  if (toggle) toggle.isExpanded = !toggle.isExpanded;
}

function getItemHeight(index: number): number {
  return filteredItems.value[index].isExpanded ? 200 : 61.6;
}

function useVersionRadio(index: number) {
  const selectedValue = radioItems[index].value;
  router.replace({ query: { ...route.query, version: selectedValue } });
}

function searchItems(query: string) {
  searchQuery.value = query.toLowerCase();
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

    // Return if there is no changes
    if (Number(route.query.index) === v.index) return;

    // Change the route query first
    await router.replace({ query: { ...route.query, index: v.index } });

    // then update items.
    await updateItems(availableVersions.value[v.index].sha);
  },
);

watch(
  () => route.query,
  async (query) => {
    const version = query.version as string;
    const versionIndex = query.index as string;

    if (versionIndex) selectedVersionIndex.value = Number(versionIndex) || 0;
    if (version) {
      const index = radioItems.findIndex(({ value }) => value === version);
      selectedRadio.value = index === -1 ? 0 : index;
    }

    const requestVersion = version; // cache the initial request
    const fetchVersion = await Metadata.getVersions(version);

    // Only apply if it's not stale
    if (requestVersion === route.query.version) {
      availableVersions.value = fetchVersion;

      const selected = availableVersions.value[selectedVersionIndex.value];
      if (selected) await updateItems(selected.sha);
    }
  },
  { immediate: true },
);
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
}

#version-radio {
  margin-bottom: 8px;
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
