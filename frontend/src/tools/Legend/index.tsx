import { useBoolean, useOnClickOutside } from 'usehooks-ts';
import { useRef } from 'react';
import { Box, Link } from '@mui/material';
import LegendContent from './Content';
import styles from './style.module.css';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';

export const TOOL_NAME = 'Legend';

export function SideButtons() {
    const { value: showLegend, toggle: toggleLegend, setFalse: hideLegend } = useBoolean(false);
    const ref = useRef<HTMLDivElement>(null);

    useOnClickOutside(ref, hideLegend);

    return (
        <Box ref={ref} sx={{ display: 'flex', justifyContent: 'end', pointerEvents: 'auto' }}>
            {showLegend && (
                <Box boxShadow={4} className={styles.menu}>
                    <LegendContent />
                    <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                        <Link component="button" variant="body1" onClick={hideLegend} className={styles.closeButton}>
                            Close
                        </Link>
                    </Box>
                </Box>
            )}
            <ToolbarButton title="Toggle Legend" onClick={toggleLegend} svgSrc="icons/Legend.svg" />
        </Box>
    );
}

export const SIDE_BUTTON_ORDER = 3;
