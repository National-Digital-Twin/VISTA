// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import StreetviewIcon from '@mui/icons-material/Streetview';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Box, CircularProgress, Alert, IconButton, Typography, Link } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { noCase } from 'change-case';
import { useState, useCallback, useEffect, useMemo } from 'react';
import AssetScore from './AssetScore';
import ConnectedAssetsSection from './ConnectedAssetsSection';
import { fetchAssetDetails } from '@/api/asset-details';
import { fetchAssetScore } from '@/api/asset-scores';
import type { Asset } from '@/api/assets-by-type';
import { isAsset } from '@/utils';
import { formatAssetDetails } from '@/utils/assetUtils';
import { isEmpty } from '@/utils/isEmpty';

type AssetDetailsPanelProps = {
    selectedElement: Asset | null;
    onBack?: () => void;
    onClose?: () => void;
    scenarioId?: string;
    onConnectedAssetsVisibilityChange?: (
        visible: boolean,
        dependents: Array<{ id: string; geom: string; type: { name: string } }>,
        providers: Array<{ id: string; geom: string; type: { name: string } }>,
    ) => void;
};

const transformConnectedAsset = (item: { id: string; name: string; type: { id: string; name: string } }) => {
    return {
        id: item.id,
        name: item.name,
        assetType: item.type.name,
    };
};

const renderLoadingState = () => (
    <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
        <CircularProgress />
    </Box>
);

const ACCESS_DENIED_MESSAGE = 'You do not have permission to view this asset.';

const renderErrorState = (assetId: string | null, errorMessage?: string | null) => {
    const isAccessDenied = errorMessage?.includes('do not have permission') || errorMessage === ACCESS_DENIED_MESSAGE;
    return (
        <Box sx={{ p: 2 }}>
            <Alert severity={isAccessDenied ? 'warning' : 'error'}>
                {isAccessDenied ? (errorMessage ?? ACCESS_DENIED_MESSAGE) : `Error fetching details for ${assetId || 'this asset'}`}
            </Alert>
        </Box>
    );
};

const renderWarningState = () => (
    <Box sx={{ p: 2 }}>
        <Alert severity="warning">Unable to retrieve details for this asset</Alert>
    </Box>
);

type AssetDetailsQueryState = {
    isLoading: boolean;
    isFetching: boolean;
    isError: boolean;
    error: unknown;
};

const renderAssetDetailsQueryState = (queryState: AssetDetailsQueryState, assetId: string | null) => {
    if (queryState.isLoading || queryState.isFetching) {
        return renderLoadingState();
    }

    if (queryState.isError) {
        const message = queryState.error instanceof Error ? queryState.error.message : null;
        return renderErrorState(assetId, message);
    }

    return null;
};

type ConnectedAssetLinkProps = {
    label: string;
    isVisible: boolean;
    onToggleVisibility: () => void;
    onNavigate: () => void;
};

type CopyStatus = 'idle' | 'copied' | 'failed';

const useCopyAssetId = (resolvedAssetId: string | null, assetId: string | null) => {
    const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');

    const handleCopyAssetId = useCallback(() => {
        if (!resolvedAssetId || !navigator.clipboard?.writeText) {
            setCopyStatus('failed');
            return;
        }

        navigator.clipboard
            .writeText(resolvedAssetId)
            .then(() => setCopyStatus('copied'))
            .catch(() => setCopyStatus('failed'));
    }, [resolvedAssetId]);

    useEffect(() => {
        if (copyStatus === 'idle') {
            return;
        }
        const timeoutId = globalThis.setTimeout(() => setCopyStatus('idle'), 1800);
        return () => globalThis.clearTimeout(timeoutId);
    }, [copyStatus]);

    useEffect(() => {
        setCopyStatus('idle');
    }, [assetId]);

    return { copyStatus, handleCopyAssetId };
};

