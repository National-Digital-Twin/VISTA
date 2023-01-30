export const HEADINGS_COL_SPAN = 3;

export const generateCarverGrid = (assets, dependencies) => {
  const ROWS = assets.length;
  const COLS = ROWS + HEADINGS_COL_SPAN;
  let grid = new Array(ROWS);
  let headings = new Array(0);

  for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
    grid[rowIndex] = [];
    headings[rowIndex] = assets[rowIndex].id;

    for (let colIndex = HEADINGS_COL_SPAN; colIndex < COLS; colIndex++) {
      const asset = assets[rowIndex];
      grid[rowIndex][0] = asset.id;
      grid[rowIndex][1] = asset.dependent.count;
      grid[rowIndex][2] = asset.dependent.criticalitySum;

      if (rowIndex === colIndex - HEADINGS_COL_SPAN) {
        grid[rowIndex][colIndex] = { color: "#4B4B4B", value: "", element: undefined };
      } else if (
        asset.uri === dependencies[colIndex]?.dependent?.uri ||
        asset.uri === dependencies[colIndex]?.provider?.uri
      ) {
        grid[rowIndex][colIndex] = {
          color: dependencies[colIndex].criticalityColor,
          value: dependencies[colIndex].criticality,
          element: dependencies[colIndex]
        };
      } else {
        grid[rowIndex][colIndex] = { color: "transparent", value: "", element: undefined };
      }
    }
  }
  return { grid, headings };
};