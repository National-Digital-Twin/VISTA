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
