module.exports = {
  reactScriptsVersion: "react-scripts" /* (default value) */,
  babel: {
    env: { test: { plugins: ["@babel/plugin-transform-modules-commonjs"] } },
    loaderOptions: {
      ignore: ["./node_modules/mapbox-gl/dist/mapbox-gl.js"],
    },
  },
};
