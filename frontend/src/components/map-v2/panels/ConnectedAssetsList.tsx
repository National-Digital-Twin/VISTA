import { capitalCase } from 'change-case';
import { List, ListItem, ListItemText, Typography, Alert, Divider, Box } from '@mui/material';
import { getURIFragment } from '@/utils';

export interface ConnectedAssetsListProps {
    readonly connectedAssets: {
        uri: string;
        error?: Error;
        name: string;
        assetType: string;
        dependentCriticalitySum: number;
        connectionStrength: number;
    }[];
}

const ConnectedAssetsList = ({ connectedAssets }: ConnectedAssetsListProps) => {
    return (
        <List>
            {connectedAssets.map((asset, index) => {
                const key = asset?.uri || asset?.error?.message || 'unknown';

                if (asset?.error) {
                    return (
                        <div key={key}>
                            <ListItem>
                                <Alert severity="error">{asset.error.message}</Alert>
                            </ListItem>
                            {index < connectedAssets.length - 1 && <Divider />}
                        </div>
                    );
                }

                const typeLabel = capitalCase(getURIFragment(asset.assetType));

                return (
                    <div key={key}>
                        <ListItem
                            sx={{
                                'border': 'none',
                                '&::before': {
                                    display: 'none',
                                },
                            }}
                        >
                            <ListItemText
                                primary={asset.name || asset.uri}
                                secondary={
                                    <Box sx={{ mt: 1 }}>
                                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                            {typeLabel}
                                        </Typography>
                                        <Box
                                            sx={{
                                                display: 'grid',
                                                gridTemplateColumns: '5fr 2fr',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                Criticality
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {asset.dependentCriticalitySum ?? 'N/D'}
                                            </Typography>
                                            <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                Connection Strength
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                {asset.connectionStrength ?? 'N/D'}
                                            </Typography>
                                        </Box>
                                    </Box>
                                }
                            />
                        </ListItem>
                    </div>
                );
            })}
        </List>
    );
};

export default ConnectedAssetsList;
