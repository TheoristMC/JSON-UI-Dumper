/**
 * Check if the value type is an object literal
 * @param {Object} obj
 * @returns {boolean}
 */
function isObjectLiteral(obj) {
  return Object.prototype.toString.call(obj) === "[object Object]";
}

export { isObjectLiteral };
