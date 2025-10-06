import React, { useRef } from 'react';
import { useBoolean, useOnClickOutside } from 'usehooks-ts';
import Box from '@mui/material/Box';
import AssetTable from './AssetTable';
import ToolbarButton from '@/components/Map/SideButtons/ToolbarButton';

export default function AssetTableSideButton() {
    const { value: showTable, setFalse: closeTable, toggle: toggleTable } = useBoolean(false);
    const widgetRef = useRef<HTMLElement>(null);

    useOnClickOutside(widgetRef as React.RefObject<HTMLElement>, closeTable);

    return (
        <Box ref={widgetRef} sx={{ display: 'flex', justifyContent: 'end' }}>
            {showTable && <AssetTable />}
            <ToolbarButton title="Asset Table" onClick={toggleTable} svgSrc="icons/Asset table.svg" />
        </Box>
    );
}
