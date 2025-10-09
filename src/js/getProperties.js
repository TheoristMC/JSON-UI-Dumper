function formatGlobalVariables(json) {
  const globalVariables = {};

  Object.entries(json).forEach(([ variableName, variableValue ]) => {
    globalVariables[`${variableName}`] = variableValue;
  });

  return globalVariables;
}

/**
 * Collects all properties from an array of JSON objects and merges them into a single global key.
 * @param {{ name: string, contents: string | undefined}[]} arrOfJSON
 */
function collectProperties(arrOfJSON) {
  const properties = {};

  function mergeProperties(k, v) {
    if (typeof k !== "string") return;

    // SUPPORT CONTROLS

    if (properties.hasOwnProperty(k)) {
      const existingProp = properties[k];
      if (Array.isArray(existingProp)) {
        // Prevent value duplication (PRIMITIVE VALUES ONLY)
        if (existingProp.includes(v)) return;

        existingProp.push(v);
      } else {
        properties[k] = [v];
      }
    } else {
      properties[k] = v;
    }
  }

  arrOfJSON.forEach((json) => {
    // Limit it to 2 files for showcase
    if (!(json.name === "_global_variables.json" || json.name === "_ui_defs.json")) return;

    if (json.name === "_global_variables.json") {
      properties["Global Variables"] = formatGlobalVariables(json.contents);
      return;
    }

    Object.entries(json.contents).forEach(([ k, v ]) => {
      if (json.name === "_ui_defs.json") {
        properties["UI Definitions"] = v;
        return;
      }

      mergeProperties(k, v);
    })
  });

  return properties;
}

export { collectProperties };
