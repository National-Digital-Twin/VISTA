// import { memo } from "react"
import { memoize } from "lodash";
import config from "../../config/app-config"

const MB_STYLES = [
    { id: "mapbox://styles/mapbox/light-v10", name: "Light-v10" },
    { id: "mapbox://styles/mapbox/dark-v10", name: "Dark-v10" },
    { id: "mapbox://styles/mapbox/satellite-streets-v11", name: "Satellite" },
    { id: "mapbox://styles/mapbox/streets-v11", name: "Streets" },
    { id: "mapbox://styles/mapbox/outdoors-v11", name: "Outdoors" },
  ];
export const getMapStyles =memoize(() => {
    const styles = config.mb.token && config.mb.token !== "offline_enabled" ? MB_STYLES : []
    if(config.map.offline.enabled){
        const offlineStyles = config.map.offline.styles.map(style => ({id:`${config.map.offline.base_url}${config.map.offline.styles_path.replace("<STYLE>",style)}`, name: style.charAt(0).toUpperCase() + style.slice(1)}))
        styles.push(...offlineStyles)
    }
    return styles
})