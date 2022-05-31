/**
 * IsEmpty
 * @param {any} input
 * @returns {boolean}
 */
export const IsEmpty = (input) =>
  !input || input.length === 0 || Object.keys(input).length === 0;
