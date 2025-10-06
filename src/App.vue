<script setup>
import Header from './components/ui/Header.vue';
import Footer from './components/ui/Footer.vue';
</script>

<template>
  <div class="vert-container">
    <Header title="JSON-UI Dumper"></Header>
    <main>
      
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

  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}
</style>
