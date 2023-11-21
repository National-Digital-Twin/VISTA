import * as assessments from "./assessments";
import * as assets from "./assets";
import * as floodWatchAreas from "./flood-watch-areas";
import * as common from "./common";
import { measureFetch } from "./utils";

class API {
  constructor() {
    this.assessments = assessments;
    this.assets = assets;
    this.floodWatchAreas = floodWatchAreas;
    this.common = common;
  }

  fetchWrapper(url, options) {
    const fetchFunction = () => fetch(url, options);
    const fetchWithMiddleware = measureFetch(fetchFunction);
    return fetchWithMiddleware(url, options);
  }

  static getInstance() {      
    if (!API.instance) {
      API.instance = new API();
    }
    return API.instance;
  }
}

export default API.getInstance();
