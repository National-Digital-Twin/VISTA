import React from "react";
import BEIS from "./assets/beis-standard-white-logo.png";
import RoyalEng from "./assets/Royal_Engineers_badge.png";
import "./sponsor-logos.css";

const SponsorLogos = () => {
  const small = 38;
  const medium = 80;
  return (
    <div className="sponsor-logos">
      <img src={BEIS} height={small} width={medium} alt="beis logo" />
      <img
        src={RoyalEng}
        height={small}
        width={small}
        alt="royal engineers logo"
      />
    </div>
  );
};

export default SponsorLogos;