const ConnectedAssetLink = ({ label, isVisible, onToggleVisibility, onNavigate }: ConnectedAssetLinkProps) => (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link
            component="button"
            variant="body2"
            onClick={onNavigate}
            sx={{
                'display': 'flex',
                'alignItems': 'center',
                'gap': 0.5,
                'color': 'primary.main',
                'textDecoration': 'none',
                'cursor': 'pointer',
                '&:hover': {
                    textDecoration: 'underline',
                },
                'border': 'none',
                'background': 'none',
                'padding': 0,
                'font': 'inherit',
            }}
        >
            <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                {label}
            </Typography>
            <ArrowForwardIcon sx={{ fontSize: '16px' }} />
        </Link>
        <IconButton size="small" color={isVisible ? 'primary' : 'default'} onClick={onToggleVisibility}>
            {isVisible ? <VisibilityIcon /> : <VisibilityOffIcon />}
        </IconButton>
    </Box>
);

const AssetDetailsPanel = ({ selectedElement, onBack, onClose, scenarioId, onConnectedAssetsVisibilityChange }: AssetDetailsPanelProps) => {
    const [view, setView] = useState<'scores' | 'connected'>('scores');
    const [dependentsVisible, setDependentsVisible] = useState(false);
    const [providersVisible, setProvidersVisible] = useState(false);

    const elemIsAsset = isAsset(selectedElement ?? undefined);
    const assetId = elemIsAsset ? (selectedElement as Asset)?.id : null;

    const assetDetails = useQuery({
        enabled: elemIsAsset && !!assetId,
        queryKey: ['asset-details', assetId || ''],
        queryFn: () => fetchAssetDetails(assetId || ''),
    });

    const assetScore = useQuery({
        enabled: elemIsAsset && !!assetId && !!scenarioId,
        queryKey: ['asset-score', scenarioId, assetId || ''],
        queryFn: () => fetchAssetScore(scenarioId!, assetId!),
        refetchOnMount: true,
    });

    const handleToggleDependentsVisibility = useCallback(() => {
        setDependentsVisible((prev) => !prev);
    }, []);

    const handleToggleProvidersVisibility = useCallback(() => {
        setProvidersVisible((prev) => !prev);
    }, []);

    const handleNavigateToDependents = useCallback(() => {
        setDependentsVisible(true);
        setView('connected');
    }, []);

    const filteredDependents = useMemo(() => assetDetails.data?.dependents?.map(transformConnectedAsset) || [], [assetDetails.data?.dependents]);
    const filteredProviders = useMemo(() => assetDetails.data?.providers?.map(transformConnectedAsset) || [], [assetDetails.data?.providers]);

    const resolvedAssetId = assetDetails.data?.externalId || selectedElement?.id || null;

    const { copyStatus, handleCopyAssetId } = useCopyAssetId(resolvedAssetId, assetId);

    useEffect(() => {
        setDependentsVisible(false);
        setProvidersVisible(false);
    }, [assetId]);

    useEffect(() => {
        if (assetDetails.data && onConnectedAssetsVisibilityChange) {
            const isVisible = dependentsVisible || providersVisible;
            onConnectedAssetsVisibilityChange(
                isVisible,
                dependentsVisible ? assetDetails.data.dependents || [] : [],
                providersVisible ? assetDetails.data.providers || [] : [],
            );
        }
    }, [dependentsVisible, providersVisible, assetDetails.data, onConnectedAssetsVisibilityChange]);

    if (!selectedElement) {
        return null;
    }

    const queryState = renderAssetDetailsQueryState(assetDetails, assetId);
    if (queryState) {
        return queryState;
    }

    const assetInfoData = assetDetails.data
        ? {
              name: assetDetails.data.name,
              assetType: assetDetails.data.type.name,
          }
        : undefined;

    const details = elemIsAsset && selectedElement ? formatAssetDetails(selectedElement, assetInfoData) : undefined;

    if (!details || isEmpty(details)) {
        return renderWarningState();
    }

    const assetElement = elemIsAsset ? selectedElement : null;
    const hasCoordinates = Boolean(assetElement?.lat && assetElement?.lng);
    const streetViewUrl =
        hasCoordinates && assetElement ? `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${assetElement.lat},${assetElement.lng}` : null;

    const renderHeader = () => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            {onBack && (
                <IconButton size="small" onClick={onBack} aria-label="Back to previous panel">
                    <ArrowBackIcon fontSize="small" />
                </IconButton>
            )}
            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                {details.title || 'Asset Details'}
            </Typography>
            {onClose && (
                <IconButton size="small" onClick={onClose} aria-label="Close panel">
                    <CloseIcon fontSize="small" />
                </IconButton>
            )}
        </Box>
    );

    const renderAssetInfo = () => {
        const assetTypeName = assetDetails.data?.type.name;
        return (
            <Box sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {assetTypeName && (
                        <Box
                            sx={{
                                display: 'inline-block',
                                px: 0.75,
                                py: 0.25,
                                borderRadius: '4px',
                                bgcolor: 'grey.200',
                            }}
                        >
                            <Typography
                                variant="caption"
                                sx={{
                                    textTransform: 'uppercase',
                                    color: 'text.primary',
                                    fontWeight: 500,
                                    fontSize: '0.7rem',
                                }}
                            >
                                {noCase(assetTypeName)}
                            </Typography>
                        </Box>
                    )}
                    {hasCoordinates && streetViewUrl && (
                        <Link href={streetViewUrl} target="_blank" rel="noopener noreferrer" sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
                            <StreetviewIcon sx={{ fontSize: '20px', color: 'primary.main' }} />
                        </Link>
                    )}
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                        Asset ID:
                    </Typography>
                    <Link
                        component="button"
                        variant="caption"
                        underline="hover"
                        onClick={handleCopyAssetId}
                        aria-label="Copy asset ID"
                        sx={{ fontFamily: 'monospace' }}
                    >
                        {resolvedAssetId || 'N/A'}
                    </Link>
                    {copyStatus === 'copied' && (
                        <Typography variant="caption" color="success.main">
                            Copied
                        </Typography>
                    )}
                    {copyStatus === 'failed' && (
                        <Typography variant="caption" color="error.main">
                            Copy failed
                        </Typography>
                    )}
                </Box>
            </Box>
        );
    };

    const renderScoresView = () => (
        <Box
            sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transform: view === 'scores' ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.3s ease-in-out',
                overflowY: 'auto',
            }}
        >
            {assetScore.data && <AssetScore score={assetScore.data} />}
            <Box sx={{ px: 2, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <ConnectedAssetLink
                        label="View dependent assets"
                        isVisible={dependentsVisible}
                        onToggleVisibility={handleToggleDependentsVisibility}
                        onNavigate={handleNavigateToDependents}
                    />
                    <ConnectedAssetLink
                        label="View provider assets"
                        isVisible={providersVisible}
                        onToggleVisibility={handleToggleProvidersVisibility}
                        onNavigate={() => setView('connected')}
                    />
                </Box>
            </Box>
        </Box>
    );

    const renderConnectedView = () => (
        <Box
            sx={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transform: view === 'connected' ? 'translateX(0)' : 'translateX(100%)',
                transition: 'transform 0.3s ease-in-out',
                overflowY: 'auto',
            }}
        >
            <Box sx={{ px: 2, py: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton size="small" onClick={() => setView('scores')} aria-label="Back to scores">
                        <ArrowBackIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        Connected Assets
                    </Typography>
                </Box>
            </Box>
            <ConnectedAssetsSection filteredDependents={filteredDependents} filteredProviders={filteredProviders} />
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative', overflow: 'hidden' }}>
            {renderHeader()}
            {renderAssetInfo()}

            <Box
                sx={{
                    flex: 1,
                    display: 'flex',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {renderScoresView()}
                {renderConnectedView()}
            </Box>
        </Box>
    );
};

export default AssetDetailsPanel;
