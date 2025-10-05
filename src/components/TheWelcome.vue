<script setup>
import WelcomeItem from './WelcomeItem.vue'
import DocumentationIcon from './icons/IconDocumentation.vue'
import EcosystemIcon from './icons/IconEcosystem.vue'

import { ref, onMounted } from 'vue';

import { getLatestVersion, getFilesInDirectory } from '@/helper/getUIFiles';

const latestVersion = ref("Loading...");
const availableFiles = ref("Loading...");

onMounted(async () => {
  latestVersion.value = (await getLatestVersion("Mojang", "bedrock-samples")).replace("v", "");

  const availableUIFiles = (await getFilesInDirectory("Mojang", "bedrock-samples", "resource_pack/ui")).map((file) => file.name);

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
