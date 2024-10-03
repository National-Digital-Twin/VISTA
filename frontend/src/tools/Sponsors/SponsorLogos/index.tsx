import classNames from "classnames";
import NDTPLogo from "./assets/ndtp-dark-cropped.png";

export interface SponsorLogosProps {
  /** Additional classes to add to the top-level element */
  className?: string;
}

/** Logos of the Paralog sponsors, for the bottom-left of the screen */
export default function SponsorLogos({ className }: SponsorLogosProps) {
  const medium = 150;
  const height = 30;
  return (
    <div className={classNames("flex", className)}>
      <img
        src={NDTPLogo}
        width={medium}
        height={height}
        alt="Logo of the National Digital Twin Programme, part of His Majesty's Government"
      />
    </div>
  );
}
