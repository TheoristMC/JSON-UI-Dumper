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
import Metadata, { VersionItem } from "./components/composables/getMetadata.js";
import DropdownSelection from "./components/composables/dropdownSelection.ts";

import { onMounted, ref, watch } from "vue";
import Files from "./components/composables/getFiles.ts";
import PropertyItem from "./components/ui/PropertyItem.vue";
import ScrollArea from "./components/ui/ScrollArea.vue";

const availableVersions = ref<VersionItem[]>([]);
const selectedVersionIndex = ref<number>(0);

const items = ref(
  Array.from({ length: 30 }, (_, i) => ({
    code: crypto.randomUUID(),
    isExpanded: false,
  })),
);

function handleToggle(index: number) {
  const toggle = items.value[index];
  toggle.isExpanded = !toggle.isExpanded;
}

function getItemHeight(index: number) {
  const toggle = items.value[index];
  return toggle.isExpanded ? 200 : 61.6;
}

watch(
  () => DropdownSelection.getSelection("v-dropdown"),
  async (v) => {
    if (!v) return;

    const url = new URL(window.location.href);
    url.searchParams.set("index", v.index.toString());
    window.history.pushState({}, "", url);

    // console.time("Fetch Time");
    // const uiFiles = await Files.getUI(availableVersions.value[v.index].sha);
    // console.timeEnd("Fetch Time");
    // console.time("Convert Time");
    // const parsed = Files.parsedFiles(uiFiles);
    // console.timeEnd("Convert Time")
    // console.log(parsed);
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
        <ScrollArea :items="items" :item-height="getItemHeight">
          <template #default="{ item, index }"
            ><PropertyItem
              :code="item.code"
              :expanded="items[index].isExpanded"
              :title="`UUID #${index + 1}`"
              v-on:toggle="handleToggle(index)"
            ></PropertyItem
          ></template>
        </ScrollArea>
      </div>
    </div>
  </main>
</template>

<style scoped>
main {
  flex: 1;
  display: flex;
  min-height: 0;
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

<!-- MAKE MUCH MORE DISTINCT COLORS ON CODES SO USERS CAN DIFFERENTIATE KEY TO VALUE -->
