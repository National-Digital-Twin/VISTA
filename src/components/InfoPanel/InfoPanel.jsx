import React, { useState } from "react";
import { InfoPanelActions, InfoPanelHeader } from "./InfoPanelHeader";

import SelectedDetails from "./SelectedDetails";

const InfoPanel = ({ infoPanelHeader, infoPanelBody }) => {
  const [button, setButton] = useState();
  return (
    <div>
      <InfoPanelHeader>
        <InfoPanelActions>{button}</InfoPanelActions>
      </InfoPanelHeader>
      <SelectedDetails setButton={setButton} />
    </div>
  );
};

export default InfoPanel;
