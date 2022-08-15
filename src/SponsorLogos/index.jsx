import React from "react";
import BEIS from "./assets/beis-standard-white-logo.png";
import RoyalEng from "./assets/Royal_Engineers_badge.png";
import "./sponsor-logos.css";

const SponsorLogos = () => {
  const small = 38;
  const width = 80;
  return (
    <div className="sponsor-logos">
      <img src={BEIS} height={small} width={width} alt="boo" />
      <img src={RoyalEng} height={small} width={small} alt="yah" />
    </div>
  );
};

export default SponsorLogos;
