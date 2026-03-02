import { Paper, Stack, Typography, Table, TableContainer, TableHead, TableBody, TableRow, TableCell, TablePagination, Box } from '@mui/material';
import { forwardRef, useState, useMemo, useCallback } from 'react';
import { getAssetTypeName } from '../../utils/getAssetTypeName';
import type { AssetCategory } from '@/api/asset-categories';
import type { Asset } from '@/api/assets-by-type';

type AssetInfoPanelProps = {
    open: boolean;
    assets: Asset[];
    assetCategories?: AssetCategory[];
    isFullScreen?: boolean;
};

const ROWS_PER_PAGE = 20;

const AssetInfoPanel = forwardRef<HTMLDivElement, AssetInfoPanelProps>(({ open, assets, assetCategories, isFullScreen = false }, ref) => {
    const [page, setPage] = useState(0);

    const displayedAssets = useMemo(() => {
        return assets.slice(page * ROWS_PER_PAGE, page * ROWS_PER_PAGE + ROWS_PER_PAGE);
    }, [assets, page]);

    const handleChangePage = useCallback((_event: unknown, newPage: number) => {
        setPage(newPage);
    }, []);

    if (!open) {
        return null;
    }

    const hasAssets = assets.length > 0;

    return (
        <Paper
            ref={ref}
            elevation={4}
            sx={{
                p: 2,
                ...(isFullScreen
                    ? {
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                      }
                    : {
                          minWidth: 220,
                          maxWidth: 300,
                      }),
            }}
        >
            <Stack spacing={2} sx={isFullScreen ? { height: '100%', display: 'flex', flexDirection: 'column' } : {}}>
                <Typography variant="subtitle1" fontWeight={600}>
                    Asset Information
                </Typography>
                {hasAssets ? (
                    <>
                        <TableContainer sx={isFullScreen ? { flex: 1, overflowY: 'auto' } : { maxHeight: '60vh', overflowY: 'auto' }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 600 }}>Asset ID</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Type</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Longitude</TableCell>
                                        <TableCell sx={{ fontWeight: 600 }}>Latitude</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {displayedAssets.map((asset, index) => {
                                        const typeName = getAssetTypeName(asset.type, assetCategories) || 'Unknown';
                                        return (
                                            <TableRow key={asset.id || index} hover>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{asset.id}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{asset.name || 'N/A'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{typeName}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{asset.lng ? asset.lng.toFixed(6) : 'N/A'}</TableCell>
                                                <TableCell sx={{ whiteSpace: 'nowrap' }}>{asset.lat ? asset.lat.toFixed(6) : 'N/A'}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        {assets.length > ROWS_PER_PAGE && (
                            <TablePagination
                                component="div"
                                count={assets.length}
                                page={page}
                                onPageChange={handleChangePage}
                                rowsPerPage={ROWS_PER_PAGE}
                                rowsPerPageOptions={[]}
                            />
                        )}
                        <Typography variant="caption" color="text.secondary">
                            Showing {displayedAssets.length} of {assets.length} assets
                        </Typography>
                    </>
                ) : (
                    <Box sx={isFullScreen ? { py: 4, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' } : { py: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            No assets are currently displayed. Please activate asset layers to view asset information.
                        </Typography>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
});

AssetInfoPanel.displayName = 'AssetInfoPanel';

export default AssetInfoPanel;
