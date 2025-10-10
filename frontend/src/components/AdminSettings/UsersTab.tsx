import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
    Box,
    Typography,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableSortLabel,
    Link,
    Stack,
    InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

interface User {
    id: string;
    name: string;
    email: string;
    organisation: string;
    groups: string[];
    userSince: string;
    userType: 'General' | 'Admin';
}

interface UsersData {
    users: User[];
}

type SortField = 'name' | 'organisation' | 'userSince' | 'userType';
type SortDirection = 'asc' | 'desc';

const UsersTab: React.FC = () => {
    const navigate = useNavigate();
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField, setSortField] = useState<SortField>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const response = await fetch('/data/users.json');
                const data: UsersData = await response.json();
                setUsers(data.users);
            } catch (error) {
                console.error('Failed to fetch users:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const stats = useMemo(() => {
        const totalUsers = users.length;
        const administrators = users.filter((user) => user.userType === 'Admin');
        return { totalUsers, administrators };
    }, [users]);

    const filteredAndSortedUsers = useMemo(() => {
        const filtered = users.filter((user) => {
            const searchLower = searchTerm.toLowerCase();
            return (
                user.name.toLowerCase().includes(searchLower) ||
                user.email.toLowerCase().includes(searchLower) ||
                user.organisation.toLowerCase().includes(searchLower) ||
                user.userType.toLowerCase().includes(searchLower) ||
                user.groups.some((group) => group.toLowerCase().includes(searchLower))
            );
        });

        filtered.sort((a, b) => {
            let aValue: string;
            let bValue: string;

            switch (sortField) {
                case 'name':
                    aValue = a.name;
                    bValue = b.name;
                    break;
                case 'organisation':
                    aValue = a.organisation;
                    bValue = b.organisation;
                    break;
                case 'userSince':
                    aValue = a.userSince;
                    bValue = b.userSince;
                    break;
                case 'userType':
                    aValue = a.userType;
                    bValue = b.userType;
                    break;
            }

            if (sortDirection === 'asc') {
                return aValue.localeCompare(bValue);
            } else {
                return bValue.localeCompare(aValue);
            }
        });

        return filtered;
    }, [users, searchTerm, sortField, sortDirection]);

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const handleClearFilters = () => {
        setSearchTerm('');
    };

    const handleUserClick = (userId: string) => {
        navigate(`/user/${userId}`);
    };

    const handleGroupClick = (groupName: string) => {
        navigate(`/group/${encodeURIComponent(groupName)}`);
    };

    const formatDate = (dateString: string) => {
        return format(new Date(dateString), 'd MMM yyyy');
    };

    if (loading) {
        return <Typography>Loading users...</Typography>;
    }

    return (
        <Box>
            <Typography variant="h5" component="h2" gutterBottom>
                Manage users
            </Typography>

            <Box sx={{ mb: 3 }}>
                <Typography variant="body1" gutterBottom>
                    Total users: {stats.totalUsers}
                </Typography>
                <Typography variant="body1" gutterBottom>
                    Administrators:{' '}
                    {stats.administrators.map((admin) => (
                        <Link key={admin.id} component="button" color="primary" onClick={() => handleUserClick(admin.id)} sx={{ mr: 1, cursor: 'pointer' }}>
                            {admin.name}
                        </Link>
                    ))}
                </Typography>
            </Box>

            <Stack
                direction="row"
                spacing={2}
                sx={{
                    mb: 3,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                }}
            >
                <TextField
                    placeholder="Search for user"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{
                        'minWidth': 300,
                        '& .MuiOutlinedInput-root': {
                            'backgroundColor': 'neutral.main',
                            'borderRadius': '24px',
                            'paddingLeft': '8px',
                            'paddingRight': '8px',
                            '& fieldset': {
                                border: 'none',
                            },
                            '&:hover fieldset': {
                                border: 'none',
                            },
                            '&.Mui-focused fieldset': {
                                border: 'none',
                            },
                        },
                    }}
                    slotProps={{
                        input: {
                            endAdornment: (
                                <InputAdornment position="end" sx={{ paddingRight: '8px' }}>
                                    <SearchIcon />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
                <Button variant="outlined" onClick={handleClearFilters} disabled={!searchTerm}>
                    CLEAR FILTERS
                </Button>
            </Stack>

            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'name'}
                                    direction={sortField === 'name' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('name')}
                                >
                                    User
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'organisation'}
                                    direction={sortField === 'organisation' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('organisation')}
                                >
                                    Organisation
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>Group membership</TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'userSince'}
                                    direction={sortField === 'userSince' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('userSince')}
                                >
                                    User since
                                </TableSortLabel>
                            </TableCell>
                            <TableCell>
                                <TableSortLabel
                                    active={sortField === 'userType'}
                                    direction={sortField === 'userType' ? sortDirection : 'asc'}
                                    onClick={() => handleSort('userType')}
                                >
                                    User type
                                </TableSortLabel>
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredAndSortedUsers.map((user) => (
                            <TableRow key={user.id}>
                                <TableCell>
                                    <Link component="button" color="primary" onClick={() => handleUserClick(user.id)} sx={{ cursor: 'pointer' }}>
                                        {user.name}
                                    </Link>
                                </TableCell>
                                <TableCell>{user.organisation}</TableCell>
                                <TableCell>
                                    <Stack direction="column" spacing={0.5} sx={{ alignItems: 'flex-start' }}>
                                        {user.groups.map((group) => (
                                            <Link
                                                key={group}
                                                component="button"
                                                color="primary"
                                                onClick={() => handleGroupClick(group)}
                                                sx={{ cursor: 'pointer' }}
                                            >
                                                {group}
                                            </Link>
                                        ))}
                                    </Stack>
                                </TableCell>
                                <TableCell>{formatDate(user.userSince)}</TableCell>
                                <TableCell>{user.userType}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default UsersTab;
