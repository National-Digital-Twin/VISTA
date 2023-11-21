import * as assessments from "./assessments";
import * as assets from "./assets";
import * as floodWatchAreas from "./flood-watch-areas";
import * as common from "./common";

class API {
  constructor() {
    this.assessments = assessments;
    this.assets = assets;
    this.floodWatchAreas = floodWatchAreas;
    this.common = common;
  }


  static getInstance() {      
    if (!API.instance) {
      API.instance = new API();
    }
    return API.instance;
  }
}

export default API.getInstance();
