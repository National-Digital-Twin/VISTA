import ColorScale from "color-scales";
/**
 * IsEmpty
 * @param {any} input
 * @returns {boolean}
 */
export const IsEmpty = (input) =>
  !input || input.length === 0 || Object.keys(input).length === 0;

export const colourScale = new ColorScale(0, 100, ["#0e8600", "#ff0100"], 1);
