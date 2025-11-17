import { forwardRef } from 'react';
import ControlButton from '../ControlButton';

interface LegendButtonProps {
    readonly onToggle: () => void;
}

const LegendButton = forwardRef<HTMLButtonElement, LegendButtonProps>(({ onToggle }, ref) => {
    return (
        <ControlButton ref={ref} onClick={onToggle} aria-label="Toggle legend" tooltip="Toggle legend">
            <img src="/icons/map-v2/legend.svg" alt="Legend" width={24} height={24} />
        </ControlButton>
    );
});

LegendButton.displayName = 'LegendButton';

export default LegendButton;
