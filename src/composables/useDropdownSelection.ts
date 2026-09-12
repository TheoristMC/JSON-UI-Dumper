import { reactive } from "vue";

interface SelectionData {
  label: string;
  index: number;
}

class DropdownSelection {
  private static selections = reactive<Record<string, SelectionData>>({});

  /**
   * Sets a current selected data for a specific dropdown.
   */
  static setSelection(dropdownName: string, data: SelectionData) {
    this.selections[dropdownName] = data;
  }

  /**
   * Gets the current selected data from a specific dropdown.
   */
  static getSelection(dropdownName: string): SelectionData | undefined {
    return this.selections[dropdownName];
  }
}

export default DropdownSelection;
