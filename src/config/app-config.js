const env = window._env_;

const config = {
    mb:{
        token: env.MAPBOX_TOKEN
    },
    api: {
        url: env.API_URL
    },
    beta: env.BETA === "true"
  };
  
  export default config;