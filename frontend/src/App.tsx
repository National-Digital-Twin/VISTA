import { useLayoutEffect } from "react";
import { useDarkMode } from "usehooks-ts";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import PageHeader from "@/components/PageHeader";
import AppBody from "@/components/AppBody";

library.add(fas);

export default function App() {
  // Propagate dark mode to the dark/light class and data attributes on the root
  // element. This is done through an effect because the `html` element itself
  // is outside of React's management.

  // We're using useLayoutEffect here rather than useEffect because we want to
  // be quite sure this happens _before_ the browser has the chance to repaint.
  const { isDarkMode } = useDarkMode();

  useLayoutEffect(() => {
    const html = document.documentElement;

    if (isDarkMode) {
      html.classList.add("dark");
      html.classList.remove("light");
    } else {
      html.classList.add("light");
      html.classList.remove("dark");
    }
    html.setAttribute("data-color-scheme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  return (
    <div style={{ overflow: "hidden" }}>
      <PageHeader appName="Paralog" />
      <AppBody />
    </div>
  );
}
