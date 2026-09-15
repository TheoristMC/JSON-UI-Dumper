<template>
  <input
    class="text-field"
    :placeholder="placeholder"
    :id="id"
    autocomplete="off"
    spellcheck="false"
    v-model="searchQuery"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue";

import debounce from "../../composables/useDebounce";

interface TextFieldProps {
  placeholder?: string;
  id: string;
  onChange?: (query: string) => void;
}

const props = withDefaults(defineProps<TextFieldProps>(), {
  placeholder: "...",
  onChange: () => null,
});

const searchQuery = ref<string>("");

const handleSearch = debounce((query: string) => props.onChange(query), 500);

watch(searchQuery, handleSearch);
</script>

<style scoped>
.text-field {
  font-family: "MinecraftSeven";
  color: #aaaaaa;
  outline: none;
  caret-color: #6cc349;
  padding: 12px 15px;
  background-color: #313233;
  border: 3px solid #1e1e1f;
  box-shadow: 0px 4px 0px #1e1e1f inset;
}

.text-field > input::placeholder {
  margin-top: 4px;
}
</style>
