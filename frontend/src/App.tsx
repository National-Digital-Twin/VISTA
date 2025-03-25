import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";

import { Box } from "@mui/material";

import PageHeader from "@/components/PageHeader";
import AppBody from "@/components/AppBody";
import config from "@/config/app-config";

library.add(fas);

export default function App() {
  // Propagate dark mode to the dark/light class and data attributes on the root
  // element. This is done through an effect because the `html` element itself
  // is outside of React's management.

  // We're using useLayoutEffect here rather than useEffect because we want to
  // be quite sure this happens _before_ the browser has the chance to repaint.
  if (config.configErrors.length > 0) {
    // This doesn't violate the rules of React vis a vis the hooks below because
    // this value is a constant.
    console.log(config.configErrors);
    return (
      <p className="mx-5 my-2">
        Paralog encountered errors on boot:
        <ul>
          {config.configErrors.map((error) => (
            <li className="ml-2" key={error}>
              — {error}
            </li>
          ))}
        </ul>
      </p>
    );
  }

  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <PageHeader appName="Paralog" />
      </Box>
      <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
        <AppBody />
      </Box>
      {/* <Box sx={{ flexShrink: 0 }}>
        <p>DETAULS sda d sd sad sad sada sd asd as ds</p>
      </Box> */}
    </Box>
  );
}
