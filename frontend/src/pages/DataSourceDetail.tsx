import { useEffect, useMemo, useState } from 'react';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import {
    Box,
    IconButton,
    Typography,
    RadioGroup,
    FormControlLabel,
    Radio,
    TextField,
    Checkbox,
    Button,
    Divider,
    Snackbar,
    Alert,
    Collapse,
} from '@mui/material';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { fetchAllGroups, type Group } from '@/api/groups';
import { DataRoomOutletContext } from '@/components/DataRoom';
import { DataSource, fetchDataSource, grantDataSourceGroupAccess, revokeDataSourceGroupAccess } from '@/api/datasources';
import { useUserData } from '@/hooks/useUserData';

const MarkdownRenderer = ({ content }: { content: string }) => {
    return <ReactMarkdown>{content}</ReactMarkdown>;
};

export default function DataSourceDetail() {
    const { id } = useParams<{ id: string }>();
    const { getFormattedLastUpdated } = useOutletContext<DataRoomOutletContext>();
    const { isAdmin } = useUserData();
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const { data, isLoading } = useQuery<DataSource, Error>({
        enabled: !!id,
        queryKey: ['data-source', id],
        queryFn: ({ queryKey }) => {
            const [, dataSourceId] = queryKey as ['data-source', string];
            return fetchDataSource(dataSourceId);
        },
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        retry: 2,
        retryDelay: 1000,
    });
    const { data: groups = [] } = useQuery<Group[], Error>({
        queryKey: ['groups'],
        queryFn: fetchAllGroups,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });
    const [availability, setAvailability] = useState<'yes' | 'no'>('yes');
    const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    useEffect(() => {
        if (!data) {
            return;
        }
        const currentGroupIds = new Set((data.groupsWithAccess ?? []).map((group) => group.id));
        setAvailability((data.globallyAvailable ?? true) ? 'yes' : 'no');
        setSelectedGroupIds(currentGroupIds);
    }, [data]);

    useEffect(() => {
        if (availability === 'yes') {
            setExpandedGroups(new Set());
        }
    }, [availability]);

    const filteredGroups = useMemo(() => {
        if (!searchTerm) {
            return groups;
        }
        const lower = searchTerm.toLowerCase();
        return groups.filter((group) => group.name.toLowerCase().includes(lower));
    }, [groups, searchTerm]);

    const currentGroupIds = useMemo(() => new Set(data?.groupsWithAccess?.map((group) => group.id) ?? []), [data]);
    const isDirty = useMemo(() => {
        if (!data) {
            return false;
        }
        const currentAvailability = (data.globallyAvailable ?? true) ? 'yes' : 'no';
        if (currentAvailability !== availability) {
            return true;
        }
        if (availability === 'yes') {
            return false;
        }
        if (currentGroupIds.size !== selectedGroupIds.size) {
            return true;
        }
        for (const idToCheck of currentGroupIds) {
            if (!selectedGroupIds.has(idToCheck)) {
                return true;
            }
        }
        return false;
    }, [availability, currentGroupIds, data, selectedGroupIds]);

    const isValid = availability === 'yes' || selectedGroupIds.size > 0;

    const handleToggleGroup = (groupId: string) => {
        setSelectedGroupIds((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const allGroupsSelected = groups.length > 0 && groups.every((group) => selectedGroupIds.has(group.id));
    const handleToggleAllGroups = () => {
        setSelectedGroupIds(() => {
            if (allGroupsSelected) {
                return new Set();
            }
            return new Set(groups.map((group) => group.id));
        });
    };

    const handleCancel = () => {
        if (!data) {
            return;
        }
        setAvailability((data.globallyAvailable ?? true) ? 'yes' : 'no');
        setSelectedGroupIds(new Set((data.groupsWithAccess ?? []).map((group) => group.id)));
        setSearchTerm('');
    };

    const handleToggleGroupExpand = (groupId: string) => {
        setExpandedGroups((prev) => {
            const next = new Set(prev);
            if (next.has(groupId)) {
                next.delete(groupId);
            } else {
                next.add(groupId);
            }
            return next;
        });
    };

    const handleSave = async () => {
        if (!id || !data || !isDirty) {
            return;
        }

        if (!isAdmin) {
            setErrorMessage('You do not have permission to change Group Access.');
            return;
        }

        setIsSaving(true);
        setErrorMessage(null);

        try {
            const existingGroupIds = new Set((data.groupsWithAccess ?? []).map((group) => group.id));

            if (availability === 'yes') {
                await Promise.all(Array.from(existingGroupIds).map((groupId) => revokeDataSourceGroupAccess(id, groupId)));
            } else {
                const groupsToAdd = Array.from(selectedGroupIds).filter((groupId) => !existingGroupIds.has(groupId));
                const groupsToRemove = Array.from(existingGroupIds).filter((groupId) => !selectedGroupIds.has(groupId));
                await Promise.all(groupsToAdd.map((groupId) => grantDataSourceGroupAccess(id, groupId)));
                await Promise.all(groupsToRemove.map((groupId) => revokeDataSourceGroupAccess(id, groupId)));
            }

            await queryClient.invalidateQueries({ queryKey: ['data-source', id] });
            await queryClient.invalidateQueries({ queryKey: ['data-sources'] });
            setSuccessMessage('Data source access updated successfully');
        } catch {
            setErrorMessage('Failed to save data source access. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Box>
            {isLoading && <Typography>Loading data sources...</Typography>}
            {data && (
                <Box>
                    <Box sx={{ px: 2, py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <IconButton size="small" onClick={() => navigate('/data-room')} aria-label="Back to data sources">
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="h6" fontWeight={600}>
                                {data.name}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {data.owner} - {getFormattedLastUpdated(data.lastUpdated)}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            display: 'grid',
                            gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' },
                            gap: { xs: 0, lg: 0 },
                            borderTop: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Box sx={{ pr: { xs: 2, lg: 3 }, pl: 0, py: 3 }}>
                            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                                Should this data be available to all?
                            </Typography>
                            <RadioGroup value={availability} onChange={(event) => setAvailability(event.target.value as 'yes' | 'no')} sx={{ mb: 3 }}>
                                <FormControlLabel value="yes" control={<Radio />} label="Yes" />
                                <FormControlLabel value="no" control={<Radio />} label="No" />
                            </RadioGroup>

                            <Box
                                sx={{
                                    position: 'relative',
                                    opacity: availability === 'yes' ? 0.4 : 1,
                                    pointerEvents: availability === 'yes' ? 'none' : 'auto',
                                    transition: 'opacity 0.2s',
                                }}
                            >
                                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
                                    Assign access to groups
                                </Typography>
                                <TextField
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Search for group"
                                    fullWidth
                                    size="small"
                                    disabled={availability === 'yes'}
                                    sx={{ mb: 2, maxWidth: 360 }}
                                    InputProps={{
                                        endAdornment: <SearchIcon fontSize="small" color="action" />,
                                    }}
                                />

                                <Box sx={{ borderTop: '1px solid', borderColor: 'divider' }}>
                                    <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', py: 1 }}>
                                        <Checkbox checked={allGroupsSelected} onChange={handleToggleAllGroups} disabled={availability === 'yes'} />
                                        <Typography variant="body2" fontWeight={500}>
                                            Groups
                                        </Typography>
                                        <Box />
                                    </Box>
                                    <Divider />
                                    {filteredGroups.map((group) => {
                                        const isExpanded = expandedGroups.has(group.id);
                                        return (
                                            <Box key={group.id}>
                                                <Box sx={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center', py: 1 }}>
                                                    <Checkbox
                                                        checked={selectedGroupIds.has(group.id)}
                                                        onChange={() => handleToggleGroup(group.id)}
                                                        disabled={availability === 'yes'}
                                                    />
                                                    <Typography variant="body2">
                                                        {group.name} ({group.members.length} members)
                                                    </Typography>
                                                    <Box
                                                        component="button"
                                                        onClick={() => handleToggleGroupExpand(group.id)}
                                                        disabled={availability === 'yes'}
                                                        sx={{
                                                            'display': 'flex',
                                                            'alignItems': 'center',
                                                            'gap': 0.5,
                                                            'border': 'none',
                                                            'background': 'none',
                                                            'cursor': availability === 'yes' ? 'default' : 'pointer',
                                                            'color': 'primary.main',
                                                            'textDecoration': 'none',
                                                            '&:hover': { textDecoration: availability === 'yes' ? 'none' : 'underline' },
                                                            'padding': 0,
                                                            'font': 'inherit',
                                                        }}
                                                    >
                                                        <Typography variant="body2" component="span">
                                                            view group
                                                        </Typography>
                                                        <KeyboardArrowDownIcon
                                                            fontSize="small"
                                                            sx={{
                                                                transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                                                                transition: 'transform 0.2s',
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Collapse in={isExpanded}>
                                                    <Box sx={{ px: 2, pb: 2 }}>
                                                        {group.members.length > 0 ? (
                                                            <Box>
                                                                {group.members.map((member) => (
                                                                    <Typography key={member.userId} variant="body2" sx={{ py: 0.5 }}>
                                                                        {member.name ?? '—'}
                                                                    </Typography>
                                                                ))}
                                                            </Box>
                                                        ) : (
                                                            <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                                                No members in this group
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Collapse>
                                                <Divider />
                                            </Box>
                                        );
                                    })}
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                                <Button variant="outlined" onClick={handleCancel} disabled={isSaving}>
                                    CANCEL
                                </Button>
                                <Button variant="contained" onClick={handleSave} disabled={isSaving || !isDirty || !isValid}>
                                    SAVE
                                </Button>
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                pl: { xs: 2, lg: 3 },
                                pr: 0,
                                py: 3,
                                borderLeft: { xs: 'none', lg: '1px solid' },
                                borderTop: { xs: '1px solid', lg: 'none' },
                                borderColor: { lg: 'divider' },
                            }}
                        >
                            <MarkdownRenderer content={data.description} />
                        </Box>
                    </Box>
                </Box>
            )}

            <Snackbar
                open={!!successMessage}
                autoHideDuration={4000}
                onClose={() => setSuccessMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSuccessMessage(null)}>
                    {successMessage}
                </Alert>
            </Snackbar>
            <Snackbar
                open={!!errorMessage}
                autoHideDuration={5000}
                onClose={() => setErrorMessage(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setErrorMessage(null)}>
                    {errorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
