import type { BadFile, File } from "../types/file.d.ts";

const DENIED_PROPS: string[] = [
  "common_cycler",
  "cell_overlay",
  "modal_dialog_base",
];

function isObjectLiteral(obj: unknown): boolean {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

class UIProperties {
  private static properties: Record<string, unknown> = {};

  private static isPropDenied(k: string): boolean {
    return DENIED_PROPS.includes(k);
  }

  private static isVariable(k: string): boolean {
    return k.startsWith("$");
  }

  private static isAControl(k: string, v: unknown): boolean {
    if (!isObjectLiteral(v)) return false;

    return (
      k.includes("@") ||
      Object.hasOwn(v as object, "type") ||
      Object.hasOwn(v as object, "anim_type")
    );
  }

  private static mergeControls(v: unknown): void {
    for (const [k2, v2] of Object.entries(v as object)) {
      if (k2 === "controls" && Array.isArray(v2)) {
        v2.forEach((o) =>
          Object.entries(o).forEach(([_, v3]) => this.mergeControls(v3)),
        );

        return;
      }

      this.mergeProps(k2, v2);
    }
  }

  private static mergeObjects(k: string, v: unknown): void {
    for (const [k2, v2] of Object.entries(v as object)) {
      if (Array.isArray(v2)) {
        v2.forEach((v3) => this.mergeProps(`${k} > ${k2}`, v3));
        return;
      }

      this.mergeProps(`${k} > ${k2}`, v2);
    }
  }

  private static mergeArrays(k: string, v: unknown): void {
    if (!Array.isArray(v)) return;

    for (const o of v) {
      if (!isObjectLiteral(o)) continue;

      Object.entries(o).forEach(([k2, v2]) => {
        // We need a special case for 'variables' property as it controls
        // other properties and the only native property it has is "requires"
        if (k === "variables" && k2 !== "requires") {
          this.mergeProps(k2, v2);
          return;
        }

        this.mergeProps(`${k} > ${k2}`, v2);
      });
    }
  }

  private static mergeProps(k: string, v: unknown): void {
    const propIsControl = this.isAControl(k, v);

    if (this.isVariable(k)) {
      // Perhaps support variables in the future
      return;
    }

    if (propIsControl) {
      this.mergeControls(v);
      return;
    }

    // 'controls' is an array but it is handled by mergeControls.
    if (Array.isArray(v) && v.every(isObjectLiteral) && k !== "controls") {
      this.mergeArrays(k, v);
      return;
    }

    // Return if property is variables since it has a different
    // approach.
    if (isObjectLiteral(v) && k !== "variables") {
      this.mergeObjects(k, v);
      return;
    }

    // If the property does not exist yet, declare the value with
    // an array wrapped to it.
    if (!Object.hasOwn(this.properties, k)) {
      this.properties[k] = [v];
      return;
    }

    // If the property does exist already, then push to it
    // since it's an array
    const existingProp = this.properties[k];
    if (Array.isArray(existingProp) && !existingProp.includes(v)) {
      existingProp.push(v);
    }
  }

  static parse(uiProps: File<object>[]): object {
    // Since properties are shared, reset the properties
    // first to remove the stale data.
    this.properties = {};

    for (const { name, content } of uiProps) {
      const hasError = Object.hasOwn(content, "badError");

      if (hasError) {
        const errors = this.properties["File Errors"];
        const errorMessage = (content as BadFile["content"]).badError;

        if (isObjectLiteral(errors)) {
          (errors as Record<string, unknown>)[name] = errorMessage;
        } else {
          this.properties["File Errors"] = {
            message:
              "Bad files are found. Valid data may still appear from other files.",
            [name]: errorMessage,
          };
        }

        continue;
      }

      if (name === "_global_variables.json") {
        this.properties["Global Variables"] = content;
        continue;
      }

      for (const [k, v] of Object.entries(content)) {
        if (name === "_ui_defs.json") {
          this.properties["UI Definitions"] = v;
          continue;
        }

        if (this.isPropDenied(k)) continue;

        this.mergeProps(k, v);
      }
    }

    return UIProperties.properties;
  }
}

export default UIProperties;
