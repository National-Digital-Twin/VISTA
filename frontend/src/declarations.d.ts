declare module "*.png" {
  const value: string;
  export default value;
}

declare module "*.jpg" {
  const value: string;
  export default value;
}

declare module "*.jpeg" {
  const value: string;
  export default value;
}

declare module "*.gif" {
  const value: string;
  export default value;
}

declare module "*.svg" {
  const value: string;
  export default value;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.graphql" {
  const Query: import("graphql").DocumentNode;
  export default Query;
}

interface ImportMetaEnv {
  readonly MODE: string;
  readonly PROD: boolean;
  readonly VITE_PARALOG_API_URL?: string;
  readonly VITE_ONTOLOGY_SERVICE_URL?: string;
  readonly VITE_AUTH_TEST_URL?: string;
  readonly VITE_MAP_TILER_TOKEN?: string;
  readonly VITE_ORDNANCE_SURVEY_API_KEY?: string;
  readonly VITE_CANNY_APP_ID?: string;
  readonly VITE_CANNY_BOARD_TOKEN?: string;
  readonly VITE_MET_OFFICE_GLOBAL_SPOT_API_KEY?: string;
  /**
   * @deprecated Use VITE_MET_OFFICE_GLOBAL_SPOT_API_KEY instead
   */
  readonly VITE_GLOBAL_SPOT_MET_OFFICE_API_KEY?: string;
  readonly VITE_REAL_TIME_TRAINS_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
