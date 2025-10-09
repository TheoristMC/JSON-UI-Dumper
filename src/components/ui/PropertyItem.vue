<template>
  <div class="root">
    <div class="checkbox-wrapper">
      <input type="checkbox" v-model="isExpanded">
      <div class="fake-checkbox">
        <h1>{{ propertyTitle }}</h1>
        <Arrow class="checkbox-arrow"></Arrow>
      </div>
    </div>
    <div v-if="isExpanded" class="checkbox-content">
      <p>{{ propertyCode }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import Arrow from '../icons/Arrow.vue';

const isExpanded = ref(false);

const props = defineProps({
  propertyTitle: {
    type: String,
    default: "???"
  },
  propertyCode: {
    default: "Unknown"
  }
});
</script>

<style scoped>
.root {
  margin: 6px 9px;

  display: flex;
  flex-direction: column;
}

.checkbox-content {
  margin-top: 3px;
  padding: 6px;

  max-height: 300px;
  overflow-y: auto;

  background-color: #313233;
  box-shadow:
    0 3px 0 0 #1d1e1f,
    3px 0 0 0 #1d1e1f,
    -3px 0 0 0 #1d1e1f,
    3px 3px 0 0 #1d1e1f,
    -3px 3px 0 0 #1d1e1f;
}

.checkbox-content>p {
  margin: 0;

  color: #AAAAAA;
  font-family: "MinecraftSeven";
  font-weight: normal;

  white-space: pre-wrap;
  word-break: break-word;
}

.checkbox-wrapper {
  position: relative;
  display: inline-block;
}

.checkbox-wrapper>input {
  opacity: 0;
  position: absolute;
  inset: 0;
  cursor: pointer;
  z-index: 2;
}

.checkbox-wrapper>.fake-checkbox {
  padding: 12px;
  background-color: #313233;

  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;

  border-left: 3px solid #464747;
  border-top: 3px solid #464747;
  border-bottom: 3px solid #1d1e1f;
  border-right: 3px solid #1d1e1f;

  box-shadow: 0 0 0 3px #1d1e1f;
}

.checkbox-wrapper>.fake-checkbox>h1 {
  margin: 0;

  word-break: break-word;

  font-family: "MinecraftSeven";
  font-weight: normal;
  font-size: 1rem;
  color: #f0f0f0;
}

.checkbox-wrapper>input:checked+.fake-checkbox>.checkbox-arrow {
  transform: scaleY(-1);
}

/* Hover works */
.checkbox-wrapper>input:hover+.fake-checkbox {
  background-color: #48494a;

  border-left: 3px solid #5a5b5c;
  border-top: 3px solid #5a5b5c;
  border-bottom: 3px solid #2b2c2c;
  border-right: 3px solid #2b2c2c;
}
</style>