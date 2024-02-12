module.exports = {
  reactScriptsVersion: "react-scripts" /* (default value) */,
  babel: {
    env: { test: { plugins: ["@babel/plugin-transform-modules-commonjs"] } },
    loaderOptions: {
      ignore: ["./node_modules/mapbox-gl/dist/mapbox-gl.js"],
    },
  },
  webpack: {
    alias: {
      "mapbox-gl": "maplibre-gl",
    },
  },
  jest: {
    /**
     * To modify the Jest configuration without ejecting from Create React App
     * (CRA), we can amend the config by using the function below.
     */
    configure: (jestConfig) => {
      jestConfig.setupFiles.push("<rootDir>/src/test-env-setup.js");
      return jestConfig;
    },
  },
};
