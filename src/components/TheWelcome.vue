<script setup>
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'

import { ref, onMounted } from 'vue';

import { getAllUIFiles, getMetadata } from '@/helper/getUIFiles';

const latestVersion = ref("Loading...");
const availableFiles = ref("Loading...");

onMounted(async () => {
  latestVersion.value = (await getMetadata()).version;

  const availableUIFiles = (await getAllUIFiles()).map((file) => file.name);

  availableFiles.value = availableUIFiles.join(", ");
});

</script>

<template>
  <WelcomeItem>
    <template #icon>
      <DocumentationIcon></DocumentationIcon>
    </template>
    <template #heading>Game Version</template>

    <p>{{ latestVersion }}</p>
  </WelcomeItem>

  <WelcomeItem>
    <template #icon>
      <EcosystemIcon></EcosystemIcon>
    </template>
    <template #heading>Available Files</template>

    <p>{{ availableFiles }}</p>
  </WelcomeItem>
</template>
