// import { computed, nextTick, onMounted, ref, watch } from "vue"; // import {
getAllUIFiles } from "./js/getUIFiles"; // import { collectProperties } from
"./js/getProperties"; // import JSON5 from "json5"; // import PropertyItem from
'./components/ui/PropertyItem.vue'; // const properties = ref([]); // const
searchQuery = ref(""); // const filteredProperties = computed(() => { // if
(!searchQuery.value) return properties.value; // return
properties.value.filter((item) =>
item.title.toLowerCase().includes(searchQuery.value.toLowerCase())); // }); //
onMounted(async () => { // try { // const filesJoined = await getAllUIFiles();
// const mappedFiles = filesJoined.map(file => ({ // name: file.name, //
contents: JSON5.parse(file.contents), // })); // const collectedProperties =
collectProperties(mappedFiles); // const propertyEntries =
Object.entries(collectedProperties); // // Don't sort the two pinned items //
const pinnedItems = propertyEntries.slice(0, 2); // // Sort the rest
alphabetically // const items = propertyEntries.slice(2).sort(([keyA], [keyB])
=> // keyA.localeCompare(keyB) // ); // // Combine them back together //
properties.value = [...pinnedItems, ...items].map(([k, v]) => ({ // title: k, //
code: JSON.stringify(v, null, 2), // })); // } catch (err) { //
console.error("Error occured during data load:\n", err); // } // }); // const
listContainer = ref(null); // // Merge ref from virtual scrolling to list
container // const containerRef = (el) => { // containerProps.ref.value = el; //
listContainer.value = el; // }; // const { containerProps, wrapperProps, list }
= useVirtualList(filteredProperties, { // itemHeight: 61, // }); //
watch(searchQuery, async() => { // await nextTick() // if (listContainer.value)
listContainer.value.scrollTop = 0; // });
<script setup lang="ts">
import Header from "./components/ui/Header.vue";
import Dropdown from "./components/ui/Dropdown.vue";
import TextField from "./components/ui/TextField.vue";

const items = Array.from({ length: 10 }, (_, i) => `Item #${i + 1}`);
</script>

<template>
  <Header title="JSON-UI Dumper"></Header>
  <div class="top-nav">
    <TextField id="search-bar" placeholder="Search properties..."></TextField>
    <Dropdown
      id="version-dropdown"
      dropdown-name="v-dropdown"
      :dropdown-items="items"
    ></Dropdown>
  </div>
  <main>
    <!-- <div v-bind="wrapperProps">
      <PropertyItem 
        v-for="{ index, data } in list"
        :key="index"
        :property-title="data.title"
        :property-code="data.code"
      >
      </PropertyItem>
    </div> -->
  </main>
</template>

<style scoped>
.top-nav {
  display: grid;
  grid-template-columns: 3fr 1fr;
  align-items: center;
  margin: 8px 10px;
  gap: 8px;
}

main {
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

#version-dropdown {
  margin-bottom: 4px;
}

@media (max-width: 500px) {
  .top-nav {
    display: flex;
    flex-direction: column;
  }

  #search-bar {
    width: 100%;
  }

  #version-dropdown {
    width: calc(100% - 4px);
  }
}
</style>

<!-- MAKE MUCH MORE DISTINCT COLORS ON CODES SO USERS CAN DIFFERENTIATE KEY TO VALUE -->
