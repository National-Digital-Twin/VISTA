import { styled } from "@mui/material/styles";
import Switch from "@mui/material/Switch";

const MaterialUISwitch = styled(Switch)(({ theme }) => ({
  width: 54,
  height: 26,
  [theme.breakpoints.up("md")]: { width: 50, height: 24 },
  [theme.breakpoints.up("xl")]: { width: 54, height: 26 },
  padding: 7,
  "& .MuiSwitch-switchBase": {
    margin: 1,
    padding: 0,
    transform: "translateX(6px)",
    "&.Mui-checked": {
      color: "#fff",
      transform: "translateX(22px)",
      "& .MuiSwitch-thumb": {
        backgroundColor: "#3670b3", // Background color when checked
      },
      "& .MuiSwitch-thumb:before": {
        backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
          "#fff",
        )}" d="M9 21.035l-9-8.638 2.791-2.87 6.156 5.874 12.21-12.436 2.843 2.817z"/></svg>')`,
      },
      "& + .MuiSwitch-track": {
        opacity: 0.5,
        backgroundColor: "#3670b3",
      },
    },
  },
  "& .MuiSwitch-thumb": {
    backgroundColor: "#ffffff", // Background color when unchecked

    width: 24,
    height: 24,
    [theme.breakpoints.up("md")]: { width: 20, height: 20 },
    [theme.breakpoints.up("xl")]: { width: 24, height: 24 },
    "&::before": {
      content: "''",
      position: "absolute",
      width: "100%",
      height: "100%",
      left: 0,
      top: 0,
      backgroundRepeat: "no-repeat",
      backgroundPosition: "center",
      backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" height="16" width="16" viewBox="0 0 24 24"><path fill="${encodeURIComponent(
        "#5D5A5A",
      )}" d="M0 10h24v4h-24z"/></svg>')`,
    },
  },
  "& .MuiSwitch-track": {
    opacity: 1,
    backgroundColor: "#aab4be",
    borderRadius: 20 / 2,
  },
}));

export default MaterialUISwitch;
