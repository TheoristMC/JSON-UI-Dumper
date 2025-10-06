<template>
  <footer>
    <p>{{ footer }}</p>
  </footer>
</template>

<script setup>
defineProps({
  footer: {
    type: String,
    default: "Placeholder"
  }
})
</script>

<style scope>
footer {
  background-color: rgba(0, 0, 0, 0.5);
  border-top: 4px solid #444;
  padding: 10px;
}

footer>p {
  text-align: center;
  font-family: "MinecraftSeven";
  color: #ffffff;
  margin: 0;
}
</style>