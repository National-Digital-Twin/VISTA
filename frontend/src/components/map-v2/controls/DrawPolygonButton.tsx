// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ControlButton from '../ControlButton';

type DrawPolygonButtonProps = {
    isActive: boolean;
    onToggle: () => void;
};

const DrawPolygonButton = ({ isActive, onToggle }: DrawPolygonButtonProps) => {
    return (
        <ControlButton
            onClick={onToggle}
            aria-label={isActive ? 'Close drawing toolbar' : 'Open drawing toolbar'}
            tooltip={isActive ? 'Close drawing toolbar' : 'Open drawing toolbar'}
            isActive={isActive}
        >
            <img
                src={isActive ? '/icons/map-v2/polygon-white.svg' : '/icons/map-v2/polygon.svg'}
                alt={isActive ? 'Close drawing toolbar' : 'Open drawing toolbar'}
                width={24}
                height={24}
            />
        </ControlButton>
    );
};

export default DrawPolygonButton;
