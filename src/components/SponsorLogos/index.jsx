import React from "react";
import BEIS from "./assets/beis-logo.png";
import RoyalEng from "./assets/Royal_Engineers_badge.png";
import "./sponsor-logos.css";

const SponsorLogos = () => {
  const small = 38;
  const medium = 180;
  return (
    <div className="sponsor-logos">
      <img src={BEIS} width={medium} height={45} alt="beis logo" />
      <img src={RoyalEng} width={small} alt="royal engineers logo" />
    </div>
  );
};

export default SponsorLogos;
