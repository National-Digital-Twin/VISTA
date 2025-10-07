import { useRef } from 'react';
import Box from '@mui/material/Box';
import { faList } from '@fortawesome/free-solid-svg-icons';
import { useBoolean, useOnClickOutside } from 'usehooks-ts';
import LegendContent from './Content';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';

export default function LegendControl() {
    const { value: isOpen, toggle: toggleOpen, setFalse: close } = useBoolean(false);
    const ref = useRef<HTMLDivElement>(null);

    useOnClickOutside(ref, close);

    return (
        <Box ref={ref} sx={{ display: 'flex', justifyContent: 'end' }}>
            <ToolbarButton title="Toggle Legend" onClick={toggleOpen} icon={faList} />
            {isOpen && <LegendContent />}
        </Box>
    );
}
