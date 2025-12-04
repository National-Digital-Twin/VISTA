import { useState } from 'react';
import type { SyntheticEvent, ReactNode } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import ConnectedAssetsList from './ConnectedAssetsList';

type ConnectedAssetsSectionProps = {
    readonly filteredDependents: Array<{
        id: string;
        name: string;
        assetType: string;
    }>;
    readonly filteredProviders: Array<{
        id: string;
        name: string;
        assetType: string;
    }>;
};

function a11yProps(index: number) {
    return {
        'id': `simple-tab-${index}`,
        'aria-controls': `simple-tabpanel-${index}`,
    };
}

type TabPanelProps = {
    readonly children?: ReactNode;
    readonly index: number;
    readonly value: number;
    readonly containerPadding?: number;
};

function TabPanel({ children, value, index, containerPadding, ...other }: TabPanelProps) {
    return (
        <Box
            sx={{
                maxHeight: '100%',
                height: '100%',
                width: '100%',
            }}
            role="tabpanel"
            hidden={value !== index}
            id={`simple-tabpanel-${index}`}
            aria-labelledby={`simple-tab-${index}`}
            {...other}
        >
            {value === index && (
                <Box
                    sx={{
                        maxHeight: '100%',
                        overflowY: 'auto',
                    }}
                    padding={containerPadding ?? 3}
                >
                    {children}
                </Box>
            )}
        </Box>
    );
}

const ConnectedAssetsSection = ({ filteredDependents, filteredProviders }: ConnectedAssetsSectionProps) => {
    const [tabValue, setTabValue] = useState(0);
    const totalDependents = filteredDependents.length;
    const totalProviders = filteredProviders.length;

    const handleTabChange = (_event: SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const renderDependentsContent = () => {
        if (totalDependents === 0) {
            return (
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        No dependent assets found.
                    </Typography>
                </Box>
            );
        }
        return <ConnectedAssetsList connectedAssets={filteredDependents} />;
    };

    const renderProvidersContent = () => {
        if (totalProviders === 0) {
            return (
                <Box sx={{ p: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        No provider assets found.
                    </Typography>
                </Box>
            );
        }
        return <ConnectedAssetsList connectedAssets={filteredProviders} />;
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
                        {renderDependentsContent()}
                    </TabPanel>

                    <TabPanel value={tabValue} index={1} containerPadding={0}>
                        {renderProvidersContent()}
                    </TabPanel>
                </Box>
            </Box>
        </Box>
    );
};

export default ConnectedAssetsSection;
