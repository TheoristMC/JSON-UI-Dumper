<script setup>
import { onMounted, ref } from "vue";
import { getAllUIFiles } from "./js/getUIFiles";
import JSON5 from "json5"
import Header from './components/ui/Header.vue';
import Footer from './components/ui/Footer.vue';
import PropertyItem from './components/ui/PropertyItem.vue';

const properties = ref([]);

onMounted(async () => {
  try {
    const filesJoined = (await getAllUIFiles());

    const namespaces = [];

    filesJoined.forEach((file, index) => {
      const { namespace } = JSON5.parse(file.contents);
      if (!namespace) return;

      namespaces.push(namespace);

      if (index === (filesJoined.length - 1)) {
        properties.value.push({
          title: "Namespace",
          code: namespaces,
        });
      }
    });
  } catch (err) {
    console.error("Error occured:", err);
  }
})
</script>

<template>
  <div class="vert-container">
    <Header title="JSON-UI Dumper"></Header>
    <main>
      <!-- Loop through the properties -->
      <PropertyItem v-for="(item, index) in properties" :key="index" :property-title="item.title"
        :property-code="item.code" />
    </main>
    <Footer footer="Credits to @MinecraftBedrockArabic"></Footer>
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

main {
  flex: 1;

  display: flex;
  flex-direction: column;

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
</style>
