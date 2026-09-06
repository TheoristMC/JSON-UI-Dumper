<template>
  <div class="dropdown-container">
    <button @click.stop="toggleDropdown" class="dropdown">
      <p>{{ selectedLabel }}</p>
      <Arrow
        class="arrow"
        :style="{ transform: dropdownOpen ? 'scaleY(1)' : 'scaleY(-1)' }"
      ></Arrow>
    </button>
    <div :id="dropdownName" class="dropdown-content">
      <ScrollArea :items="dropdownItems" :item-height="40">
        <template #default="{ item: label, index }">
          <div class="dropdown-item">
            <input
              type="radio"
              :name="dropdownName"
              :value="label"
              :checked="
                DropdownSelection.getSelection(dropdownName)?.index === index
              "
              @change="onSelect(label as string, index)"
            />
            <p>{{ label }}</p>
            <Check class="check"></Check>
          </div>
        </template>
      </ScrollArea>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

import Arrow from "../icons/Arrow.vue";
import Check from "../icons/Check.vue";
import DropdownSelection from "../composables/dropdownSelection.js";
import ScrollArea from "./ScrollArea.vue";

interface DropdownProps {
  dropdownName: string;
  dropdownItems: string[];
  defaultSelectedIndex?: number;
}

const dropdown = withDefaults(defineProps<DropdownProps>(), {
  defaultSelectedIndex: 0,
});

const dropdownOpen = ref(false);
const selectedLabel = computed(
  () => DropdownSelection.getSelection(dropdown.dropdownName)?.label ?? "???",
);

function toggleDropdown() {
  const dropdownContent = document.getElementById(dropdown.dropdownName);
  if (dropdownContent) {
    dropdownOpen.value = !dropdownOpen.value;
    dropdownContent.style.display = dropdownOpen.value ? "flex" : "none";
  }
}

// Set the current selected data every time an item is clicked in the dropdown.
function onSelect(label: string, indexSelected: number) {
  DropdownSelection.setSelection(dropdown.dropdownName, {
    label,
    index: indexSelected,
  });
}

// Set the default selected data for the dropdown.
onMounted(() => {
  const indexSelected = dropdown.defaultSelectedIndex;
  const label = dropdown.dropdownItems[indexSelected];
  if (label) {
    DropdownSelection.setSelection(dropdown.dropdownName, {
      label,
      index: indexSelected,
    });
  }
});
</script>

<style scoped>
.dropdown-container {
  position: relative;
}

/* DROPDOWN CONTENT */

.dropdown-content {
  display: none;
  position: absolute;
  width: 100%;
  max-height: 200px;
  box-shadow: 0 0 0 2px #1a1a1b;
  transform: translateY(6px);
}

.dropdown-item {
  flex: 0 0 40px;
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 2px solid #5a5b5c;
  border-left: 2px solid #5a5b5c;
  border-bottom: 2px solid #323334;
  border-right: 2px solid #323334;
  background-color: #48494a;
  padding: 8px 14px;
  height: 40px;
}

.dropdown-item > .check {
  display: none;
  width: 20px;
  height: 20px;
  fill: #fff;
  margin: 0 24px 8px 0;
}

.dropdown-item > input[type="radio"]:checked ~ .check {
  display: block;
}

.dropdown-item > p {
  margin: 0 0 0 15px;
  color: #fff;
  font-family: "MinecraftSeven";
}

.dropdown-item:has(input[type="radio"]:hover) {
  border-top: 2px solid #69696b;
  border-left: 2px solid #69696b;
  border-bottom: 2px solid #3e3e3f;
  border-right: 2px solid #3e3e3f;
  background-color: #58585a;
}

.dropdown-item > input[type="radio"] {
  appearance: none;
  inset: 0;
  margin: 0;
  width: 100%;
  height: 100%;
  position: absolute;
}

/* DROPDOWN BUTTON */

.dropdown {
  appearance: none;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  padding: 8px 20px;
  background-color: #d0d1d4;
  color: #1a1a1b;
  border: 2px solid #e1e1e4;
  width: 100%;
  box-shadow:
    0px 4px 0px #58585a,
    0 0 0 2px #1a1a1b,
    0 4px 0 2px #1a1a1b;
}

.dropdown:hover {
  background-color: #b1b2b5;
  border-color: #f4f6f9;
}

.dropdown:active {
  background-color: #b1b2b5;
  border-color: #dcdcdc;
  box-shadow: 0 0 0 2px #1a1a1b;
  transform: translateY(4px);
}

.dropdown > p {
  font-family: "MinecraftSeven";
  margin: 2px 10px 0 0;
  font-size: 1rem;
}

.dropdown > .arrow {
  fill: #000;
  width: 20px;
  height: 20px;
  margin: 1px 0;
}
</style>
