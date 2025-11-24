import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Box, Tabs, Tab, Typography, CircularProgress, Alert } from '@mui/material';
import ConnectedAssetsList from './ConnectedAssetsList';
import { a11yProps, TabPanel } from '@/utils/tabHelpers';

interface ConnectedAssetsSectionProps {
    readonly filteredDependents: Array<{
        uri: string;
        error?: Error;
        name: string;
        assetType: string;
        dependentCriticalitySum: number;
        connectionStrength: number;
    }>;
    readonly filteredProviders: Array<{
        uri: string;
        error?: Error;
        name: string;
        assetType: string;
        dependentCriticalitySum: number;
        connectionStrength: number;
    }>;
    readonly isDependentsLoading: boolean;
    readonly isDependentsError: boolean;
    readonly dependentsError: Error | null;
    readonly isProvidersLoading: boolean;
    readonly isProvidersError: boolean;
    readonly providersError: Error | null;
}

const ConnectedAssetsSection = ({
    filteredDependents,
    filteredProviders,
    isDependentsLoading,
    isDependentsError,
    dependentsError,
    isProvidersLoading,
    isProvidersError,
    providersError,
}: ConnectedAssetsSectionProps) => {
    const [tabValue, setTabValue] = useState(0);
    const totalDependents = filteredDependents.length;
    const totalProviders = filteredProviders.length;

    const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    return (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <Box sx={{ px: 2, py: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                    Connected Assets
                </Typography>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                <Tabs value={tabValue} onChange={handleTabChange} aria-label="connected asset tabs" variant="fullWidth" sx={{ px: 2 }}>
                    <Tab label={`Dependent Assets (${totalDependents})`} {...a11yProps(0)} />
                    <Tab label={`Provider Assets (${totalProviders})`} {...a11yProps(1)} />
                </Tabs>

                <Box sx={{ flex: 1, overflowY: 'auto' }}>
                    <TabPanel value={tabValue} index={0} containerPadding={0}>
                        {isDependentsLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : isDependentsError ? (
                            <Box sx={{ p: 2 }}>
                                <Alert severity="error">{dependentsError?.message || 'Error loading dependent assets'}</Alert>
                            </Box>
                        ) : totalDependents === 0 ? (
                            <Box sx={{ p: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No dependent assets found.
                                </Typography>
                            </Box>
                        ) : (
                            <ConnectedAssetsList connectedAssets={filteredDependents} />
                        )}
                    </TabPanel>

                    <TabPanel value={tabValue} index={1} containerPadding={0}>
                        {isProvidersLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                                <CircularProgress size={24} />
                            </Box>
                        ) : isProvidersError ? (
                            <Box sx={{ p: 2 }}>
                                <Alert severity="error">{providersError?.message || 'Error loading provider assets'}</Alert>
                            </Box>
                        ) : totalProviders === 0 ? (
                            <Box sx={{ p: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    No provider assets found.
                                </Typography>
                            </Box>
                        ) : (
                            <ConnectedAssetsList connectedAssets={filteredProviders} />
                        )}
                    </TabPanel>
                </Box>
            </Box>
        </Box>
    );
};

export default ConnectedAssetsSection;
