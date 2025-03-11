// Vite fills in these environment variables for us

const config = {
  configErrors: [] as string[],
};

const notify = import.meta.env.PROD ? config.configErrors.push : console.warn;

export default config;
