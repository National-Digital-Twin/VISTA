// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { forwardRef } from 'react';
import ControlButton from '../ControlButton';

type MapStyleButtonProps = {
    isOpen: boolean;
    onToggle: () => void;
};

const MapStyleButton = forwardRef<HTMLButtonElement, MapStyleButtonProps>(({ isOpen, onToggle }, ref) => {
    return (
        <ControlButton ref={ref} onClick={onToggle} aria-label="Change map style" tooltip="Change map style" isActive={isOpen}>
            <img src={isOpen ? '/icons/map-v2/layers-white.svg' : '/icons/map-v2/layers.svg'} alt="Layers" width={24} height={24} />
        </ControlButton>
    );
});

MapStyleButton.displayName = 'MapStyleButton';

export default MapStyleButton;
