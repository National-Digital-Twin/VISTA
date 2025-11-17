import { forwardRef, useMemo } from 'react';
import { Badge } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import ControlButton from '../ControlButton';
import { fetchAllLiveStations } from '@/api/hydrology';

interface FloodWarningsButtonProps {
    readonly isOpen: boolean;
    readonly onToggle: () => void;
}

const FloodWarningsButton = forwardRef<HTMLButtonElement, FloodWarningsButtonProps>(({ onToggle }, ref) => {
    const { data: floodWarnings } = useQuery({
        queryKey: ['floodWarnings'],
        queryFn: async () => {
            const geoJsonData = await fetchAllLiveStations();
            return geoJsonData.features;
        },
    });

    const badgeContent = useMemo(() => {
        if (!floodWarnings || floodWarnings.length === 0) {
            return 0;
        }
        return floodWarnings.filter((station: any) => station.properties.atrisk === true).length;
    }, [floodWarnings]);

    const button = (
        <ControlButton ref={ref} onClick={onToggle} aria-label="Flood warnings" tooltip="Flood warnings">
            <Badge badgeContent={badgeContent > 0 ? badgeContent : undefined} color="error">
                <img src="/icons/Warning.svg" alt="Flood warnings" width={24} height={24} />
            </Badge>
        </ControlButton>
    );

    return button;
});

FloodWarningsButton.displayName = 'FloodWarningsButton';

export default FloodWarningsButton;
