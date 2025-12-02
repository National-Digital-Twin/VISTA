import { capitalCase } from 'change-case';
import { List, ListItem, ListItemText, Typography, Alert, Divider } from '@mui/material';
import { getURIFragment } from '@/utils';

export interface ConnectedAssetsListProps {
    readonly connectedAssets: {
        id: string;
        error?: Error;
        name: string;
        assetType: string;
    }[];
}

const ConnectedAssetsList = ({ connectedAssets }: ConnectedAssetsListProps) => {
    return (
        <List>
            {connectedAssets.map((asset, index) => {
                const key = asset?.id || asset?.error?.message || 'unknown';

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

                const isNewAssetType = asset.assetType && !asset.assetType.includes('#') && !asset.assetType.startsWith('http');
                const typeLabel = isNewAssetType ? capitalCase(asset.assetType) : capitalCase(getURIFragment(asset.assetType));

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
                                primary={asset.name || asset.id}
                                secondary={
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                        {typeLabel}
                                    </Typography>
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
