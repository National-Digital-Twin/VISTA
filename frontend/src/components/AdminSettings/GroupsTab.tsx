import React, { useMemo, useState, useEffect, type ChangeEvent, type KeyboardEvent, type MouseEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Box,
    Typography,
    CircularProgress,
    Alert,
    Checkbox,
    Button,
    FormControlLabel,
    InputAdornment,
    Link,
    IconButton,
    Menu,
    Divider,
    Snackbar,
    TextField,
    Radio,
    RadioGroup,
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import CloseIcon from '@mui/icons-material/Close';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    addGroupMember,
    createGroup as createGroupApi,
    deleteGroup as deleteGroupApi,
    fetchAllGroups,
    removeGroupMember,
    updateGroup as updateGroupApi,
    type Group,
} from '@/api/groups';
import DeleteDialog from '@/components/DeleteDialog';
import { GroupMembersTable } from '@/components/AdminSettings/GroupMembersTable';
import { SearchTextField } from '@/components/SearchTextField';
import { fetchAllUsers, type UserData } from '@/api/users';

type User = {
    id: string;
    name: string;
    email: string;
    organisation: string;
    userSince: string;
    userType: 'General' | 'Admin';
};

type UserSortField = 'name' | 'organisation' | 'userType' | 'memberSince';
type SortDirection = 'asc' | 'desc';

const mapUserDataToUser = (userData: UserData): User => {
    const organisation = getUserOrganisation(userData);
    return {
        id: userData.id || '',
        name: userData.name || userData.displayName || '',
        email: userData.email || '',
        organisation,
        userSince: userData.userSince || userData.memberSince || '',
        userType: userData.userType === 'Admin' || userData.userType === 'General' ? userData.userType : 'General',
    };
};

const getUserOrganisation = (userData: UserData): string => {
    if (userData?.organisation) {
        return userData.organisation.replace('@', '');
    }

    if (userData?.email) {
        const domain = userData.email.split('@')[1];
        return domain || '';
    }

    return '';
};

const userMatchesSearch = (user: User, searchLower: string): boolean =>
    user.name.toLowerCase().includes(searchLower) ||
    user.email.toLowerCase().includes(searchLower) ||
    user.organisation.toLowerCase().includes(searchLower) ||
    user.userType.toLowerCase().includes(searchLower);

const getFieldValue = (user: User & { memberSince?: string }, field: UserSortField): string => {
    switch (field) {
        case 'name':
            return user.name;
        case 'organisation':
            return user.organisation;
        case 'userType':
            return user.userType;
        case 'memberSince':
            return user.memberSince || '';
        default:
            return '';
    }
};

const compareUsers =
    (field: UserSortField, direction: SortDirection) =>
    (a: User & { memberSince?: string }, b: User & { memberSince?: string }): number => {
        const aValue = getFieldValue(a, field);
        const bValue = getFieldValue(b, field);
        const comparison = aValue.localeCompare(bValue);
        return direction === 'asc' ? comparison : -comparison;
    };

const formatGroupCreated = (group: Group): string => {
    const dateStr = group.created_at
        ? new Date(group.created_at).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
          })
        : null;
    const by = group.created_by ?? 'Unknown';
    return dateStr ? `Created: ${dateStr} by ${by}` : `Created by ${by}`;
};

const getCurrentMemberIds = (group: Group | null, _users: User[], adminUserIds: Set<string>): Set<string> => {
    if (!group) {
        return new Set(adminUserIds);
    }
    const memberIds = new Set(group.members.map((m) => m.userId));
    return new Set([...memberIds, ...adminUserIds]);
};

const getEmptyMessage = (hasActiveFilters: boolean, isSearchOnlyNoResults: boolean, fallbackMessage: string): string => {
    if (!hasActiveFilters) {
        return fallbackMessage;
    }
    if (isSearchOnlyNoResults) {
        return 'No results found. Try adjusting your search';
    }
    return 'No results found. Try adjusting your filters';
};

const getRadioGroupValue = (currentField: UserSortField, targetField: UserSortField, currentDirection: SortDirection): string => {
    if (currentField !== targetField) {
        return '';
    }
    return currentDirection;
};

