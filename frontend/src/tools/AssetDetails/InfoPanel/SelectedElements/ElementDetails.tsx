import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, Typography, CircularProgress, Alert, Box, IconButton, Tooltip, SvgIcon } from '@mui/material';
import { capitalCase } from 'change-case';
import ArrowRightAltIcon from '@mui/icons-material/ArrowRightAlt';
import { fetchAssetInfo } from '@/api/combined';
import { getURIFragment, isAsset, isDependency } from '@/utils';
import { isEmpty } from '@/utils/isEmpty';
import { AssetState } from '@/models/Asset';

export interface ElementDefaultsProps {
    readonly element: any;
    showConnectedAssets: () => void;
    setConnectedAssetData: (data: any) => void;
}

export default function ElementDetails({ element, setConnectedAssetData, showConnectedAssets }: Readonly<ElementDefaultsProps>) {
    const elemIsAsset = isAsset(element);
    const elemIsStatic = element.state === AssetState.Static;

    const assetInfo = useQuery({
        enabled: elemIsAsset && elemIsStatic,
        queryKey: ['asset-info', element?.uri || ''],
        queryFn: () => fetchAssetInfo(element?.uri || ''),
    });

    const isLoading = assetInfo.isLoading;
    const isError = assetInfo.isError;

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" mt={2}>
                <CircularProgress />
            </Box>
        );
    }

    if (isError && elemIsStatic) {
        return (
            <Alert severity="error" sx={{ mt: 2 }}>
                Error fetching details for {element?.uri || 'this asset'}
            </Alert>
        );
    }

    const data = assetInfo.data;

    const onClick = () => {
        if (elemIsAsset) {
            const details = element?.getDetails?.(data) ?? {};
            setConnectedAssetData(constructElementDetailsObject(element, details));
            showConnectedAssets();
        }
    };

    let details = undefined;
    if (elemIsAsset) {
        details = element?.getDetails?.(data) ?? {};
    }

    if (isEmpty(element) || !details) {
        return null;
    }

    // Extract type string after #
    const extractedType = details.type?.split('#').pop() || 'Unknown';

    return (
        <Card sx={{ padding: 0, margin: 0 }} elevation={0}>
            <CardContent sx={{ padding: 1, margin: 0 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ gap: '10px' }}>
                        {/* Left Column - Asset Title & Type (Left Aligned) */}
                        <Box sx={{ flex: '0 0 40%', maxWidth: 250 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                {details.title || 'Asset Details'}
                            </Typography>
                            <Typography variant="subtitle2">{details.id || 'Asset Details'}</Typography>
                        </Box>

                        {/* Right Column - View Connected Assets & Google Street View */}
                        <Box display="flex" flexDirection="column" alignItems="start" sx={{ paddingTop: '5px', flex: '0 1 50%' }}>
                            {/* View Connected Assets */}
                            <Box
                                display="flex"
                                alignItems="center"
                                sx={{
                                    cursor: 'pointer',
                                    mb: 1,
                                    whiteSpace: 'nowrap',
                                    flexWrap: 'nowrap',
                                }}
                                onClick={() => {
                                    onClick();
                                }}
                            >
                                <Typography variant="body2" sx={{ fontWeight: 500, textWrap: 'wrap' }}>
                                    View connected assets
                                </Typography>
                                <ArrowRightAltIcon fontSize="small" sx={{ ml: 1 }} />
                            </Box>

                            {/* Google Street View */}
                            <Box display="flex" alignItems="center">
                                <Typography variant="body2" sx={{ fontWeight: 500, mr: 1, textWrap: 'wrap' }}>
                                    Google Street View
                                </Typography>
                                {element?.lat && element?.lng ? (
                                    <Tooltip title="Open Google Street View">
                                        <IconButton
                                            component="a"
                                            href={`https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${element?.lat},${element?.lng}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <SvgIcon>
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    x="0px"
                                                    y="0px"
                                                    width="22"
                                                    height="22"
                                                    fill="#000000"
                                                    viewBox="0 0 48 48"
                                                >
                                                    <path
                                                        fill="#48b564"
                                                        d="M35.76,26.36h0.01c0,0-3.77,5.53-6.94,9.64c-2.74,3.55-3.54,6.59-3.77,8.06 C24.97,44.6,24.53,45,24,45s-0.97-0.4-1.06-0.94c-0.23-1.47-1.03-4.51-3.77-8.06c-0.42-0.55-0.85-1.12-1.28-1.7L28.24,22l8.33-9.88 C37.49,14.05,38,16.21,38,18.5C38,21.4,37.17,24.09,35.76,26.36z"
                                                    />
                                                    <path
                                                        fill="#fcc60e"
                                                        d="M28.24,22L17.89,34.3c-2.82-3.78-5.66-7.94-5.66-7.94h0.01c-0.3-0.48-0.57-0.97-0.8-1.48L19.76,15 c-0.79,0.95-1.26,2.17-1.26,3.5c0,3.04,2.46,5.5,5.5,5.5C25.71,24,27.24,23.22,28.24,22z"
                                                    />
                                                    <path
                                                        fill="#2c85eb"
                                                        d="M28.4,4.74l-8.57,10.18L13.27,9.2C15.83,6.02,19.69,4,24,4C25.54,4,27.02,4.26,28.4,4.74z"
                                                    />
                                                    <path
                                                        fill="#ed5748"
                                                        d="M19.83,14.92L19.76,15l-8.32,9.88C10.52,22.95,10,20.79,10,18.5c0-3.54,1.23-6.79,3.27-9.3 L19.83,14.92z"
                                                    />
                                                    <path
                                                        fill="#5695f6"
                                                        d="M28.24,22c0.79-0.95,1.26-2.17,1.26-3.5c0-3.04-2.46-5.5-5.5-5.5c-1.71,0-3.24,0.78-4.24,2L28.4,4.74 c3.59,1.22,6.53,3.91,8.17,7.38L28.24,22z"
                                                    />
                                                </svg>
                                            </SvgIcon>
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Typography variant="body2" color="textSecondary">
                                        Coordinates not available
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                    {/* Grey Box for Type */}
                    <Box
                        sx={{
                            marginTop: '4px',
                        }}
                    >
                        <Typography
                            variant="body2"
                            sx={{
                                backgroundColor: '#f0f0f0',
                                borderRadius: '4px',
                                padding: '0 5px 0 5px',
                                display: 'inline-block',
                            }}
                            fontWeight={500}
                        >
                            {capitalCase(extractedType)}
                        </Typography>
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function constructElementDetailsObject(element: any, details: any) {
    return {
        dependent: element?.dependent || {},
        assetUri: element?.uri || '',
        isAsset: isAsset(element),
        isDependency: isDependency(element),
        provider: element?.provider || {},
        title: details.title,
        id: details.id,
        type: getURIFragment(details.type || '#Unknown'),
    };
}
