import { ArrowBack, Edit } from '@mui/icons-material';
import { Box, Button, Divider, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';
import { useUserData } from '@/hooks/useUserData';

export default function Profile() {
    const { getUserDisplayName, getUserOrganisation, getUserMemberSince, getUserAddedBy, getUserType, getUserGroups, user, loading } = useUserData();

    const groups = getUserGroups();

    if (loading) {
        return (
            <Box
                sx={{
                    p: 3,
                    minHeight: '100%',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'background.default',
                    color: 'text.primary',
                }}
            >
                <Typography variant="h6">Loading user data...</Typography>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                p: 3,
                minHeight: '100%',
                width: '100%',
                display: 'block',
                position: 'relative',
                backgroundColor: 'background.default',
                color: 'text.primary',
            }}
        >
            <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gridTemplateRows: 'auto 1fr auto', columnGap: 2, rowGap: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <IconButton sx={{ p: 1 }}>
                        <ArrowBack />
                    </IconButton>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
                        {loading ? 'Loading...' : getUserDisplayName()}
                    </Typography>
                    <IconButton sx={{ p: 1 }}>
                        <Edit />
                    </IconButton>
                </Box>

                <Box sx={{ gridColumn: '2' }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(max-content, 240px) auto', gap: 2 }}>
                        <Typography fontWeight={'bold'}>Member since</Typography>
                        <Typography>{getUserMemberSince()}</Typography>
                        <Typography fontWeight={'bold'}>Added by</Typography>
                        <Typography>{getUserAddedBy()}</Typography>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ mb: 3 }}>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold' }}>
                            User details
                        </Typography>
                        <Box sx={{ display: 'grid', gridTemplateColumns: 'minmax(max-content, 240px) auto', gap: 2 }}>
                            <Typography fontWeight={'bold'}>User type</Typography>
                            <Typography>{getUserType()}</Typography>

                            <Typography fontWeight={'bold'}>Email address</Typography>
                            <Typography>{user?.email || 'joe.bloggs@twynwell.gov.uk'}</Typography>

                            <Typography fontWeight={'bold'}>Organisation</Typography>
                            <Typography>@{getUserOrganisation()}</Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Box>
                        <Typography variant="h6" sx={{ mb: 4, fontWeight: 'bold' }}>
                            Group membership
                        </Typography>
                        <TableContainer sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, auto)' }}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold', border: 'none', py: 1, px: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Groups</Box>
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: 'bold', border: 'none', py: 1, px: 0 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>Member since</Box>
                                        </TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {groups.map((group) => (
                                        <TableRow key={group.name} sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell sx={{ py: 1, px: 0 }}>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>{group.name}</Box>
                                            </TableCell>
                                            <TableCell sx={{ py: 1, px: 0 }}>{group.memberSince}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gridColumn: '2', gap: 2 }}>
                    <Button variant="outlined" disabled={true}>
                        CANCEL
                    </Button>
                    <Button variant="contained" disabled={true}>
                        SAVE CHANGES
                    </Button>
                </Box>
            </Box>
        </Box>
    );
}