// eslint-disable-next-line sonarjs/cognitive-complexity
const GroupsTab: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const queryClient = useQueryClient();
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [isEditMode, setIsEditMode] = useState(false);
    const [selectedOrganisations, setSelectedOrganisations] = useState<Set<string>>(new Set());
    const [userSortField, setUserSortField] = useState<UserSortField>('name');
    const [userSortDirection, setUserSortDirection] = useState<SortDirection>('asc');
    const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
    const [hasChanges, setHasChanges] = useState(false);
    const [organisationMenuAnchor, setOrganisationMenuAnchor] = useState<null | HTMLElement>(null);
    const [nameMenuAnchor, setNameMenuAnchor] = useState<null | HTMLElement>(null);
    const [userTypeMenuAnchor, setUserTypeMenuAnchor] = useState<null | HTMLElement>(null);
    const [memberSinceMenuAnchor, setMemberSinceMenuAnchor] = useState<null | HTMLElement>(null);
    const [selectedUserTypes, setSelectedUserTypes] = useState<Set<string>>(new Set());
    const [isEditingGroupName, setIsEditingGroupName] = useState(false);
    const [editGroupName, setEditGroupName] = useState('');
    const [groupNameError, setGroupNameError] = useState<string | null>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteSuccessSnackbarOpen, setDeleteSuccessSnackbarOpen] = useState(false);
    const [deletedGroupName, setDeletedGroupName] = useState<string | null>(null);
    const [deleteErrorSnackbarOpen, setDeleteErrorSnackbarOpen] = useState(false);
    const [deleteErrorMessage, setDeleteErrorMessage] = useState<string | null>(null);
    const [saveSuccessSnackbarOpen, setSaveSuccessSnackbarOpen] = useState(false);
    const [saveErrorSnackbarOpen, setSaveErrorSnackbarOpen] = useState(false);
    const [saveErrorMessage, setSaveErrorMessage] = useState<string | null>(null);
    const [isCreatingNewGroup, setIsCreatingNewGroup] = useState(false);
    const [newGroupName, setNewGroupName] = useState('');
    const [createSelectedUserIds, setCreateSelectedUserIds] = useState<Set<string>>(new Set());
    const [createSuccessSnackbarOpen, setCreateSuccessSnackbarOpen] = useState(false);
    const [createErrorSnackbarOpen, setCreateErrorSnackbarOpen] = useState(false);
    const [createErrorMessage, setCreateErrorMessage] = useState<string | null>(null);

    const {
        data: groups = [],
        isLoading: groupsLoading,
        isError: groupsError,
        error: groupsErrorObj,
    } = useQuery<Group[], Error>({
        queryKey: ['groups'],
        queryFn: fetchAllGroups,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const { data: usersData = [], isLoading: usersLoading } = useQuery<UserData[], Error>({
        queryKey: ['users'],
        queryFn: fetchAllUsers,
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    });

    const deleteGroupMutation = useMutation({
        mutationFn: ({ groupId }: { groupId: string; groupName: string }) => deleteGroupApi(groupId),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(() => {});
            setSelectedGroupId(null);
            setIsEditMode(false);
            setDeleteDialogOpen(false);
            setDeleteConfirmText('');
            setDeletedGroupName(variables.groupName);
            setDeleteSuccessSnackbarOpen(true);
        },
        onError: (error: Error) => {
            setDeleteErrorMessage(error.message);
            setDeleteErrorSnackbarOpen(true);
        },
    });

    const updateGroupNameMutation = useMutation({
        mutationFn: ({ groupId, name }: { groupId: string; name: string }) => updateGroupApi(groupId, { name }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(() => {});
            setGroupNameError(null);
        },
        onError: (error: Error) => {
            setGroupNameError(error.message);
        },
    });

    const createGroupMutation = useMutation({
        mutationFn: ({ name, memberIds }: { name: string; memberIds: string[] }) => createGroupApi(name.trim(), memberIds),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(() => {});
            setSelectedGroupId(data.id);
            setIsCreatingNewGroup(false);
            setNewGroupName('');
            setUserSearchTerm('');
            setSelectedOrganisations(new Set());
            setSelectedUserTypes(new Set());
            setUserSortField('name');
            setUserSortDirection('asc');
            setCreateSuccessSnackbarOpen(true);
        },
        onError: (error: Error) => {
            setCreateErrorMessage(error.message);
            setCreateErrorSnackbarOpen(true);
        },
    });

    const saveMembersMutation = useMutation({
        mutationFn: async ({ groupId, toAdd, toRemove }: { groupId: string; toAdd: string[]; toRemove: string[] }) => {
            await Promise.all([...toAdd.map((userId) => addGroupMember(groupId, userId)), ...toRemove.map((userId) => removeGroupMember(groupId, userId))]);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups'] }).catch(() => {});
            setHasChanges(false);
            setIsEditMode(false);
            setSaveSuccessSnackbarOpen(true);
        },
        onError: (error: Error) => {
            setSaveErrorMessage(error.message);
            setSaveErrorSnackbarOpen(true);
        },
    });

    const users = useMemo(() => usersData.map(mapUserDataToUser), [usersData]);

    const selectedGroup = useMemo(() => groups.find((g) => g.id === selectedGroupId) || null, [groups, selectedGroupId]);

    const groupParam = searchParams.get('group');
    useEffect(() => {
        if (groupParam && groups.some((g) => g.id === groupParam)) {
            setSelectedGroupId(groupParam);
        }
    }, [groupParam, groups]);

    const adminUserIds = useMemo(() => {
        return new Set(users.filter((u) => u.userType === 'Admin').map((u) => u.id));
    }, [users]);

    useEffect(() => {
        setSelectedUserIds(getCurrentMemberIds(selectedGroup, users, adminUserIds));
        setHasChanges(false);
    }, [selectedGroup, users, adminUserIds]);

    useEffect(() => {
        if (isCreatingNewGroup) {
            setCreateSelectedUserIds(new Set(adminUserIds));
        }
    }, [isCreatingNewGroup, adminUserIds]);

    const availableOrganisations = useMemo(() => {
        const orgs = new Set<string>();
        const list = !isEditMode && selectedGroup ? users.filter((u) => selectedUserIds.has(u.id)) : users;
        list.forEach((user) => {
            if (user.organisation) {
                orgs.add(user.organisation);
            }
        });
        return Array.from(orgs).sort((a, b) => a.localeCompare(b));
    }, [users, isEditMode, selectedGroup, selectedUserIds]);

    const filteredUsers = useMemo(() => {
        let filtered = users;

        if (userSearchTerm) {
            const searchLower = userSearchTerm.toLowerCase();
            filtered = filtered.filter((u) => userMatchesSearch(u, searchLower));
        }

        if (selectedOrganisations.size > 0) {
            filtered = filtered.filter((u) => selectedOrganisations.has(u.organisation));
        }

        if (selectedUserTypes.size > 0) {
            filtered = filtered.filter((u) => selectedUserTypes.has(u.userType));
        }

        if (!isEditMode && selectedGroup && !isCreatingNewGroup) {
            filtered = filtered.filter((u) => selectedUserIds.has(u.id));
        }

        return filtered;
    }, [users, userSearchTerm, selectedOrganisations, selectedUserTypes, isEditMode, selectedGroup, selectedUserIds, isCreatingNewGroup]);

    const effectiveSelectedIds = isCreatingNewGroup ? createSelectedUserIds : selectedUserIds;

    const sortMembersFirst = isCreatingNewGroup || (isEditMode && !!selectedGroup);
    const filteredAndSortedUsers = useMemo(() => {
        const compare = compareUsers(userSortField, userSortDirection);
        if (sortMembersFirst) {
            return [...filteredUsers].sort((a, b) => {
                const aSelected = effectiveSelectedIds.has(a.id) ? 1 : 0;
                const bSelected = effectiveSelectedIds.has(b.id) ? 1 : 0;
                if (aSelected !== bSelected) {
                    return bSelected - aSelected;
                }
                return compare(a, b);
            });
        }
        return [...filteredUsers].sort(compare);
    }, [filteredUsers, userSortField, userSortDirection, sortMembersFirst, effectiveSelectedIds]);

    const hasCreateChanges = isCreatingNewGroup && (newGroupName.trim() !== '' || createSelectedUserIds.size > adminUserIds.size);

    const handleGroupSelect = (groupId: string) => {
        if (hasChanges && !globalThis.confirm('You have unsaved changes. Are you sure you want to switch groups?')) {
            return;
        }
        if (hasCreateChanges && !globalThis.confirm('You have unsaved changes to the new group. Are you sure you want to leave?')) {
            return;
        }
        setSelectedGroupId(groupId);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('group', groupId);
            return next;
        });
        setUserSearchTerm('');
        setIsEditMode(false);
        setIsCreatingNewGroup(false);
        setNewGroupName('');
        setSelectedOrganisations(new Set());
        setSelectedUserTypes(new Set());
    };

    const handleUserCheckboxChange = (userId: string, checked: boolean) => {
        if (adminUserIds.has(userId)) {
            return;
        }
        if (isCreatingNewGroup) {
            const newSelected = new Set(createSelectedUserIds);
            if (checked) {
                newSelected.add(userId);
            } else {
                newSelected.delete(userId);
            }
            setCreateSelectedUserIds(newSelected);
            return;
        }
        const newSelected = new Set(selectedUserIds);
        if (checked) {
            newSelected.add(userId);
        } else {
            newSelected.delete(userId);
        }
        setSelectedUserIds(newSelected);
        setHasChanges(true);
    };

    const handleOrganisationFilter = (org: string) => {
        const newSelected = new Set(selectedOrganisations);
        if (newSelected.has(org)) {
            newSelected.delete(org);
        } else {
            newSelected.add(org);
        }
        setSelectedOrganisations(newSelected);
    };

    const hasActiveFilters = useMemo(() => {
        return (
            userSearchTerm.trim() !== '' ||
            selectedOrganisations.size > 0 ||
            selectedUserTypes.size > 0 ||
            userSortField !== 'name' ||
            userSortDirection !== 'asc'
        );
    }, [userSearchTerm, selectedOrganisations, selectedUserTypes, userSortField, userSortDirection]);

    const isSearchOnlyNoResults = useMemo(() => {
        return (
            userSearchTerm.trim() !== '' &&
            selectedOrganisations.size === 0 &&
            selectedUserTypes.size === 0 &&
            userSortField === 'name' &&
            userSortDirection === 'asc'
        );
    }, [userSearchTerm, selectedOrganisations, selectedUserTypes, userSortField, userSortDirection]);

    const handleClearFilters = () => {
        setUserSearchTerm('');
        setSelectedOrganisations(new Set());
        setSelectedUserTypes(new Set());
        setUserSortField('name');
        setUserSortDirection('asc');
    };

    const handleUserTypeFilter = (userType: string) => {
        const newSelected = new Set(selectedUserTypes);
        if (newSelected.has(userType)) {
            newSelected.delete(userType);
        } else {
            newSelected.add(userType);
        }
        setSelectedUserTypes(newSelected);
    };

    const handleSave = () => {
        if (!selectedGroup) {
            return;
        }
        const currentMemberIds = getCurrentMemberIds(selectedGroup, users, adminUserIds);
        const toAdd = [...selectedUserIds].filter((id) => !currentMemberIds.has(id) && !adminUserIds.has(id));
        const toRemove = [...currentMemberIds].filter((id) => !selectedUserIds.has(id) && !adminUserIds.has(id));
        saveMembersMutation.mutate({
            groupId: selectedGroup.id,
            toAdd,
            toRemove,
        });
    };

    const handleCancel = () => {
        setSelectedUserIds(getCurrentMemberIds(selectedGroup, users, adminUserIds));
        setHasChanges(false);
        setIsEditMode(false);
    };

    const handleEditMembers = () => {
        setIsEditMode(true);
    };

    const handleDeleteGroupClick = () => {
        if (!selectedGroup) {
            return;
        }
        setDeleteConfirmText('');
        setDeleteDialogOpen(true);
    };

    const handleCloseDeleteDialog = () => {
        setDeleteDialogOpen(false);
        setDeleteConfirmText('');
    };

    const handleConfirmDeleteGroup = () => {
        if (!selectedGroup || deleteConfirmText.trim().toLowerCase() !== 'delete') {
            return;
        }
        deleteGroupMutation.mutate({ groupId: selectedGroup.id, groupName: selectedGroup.name });
    };

    const handleCreateNewGroup = () => {
        if (hasChanges && !globalThis.confirm('You have unsaved changes. Are you sure you want to switch?')) {
            return;
        }
        setSelectedGroupId(null);
        setNewGroupName('');
        setUserSearchTerm('');
        setSelectedOrganisations(new Set());
        setSelectedUserTypes(new Set());
        setUserSortField('name');
        setUserSortDirection('asc');
        setIsCreatingNewGroup(true);
    };

    const handleCancelCreate = () => {
        setIsCreatingNewGroup(false);
        setNewGroupName('');
        setCreateSelectedUserIds(new Set());
        setUserSearchTerm('');
        setSelectedOrganisations(new Set());
        setSelectedUserTypes(new Set());
        setUserSortField('name');
        setUserSortDirection('asc');
    };

    const handleUserClick = (userId: string) => {
        navigate(`/user/${userId}`);
    };

    const handleEditGroupNameClick = (e: MouseEvent) => {
        e.stopPropagation();
        if (selectedGroup) {
            setEditGroupName(selectedGroup.name);
            setGroupNameError(null);
            setIsEditingGroupName(true);
        }
    };

    const handleGroupNameBlur = () => {
        if (!selectedGroup) {
            return;
        }
        const trimmedName = editGroupName.trim();
        if (!trimmedName) {
            setGroupNameError('Name cannot be empty');
            return;
        }
        setGroupNameError(null);
        setIsEditingGroupName(false);
        if (trimmedName !== selectedGroup.name) {
            updateGroupNameMutation.mutate({ groupId: selectedGroup.id, name: trimmedName });
        }
    };

    const handleGroupNameKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleGroupNameBlur();
        } else if (e.key === 'Escape') {
            setIsEditingGroupName(false);
            if (selectedGroup) {
                setEditGroupName(selectedGroup.name);
            }
            setGroupNameError(null);
        }
    };

    const handleGroupNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setEditGroupName(e.target.value);
        if (groupNameError) {
            setGroupNameError(null);
        }
    };

    useEffect(() => {
        if (selectedGroup && !isEditingGroupName) {
            setEditGroupName(selectedGroup.name);
        }
    }, [selectedGroup, isEditingGroupName]);

    const allVisibleUsersSelected = useMemo(() => {
        if (filteredAndSortedUsers.length === 0) {
            return false;
        }
        const ids = isCreatingNewGroup ? createSelectedUserIds : selectedUserIds;
        return filteredAndSortedUsers.every((user) => ids.has(user.id) || adminUserIds.has(user.id));
    }, [filteredAndSortedUsers, selectedUserIds, createSelectedUserIds, adminUserIds, isCreatingNewGroup]);

    const someVisibleUsersSelected = useMemo(() => {
        if (filteredAndSortedUsers.length === 0) {
            return false;
        }
        const ids = isCreatingNewGroup ? createSelectedUserIds : selectedUserIds;
        const selectedCount = filteredAndSortedUsers.filter((user) => ids.has(user.id) || adminUserIds.has(user.id)).length;
        const nonAdminCount = filteredAndSortedUsers.filter((user) => !adminUserIds.has(user.id)).length;
        return selectedCount > 0 && selectedCount < filteredAndSortedUsers.length && nonAdminCount > 0;
    }, [filteredAndSortedUsers, selectedUserIds, createSelectedUserIds, adminUserIds, isCreatingNewGroup]);

    const handleSelectAll = (checked: boolean) => {
        if (isCreatingNewGroup) {
            const newSelected = new Set(createSelectedUserIds);
            if (checked) {
                filteredAndSortedUsers.forEach((user) => newSelected.add(user.id));
            } else {
                filteredAndSortedUsers.forEach((user) => {
                    if (!adminUserIds.has(user.id)) {
                        newSelected.delete(user.id);
                    }
                });
            }
            setCreateSelectedUserIds(newSelected);
            return;
        }
        const newSelected = new Set(selectedUserIds);
        if (checked) {
            filteredAndSortedUsers.forEach((user) => {
                newSelected.add(user.id);
            });
        } else {
            filteredAndSortedUsers.forEach((user) => {
                if (!adminUserIds.has(user.id)) {
                    newSelected.delete(user.id);
                }
            });
        }
        setSelectedUserIds(newSelected);
        setHasChanges(true);
    };

    if (groupsLoading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (groupsError) {
        return (
            <Alert severity="error" sx={{ mb: 2 }}>
                {groupsErrorObj?.message || 'Failed to load groups'}
            </Alert>
        );
    }

    return (
        <Box sx={{ display: 'flex', gap: 3, height: '100%', minHeight: 0 }}>
            <Box sx={{ width: '300px', flexShrink: 0, borderRight: '1px solid', borderColor: 'divider', px: 2 }}>
                <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
                    Current groups
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    {groups.map((group) => (
                        <React.Fragment key={group.id}>
                            <Box
                                onClick={() => handleGroupSelect(group.id)}
                                sx={{
                                    'display': 'flex',
                                    'alignItems': 'center',
                                    'justifyContent': 'space-between',
                                    'p': 1.5,
                                    'cursor': 'pointer',
                                    'borderRadius': 1,
                                    'backgroundColor': selectedGroupId === group.id ? 'chip.main' : 'transparent',
                                    '&:hover': {
                                        backgroundColor: selectedGroupId === group.id ? 'chip.main' : 'action.hover',
                                    },
                                }}
                            >
                                <Typography variant="body1">
                                    {group.name} ({group.members.length})
                                </Typography>
                                <ArrowRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                            </Box>
                            <Divider />
                        </React.Fragment>
                    ))}
                </Box>
                <Button
                    onClick={handleCreateNewGroup}
                    startIcon={<AddCircleOutlineIcon />}
                    color="primary"
                    variant="text"
                    fullWidth
                    sx={{
                        'mt': 2,
                        'justifyContent': 'flex-start',
                        'textTransform': 'none',
                        'fontWeight': 400,
                        'fontSize': '1rem',
                        'py': 1,
                        'px': 2,
                        '&:hover': {
                            backgroundColor: isCreatingNewGroup ? 'chip.main' : 'action.hover',
                        },
                        ...(isCreatingNewGroup && { backgroundColor: 'chip.main', color: 'text.primary' }),
                    }}
                >
                    Create new group
                </Button>
            </Box>

            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0 }}>
                {isCreatingNewGroup && (
                    <>
                        <Typography variant="h6" component="h3" sx={{ mb: 2, fontWeight: 500 }}>
                            Create new group
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexShrink: 0 }}>
                            <Typography
                                variant="body2"
                                color="text.secondary"
                                component="label"
                                htmlFor="new-group-name-input"
                                sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
                            >
                                New group name:
                            </Typography>
                            <Box sx={{ flex: 1, maxWidth: 300 }}>
                                <TextField
                                    id="new-group-name-input"
                                    variant="standard"
                                    value={newGroupName}
                                    onChange={(e) => setNewGroupName(e.target.value)}
                                    placeholder="Enter group name"
                                    size="small"
                                    fullWidth
                                    sx={{
                                        '& .MuiInput-root': {
                                            backgroundColor: 'neutral.main',
                                            borderRadius: 1,
                                            px: 1,
                                            py: 0.5,
                                        },
                                    }}
                                    slotProps={{
                                        htmlInput: { 'aria-label': 'New group name' },
                                        input: {
                                            endAdornment: newGroupName ? (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={() => setNewGroupName('')} aria-label="Clear group name">
                                                        <CloseIcon fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null,
                                        },
                                    }}
                                />
                            </Box>
                        </Box>
                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'auto max-content',
                                gap: 3,
                                mb: 2,
                                alignItems: 'center',
                                justifyItems: 'start',
                                flexShrink: 0,
                            }}
                        >
                            <SearchTextField placeholder="Search for user" value={userSearchTerm} onChange={setUserSearchTerm} />
                            <Button variant="outlined" size="small" onClick={handleClearFilters} disabled={!hasActiveFilters}>
                                CLEAR FILTERS
                            </Button>
                        </Box>
                        {usersLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <GroupMembersTable
                                users={filteredAndSortedUsers}
                                showCheckboxColumn
                                selectedUserIds={effectiveSelectedIds}
                                adminUserIds={adminUserIds}
                                onUserCheckboxChange={handleUserCheckboxChange}
                                onSelectAll={handleSelectAll}
                                allVisibleUsersSelected={allVisibleUsersSelected}
                                someVisibleUsersSelected={someVisibleUsersSelected}
                                onUserClick={handleUserClick}
                                showMemberSinceColumn={false}
                                emptyMessage={getEmptyMessage(hasActiveFilters, isSearchOnlyNoResults, 'No users available')}
                                onNameMenuOpen={(e) => setNameMenuAnchor(e.currentTarget)}
                                onOrganisationMenuOpen={(e) => setOrganisationMenuAnchor(e.currentTarget)}
                                onUserTypeMenuOpen={(e) => setUserTypeMenuAnchor(e.currentTarget)}
                            />
                        )}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 'auto', pt: 2, flexShrink: 0 }}>
                            <Button variant="outlined" onClick={handleCancelCreate}>
                                CANCEL
                            </Button>
                            <Button
                                variant="contained"
                                onClick={() =>
                                    createGroupMutation.mutate({
                                        name: newGroupName.trim(),
                                        memberIds: Array.from(createSelectedUserIds),
                                    })
                                }
                                disabled={!newGroupName.trim() || createGroupMutation.isPending}
                            >
                                SAVE
                            </Button>
                        </Box>
                    </>
                )}
                {!isCreatingNewGroup && selectedGroup && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexShrink: 0 }}>
                            <Box sx={{ flex: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                    {isEditingGroupName ? (
                                        <TextField
                                            value={editGroupName}
                                            onChange={handleGroupNameChange}
                                            onBlur={handleGroupNameBlur}
                                            onKeyDown={handleGroupNameKeyDown}
                                            size="small"
                                            autoFocus
                                            error={!!groupNameError}
                                            helperText={groupNameError}
                                            sx={{
                                                'flex': 1,
                                                '& .MuiInputBase-input': {
                                                    fontWeight: 500,
                                                    py: 0.6,
                                                },
                                            }}
                                        />
                                    ) : (
                                        <>
                                            <Typography variant="h6" component="h3" sx={{ fontWeight: 500 }}>
                                                {selectedGroup.name}
                                            </Typography>
                                            <IconButton size="small" onClick={handleEditGroupNameClick} aria-label="Edit group name">
                                                <EditIcon fontSize="small" />
                                            </IconButton>
                                        </>
                                    )}
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    {formatGroupCreated(selectedGroup)}
                                </Typography>
                                <Link component="button" variant="body2" color="primary" sx={{ textDecoration: 'none' }}>
                                    see data room access
                                </Link>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, ml: 2 }}>
                                <Button variant="contained" onClick={handleEditMembers}>
                                    EDIT MEMBERS
                                </Button>
                                <Button variant="contained" color="error" onClick={handleDeleteGroupClick}>
                                    DELETE GROUP
                                </Button>
                            </Box>
                        </Box>

                        <Box
                            sx={{
                                display: 'grid',
                                gridTemplateColumns: 'auto max-content',
                                gap: 3,
                                mb: 2,
                                alignItems: 'center',
                                justifyItems: 'start',
                                flexShrink: 0,
                            }}
                        >
                            <SearchTextField placeholder="Search for user" value={userSearchTerm} onChange={setUserSearchTerm} />
                            <Button variant="outlined" size="small" onClick={handleClearFilters} disabled={!hasActiveFilters}>
                                CLEAR FILTERS
                            </Button>
                        </Box>

                        {usersLoading ? (
                            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <GroupMembersTable
                                users={filteredAndSortedUsers}
                                showCheckboxColumn={isEditMode}
                                selectedUserIds={selectedUserIds}
                                adminUserIds={adminUserIds}
                                onUserCheckboxChange={handleUserCheckboxChange}
                                onSelectAll={handleSelectAll}
                                allVisibleUsersSelected={allVisibleUsersSelected}
                                someVisibleUsersSelected={someVisibleUsersSelected}
                                onUserClick={handleUserClick}
                                showMemberSinceColumn
                                emptyMessage={getEmptyMessage(
                                    hasActiveFilters,
                                    isSearchOnlyNoResults,
                                    isEditMode ? 'No users available' : 'No members in this group',
                                )}
                                onNameMenuOpen={(e) => setNameMenuAnchor(e.currentTarget)}
                                onOrganisationMenuOpen={(e) => setOrganisationMenuAnchor(e.currentTarget)}
                                onUserTypeMenuOpen={(e) => setUserTypeMenuAnchor(e.currentTarget)}
                                onMemberSinceMenuOpen={(e) => setMemberSinceMenuAnchor(e.currentTarget)}
                            />
                        )}

                        {isEditMode && (
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 'auto', pt: 2, flexShrink: 0 }}>
                                <Button variant="outlined" onClick={handleCancel}>
                                    CANCEL
                                </Button>
                                <Button variant="contained" onClick={handleSave} disabled={!hasChanges || saveMembersMutation.isPending}>
                                    SAVE
                                </Button>
                            </Box>
                        )}
                    </>
                )}
                {!isCreatingNewGroup && !selectedGroup && (
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start', height: '100%', color: 'text.secondary' }}>
                        <Typography variant="body1">Select a group to view and manage its members</Typography>
                    </Box>
                )}
            </Box>

            <Menu anchorEl={nameMenuAnchor} open={Boolean(nameMenuAnchor)} onClose={() => setNameMenuAnchor(null)}>
                <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Sort by
                        </Typography>
                        <IconButton size="small" onClick={() => setNameMenuAnchor(null)} aria-label="Close menu">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <RadioGroup
                        value={getRadioGroupValue(userSortField, 'name', userSortDirection)}
                        onChange={(e) => {
                            if (e.target.value === 'asc' || e.target.value === 'desc') {
                                setUserSortField('name');
                                setUserSortDirection(e.target.value as SortDirection);
                                setNameMenuAnchor(null);
                            }
                        }}
                    >
                        <FormControlLabel value="asc" control={<Radio size="small" />} label="A to Z" />
                        <FormControlLabel value="desc" control={<Radio size="small" />} label="Z to A" />
                    </RadioGroup>
                </Box>
            </Menu>

            <Menu anchorEl={organisationMenuAnchor} open={Boolean(organisationMenuAnchor)} onClose={() => setOrganisationMenuAnchor(null)}>
                <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Filter
                        </Typography>
                        <IconButton size="small" onClick={() => setOrganisationMenuAnchor(null)} aria-label="Close menu">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    {availableOrganisations.map((org) => (
                        <FormControlLabel
                            key={org}
                            control={<Checkbox checked={selectedOrganisations.has(org)} onChange={() => handleOrganisationFilter(org)} size="small" />}
                            label={`@${org}`}
                            sx={{ display: 'block', mb: 0.5 }}
                        />
                    ))}
                </Box>
            </Menu>

            <Menu anchorEl={userTypeMenuAnchor} open={Boolean(userTypeMenuAnchor)} onClose={() => setUserTypeMenuAnchor(null)}>
                <Box sx={{ px: 2, py: 1, minWidth: 180 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Filter
                        </Typography>
                        <IconButton size="small" onClick={() => setUserTypeMenuAnchor(null)} aria-label="Close menu">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <FormControlLabel
                        control={<Checkbox checked={selectedUserTypes.has('Admin')} onChange={() => handleUserTypeFilter('Admin')} size="small" />}
                        label="Admin"
                        sx={{ display: 'block', mb: 0.5 }}
                    />
                    <FormControlLabel
                        control={<Checkbox checked={selectedUserTypes.has('General')} onChange={() => handleUserTypeFilter('General')} size="small" />}
                        label="General"
                        sx={{ display: 'block', mb: 0.5 }}
                    />
                </Box>
            </Menu>

            <Menu anchorEl={memberSinceMenuAnchor} open={Boolean(memberSinceMenuAnchor)} onClose={() => setMemberSinceMenuAnchor(null)}>
                <Box sx={{ px: 2, py: 1, minWidth: 200 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Sort by
                        </Typography>
                        <IconButton size="small" onClick={() => setMemberSinceMenuAnchor(null)} aria-label="Close menu">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                    <RadioGroup
                        value={getRadioGroupValue(userSortField, 'memberSince', userSortDirection)}
                        onChange={(e) => {
                            if (e.target.value === 'asc' || e.target.value === 'desc') {
                                setUserSortField('memberSince');
                                setUserSortDirection(e.target.value as SortDirection);
                                setMemberSinceMenuAnchor(null);
                            }
                        }}
                    >
                        <FormControlLabel value="desc" control={<Radio size="small" />} label="Newest - oldest" />
                        <FormControlLabel value="asc" control={<Radio size="small" />} label="Oldest - newest" />
                    </RadioGroup>
                </Box>
            </Menu>

            <DeleteDialog
                open={deleteDialogOpen}
                onClose={handleCloseDeleteDialog}
                onConfirm={handleConfirmDeleteGroup}
                confirmText={deleteConfirmText}
                onConfirmTextChange={setDeleteConfirmText}
                isPending={deleteGroupMutation.isPending}
                description="Deleting this group may result in the group members losing access to some datasets."
            />

            <Snackbar
                open={deleteSuccessSnackbarOpen}
                autoHideDuration={5000}
                onClose={() => setDeleteSuccessSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setDeleteSuccessSnackbarOpen(false)} sx={{ width: '100%' }}>
                    <Typography component="span" fontWeight="bold" display="block">
                        Group deleted
                    </Typography>
                    <Typography component="span" variant="body2">
                        {deletedGroupName ?? ''} removed
                    </Typography>
                </Alert>
            </Snackbar>

            <Snackbar
                open={deleteErrorSnackbarOpen}
                autoHideDuration={6000}
                onClose={() => setDeleteErrorSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setDeleteErrorSnackbarOpen(false)} sx={{ width: '100%' }}>
                    {deleteErrorMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={saveSuccessSnackbarOpen}
                autoHideDuration={5000}
                onClose={() => setSaveSuccessSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setSaveSuccessSnackbarOpen(false)} sx={{ width: '100%' }}>
                    Group members updated
                </Alert>
            </Snackbar>

            <Snackbar
                open={saveErrorSnackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSaveErrorSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setSaveErrorSnackbarOpen(false)} sx={{ width: '100%' }}>
                    {saveErrorMessage}
                </Alert>
            </Snackbar>

            <Snackbar
                open={createSuccessSnackbarOpen}
                autoHideDuration={5000}
                onClose={() => setCreateSuccessSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="success" onClose={() => setCreateSuccessSnackbarOpen(false)} sx={{ width: '100%' }}>
                    Group created
                </Alert>
            </Snackbar>

            <Snackbar
                open={createErrorSnackbarOpen}
                autoHideDuration={6000}
                onClose={() => setCreateErrorSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert severity="error" onClose={() => setCreateErrorSnackbarOpen(false)} sx={{ width: '100%' }}>
                    {createErrorMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
};

export default GroupsTab;
