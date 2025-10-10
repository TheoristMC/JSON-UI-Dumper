<script setup>
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { useVirtualList } from "@vueuse/core";

import { getAllUIFiles } from "./js/getUIFiles";
import { collectProperties } from "./js/getProperties";

import JSON5 from "json5";
import Header from './components/ui/Header.vue';
import Footer from './components/ui/Footer.vue';
import PropertyItem from './components/ui/PropertyItem.vue';

const properties = ref([]);
const searchQuery = ref("");

const filteredProperties = computed(() => {
  if (!searchQuery.value) return properties.value;
  return properties.value.filter((item) => item.title.toLowerCase().includes(searchQuery.value.toLowerCase()));
});

onMounted(async () => {
  try {
    const filesJoined = await getAllUIFiles();
    const mappedFiles = filesJoined.map(file => ({
      name: file.name,
      contents: JSON5.parse(file.contents),
    }));

    const collectedProperties = collectProperties(mappedFiles);
    const propertyEntries = Object.entries(collectedProperties);

    // Don't sort the two pinned items
    const pinnedItems = propertyEntries.slice(0, 2);

    // Sort the rest alphabetically
    const items = propertyEntries.slice(2).sort(([keyA], [keyB]) =>
      keyA.localeCompare(keyB)
    );

    // Combine them back together
    properties.value = [...pinnedItems, ...items].map(([k, v]) => ({
      title: k,
      code: JSON.stringify(v, null, 2),
    }));

  } catch (err) {
    console.error("Error occured during data load:\n", err);
  }
});

const listContainer = ref(null);

// Merge ref from virtual scrolling to list container
const containerRef = (el) => {
  containerProps.ref.value = el;
  listContainer.value = el;
};

const { containerProps, wrapperProps, list } = useVirtualList(filteredProperties, {
  itemHeight: 61,
});

watch(searchQuery, async() => {
  await nextTick()
  if (listContainer.value) listContainer.value.scrollTop = 0;
});
</script>

<template>
  <div class="vert-container">
    <Header title="JSON-UI Dumper"></Header>
    <input v-model="searchQuery" placeholder="Search..." id="vue_search_bar" autocomplete="off"></input>
    <main v-bind="containerProps" :ref="containerRef">
      <div v-bind="wrapperProps">
        <PropertyItem 
          v-for="{ index, data } in list"
          :key="index"
          :property-title="data.title"
          :property-code="data.code
        ">
        </PropertyItem>
      </div>
    </main>
    <Footer footer="(Beta Phase)"></Footer>
  </div>
</template>

<style scoped>
.vert-container {
  display: flex;
  flex-direction: column;

  height: 100dvh;
  width: 100%;

  overflow: hidden;
}

#vue_search_bar {
  font-family: "MinecraftSeven";
  color: #AAAAAA;

  outline: none;

  margin: 6px 6px;
  padding: 12px 15px;

  background-color: #313233;
  border: 3px solid #1e1e1f;
  box-shadow: 0px 4px 0px #1e1e1f inset;
}

.vert-container > input::placeholder {
  margin-top: 4px;
}

main {
  flex: 1;
  height: 100%;
  overflow-y: auto;
  scrollbar-width: none;
}

main > div {
  display: flex;
  flex-direction: column;
}
</style>

<!-- MAKE MUCH MORE DISTINCT COLORS ON CODES SO USERS CAN DIFFERENTIATE KEY TO VALUE -->