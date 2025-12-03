import { forwardRef } from 'react';
import ControlButton from '../ControlButton';

interface AssetInfoButtonProps {
    readonly isOpen: boolean;
    readonly onToggle: () => void;
}

const AssetInfoButton = forwardRef<HTMLButtonElement, AssetInfoButtonProps>(({ isOpen, onToggle }, ref) => {
    return (
        <ControlButton ref={ref} onClick={onToggle} aria-label="Asset information" tooltip="Asset information" isActive={isOpen}>
            <img src={isOpen ? '/icons/map-v2/asset-table-white.svg' : '/icons/map-v2/asset-table.svg'} alt="Asset information" width={24} height={24} />
        </ControlButton>
    );
});

AssetInfoButton.displayName = 'AssetInfoButton';

export default AssetInfoButton;
