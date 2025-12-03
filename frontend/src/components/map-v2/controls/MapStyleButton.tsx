import { forwardRef } from 'react';
import ControlButton from '../ControlButton';

interface MapStyleButtonProps {
    readonly isOpen: boolean;
    readonly onToggle: () => void;
}

const MapStyleButton = forwardRef<HTMLButtonElement, MapStyleButtonProps>(({ isOpen, onToggle }, ref) => {
    return (
        <ControlButton ref={ref} onClick={onToggle} aria-label="Change map style" tooltip="Change map style" isActive={isOpen}>
            <img src="/icons/map-v2/layers.svg" alt="Layers" width={24} height={24} />
        </ControlButton>
    );
});

MapStyleButton.displayName = 'MapStyleButton';

export default MapStyleButton;
