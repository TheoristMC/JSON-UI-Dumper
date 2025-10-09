<script setup>
import { computed, onMounted, ref } from "vue";

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
    const filesJoined = (await getAllUIFiles());
    const mappedFiles = filesJoined.map((file) => {
      return { name: file.name, contents: JSON5.parse(file.contents) };
    });

    const collectedProperties = collectProperties(mappedFiles);

    Object.entries(collectedProperties).forEach(([ k, v ]) => {
      properties.value.push({
        title: `${k}`,
        code: v,
      });
    });
  } catch (err) {
    console.error("Error occured:", err);
  }
})
</script>

<template>
  <div class="vert-container">
    <Header title="JSON-UI Dumper"></Header>
    <input v-model="searchQuery" placeholder="Search..."></input>
    <main>
      <!-- Loop through the properties -->
      <PropertyItem v-for="(item, index) in filteredProperties" :key="index" :property-title="item.title"
        :property-code="item.code" />
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

.vert-container > input {
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

  display: flex;
  flex-direction: column;

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
</style>

<!-- MAKE MUCH MORE DISTINCT COLORS ON CODES SO USERS CAN DIFFERENTIATE KEY TO VALUE -->