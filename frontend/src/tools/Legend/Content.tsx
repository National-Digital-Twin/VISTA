import React from 'react';
import { Box, Card, CardContent, Typography, List, ListItem } from '@mui/material';

const LegendContent: React.FC = () => {
    return (
        <Card sx={{ border: 0, boxShadow: 0 }}>
            <CardContent sx={{ border: 0, padding: 0, boxShadow: 0 }}>
                {/* Title */}
                <Typography variant="h5" sx={{ marginBottom: '0.7em', marginTop: '0.7em' }}>
                    Legend
                </Typography>

                {/* Subtitle */}
                <Typography variant="body2" fontWeight="bold">
                    Road Criticality
                </Typography>

                {/* Legend Items */}
                <List dense sx={{ paddingTop: 0 }}>
                    <ListItem sx={{ paddingLeft: 0 }}>
                        <Box
                            sx={{
                                width: '3em',
                                height: '0.5em',
                                backgroundColor: '#35C035',
                                marginRight: '0.5em',
                            }}
                        />
                        <Typography variant="body2">Low</Typography>
                    </ListItem>

                    <ListItem sx={{ paddingLeft: 0 }}>
                        <Box
                            sx={{
                                width: '3em',
                                height: '0.5em',
                                backgroundColor: '#FFB60A',
                                marginRight: '0.5em',
                            }}
                        />
                        <Typography variant="body2">Medium</Typography>
                    </ListItem>

                    <ListItem sx={{ paddingLeft: 0 }}>
                        <Box
                            sx={{
                                width: '3em',
                                height: '0.5em',
                                backgroundColor: '#FB3737',
                                marginRight: '0.5em',
                            }}
                        />
                        <Typography variant="body2">High</Typography>
                    </ListItem>
                </List>
            </CardContent>
        </Card>
    );
};

export default LegendContent;
