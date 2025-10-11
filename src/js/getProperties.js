import { isObjectLiteral } from "./helper";

function initGlobalVars(json) {
  const globalVariables = {};

  Object.entries(json).forEach(([variableName, variableValue]) => {
    globalVariables[`${variableName}`] = variableValue;
  });

  return globalVariables;
}

/**
 * Check if the value of a property is considered a UI control
 * @param {string} k
 * @param {any} v
 * @returns {boolean}
 */
function isAControl(k, v) {
  if (!isObjectLiteral(v)) return false;

  return (
    k.includes("@") || v.hasOwnProperty("type") || v.hasOwnProperty("anim_type")
  );
}

/**
 * Check if the key of the property is considered a variable
 * @param {string} v
 * @returns {boolean}
 */
function isAVariable(v) {
  if (typeof v !== "string") return false;
  return v.includes("$") || v.endsWith("|default");
}

/**
 * Check if the key of the property should be blacklisted/ignored
 * @param {string} k
 * @returns {boolean}
 */
function isPropBlacklisted(k) {
  if (typeof k !== "string") return false;

  // "common_cycler" is a UI control, not a property, but isAControl()
  // can't identify it since Mojang made it a bit tricky to identify
  const blacklist = ["common_cycler"];

  return blacklist.includes(k);
}

/**
 * Collects all properties from an array of JSON objects and merges them into a single global key.
 * @param {{ name: string, contents: string | undefined}[]} arrOfJSON
 */
function collectProperties(arrOfJSON) {
  const properties = {};
  const variables = [];

  /**
   * Dissects all properties inside a UI control and bind it to a global property
   * @param {any} v
   */
  function mergeControls(v) {
    Object.entries(v).forEach(([k2, v2]) => {
      if (k2 === "controls" && Array.isArray(v2)) {
        v2.forEach((obj) => {
          Object.entries(obj).forEach(([k3, v3]) => {
            mergeControls(v3);
          });
        });

        return;
      }

      mergeProperties(k2, v2);
    });
  }

  /**
   * Dissects all properties inside a property
   * @param {string} k
   * @param {any} v
   */
  function mergeObjects(k, v) {
    Object.entries(v).forEach(([k2, v2]) => {
      if (Array.isArray(v2)) {
        v2.forEach((v3) => {
          mergeProperties(`${k} > ${k2}`, v3);
        });
        return;
      }

      mergeProperties(`${k} > ${k2}`, v2);
    });
  }

  /**
   * Dissects all properties inside an array property
   * @param {string} k
   * @param {any} v
   */
  function mergeArrays(k, v) {
    v.forEach((obj) => {
      if (!isObjectLiteral(obj)) return;

      Object.entries(obj).forEach(([k2, v2]) => {
        // We need a special case for "variables" property as it controls
        // other properties and the only native property it has is "requires"
        if (k === "variables" && k2 !== "requires") {
          mergeProperties(k2, v2);
          return;
        }

        mergeProperties(`${k} > ${k2}`, v2);
      });
    });
  }

  /**
   * Merges properties to the global properties
   * @param {string} k
   * @param {any} v
   */
  function mergeProperties(k, v) {
    try {
      const elemIsAControl = isAControl(k, v);

      // If a property is a variable, then put it to the global variables
      // and since variables can be duplicated across files, use 2D array
      if (isAVariable(k)) {
        variables.push([k, v]);
        return;
      }

      if (Array.isArray(v) && v.every(isObjectLiteral) && k !== "controls") {
        mergeArrays(k, v);
        return;
      }

      // Return if variables since it has a different approach
      if (!elemIsAControl && isObjectLiteral(v) && k !== "variables") {
        mergeObjects(k, v);
        return;
      }

      if (elemIsAControl) return mergeControls(v);

      if (!Object.prototype.hasOwnProperty.call(properties, k)) {
        properties[k] = [v];
        return;
      }

      const existing = properties[k];
      if (Array.isArray(existing)) {
        // Check if the value already exists (only primitives)
        if (!existing.includes(v)) existing.push(v);
      } else {
        properties[k] = [v];
      }
    } catch (err) {
      console.error("Collecting properties led to an error: \n", err);
    }
  }

  arrOfJSON.forEach((json) => {
    if (json.name === "_global_variables.json") {
      properties["Global Variables"] = initGlobalVars(json.contents);
      return;
    }

    Object.entries(json.contents).forEach(([k, v]) => {
      if (json.name === "_ui_defs.json") {
        properties["UI Definitions"] = v;
        return;
      }

      if (isPropBlacklisted(k)) return;

      mergeProperties(k, v);
    });
  });

  return properties;
}

export { collectProperties };
