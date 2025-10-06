<template>
  <div class="root">
    <h1>{{ propertyTitle }}</h1>
    <pre>
      <p>{{ propertyCode }}</p>
    </pre>
  </div>
</template>

<script setup>
const props = defineProps({
  propertyTitle: {
    type: String,
    default: "???"
  },
  propertyCode: {
    default: "Unknown"
  }
})
</script>

<style scoped>
.root {
  margin-top: 3px;
  padding: 14px;

  box-sizing: border-box;

  display: flex;
  flex-direction: column;

  background-color: #48494a;
  border-bottom: 3px solid #333435;
  box-shadow: 0px 3px 0px #5d5e5f;
}

.root>h1 {
  font-family: "MinecraftTen";
  font-size: 1.5rem;
  color: #f0f0f0;

  margin: 4px 0;
}

.root>pre {
  margin: 0;

  display: flex;

  background-color: #313233;
  border: 3px solid #1e1e1f;
  box-shadow: 0px 6px 0px #1e1e1f inset;
  padding: 10px 15px;
}

pre>p {
  font-family: "MinecraftSeven";
  color: #AAAAAA;

  width: 100%;
  margin: 3px 0 0 0;

  white-space: pre-wrap;
  word-break: break-word;
}
</style>