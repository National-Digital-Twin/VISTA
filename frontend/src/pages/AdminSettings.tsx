import { Box, Tab, Tabs, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageContainer from '@/components/PageContainer';
import AccessRequestsTab from '@/components/AdminSettings/AccessRequestsTab';
import GroupsTab from '@/components/AdminSettings/GroupsTab';
import InvitesTab from '@/components/AdminSettings/InvitesTab';
import UsersTab from '@/components/AdminSettings/UsersTab';

interface TabPanelProps {
    readonly children?: React.ReactNode;
    readonly index: number;
    readonly value: number;
}

function TabPanel({ children, value, index, ...other }: TabPanelProps) {
    return (
        <div role="tabpanel" hidden={value !== index} id={`admin-tabpanel-${index}`} aria-labelledby={`admin-tab-${index}`} {...other}>
            {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
        </div>
    );
}

const AdminSettings: React.FC = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState(0);

    const tabNames = ['users', 'invites', 'groups', 'access-requests'];

    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            const tabIndex = tabNames.indexOf(tabParam);
            if (tabIndex !== -1) {
                setActiveTab(tabIndex);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchParams]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setActiveTab(newValue);
        setSearchParams({ tab: tabNames[newValue] });
    };

    return (
        <PageContainer>
            <Typography variant="h3" component="h1" gutterBottom>
                Admin settings
            </Typography>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    aria-label="admin settings tabs"
                    sx={{
                        '& .MuiTab-root': {
                            'textTransform': 'capitalize',
                            'fontWeight': 'bold',
                            'minHeight': 48,
                            '&.Mui-selected': {
                                backgroundColor: 'neutral.main',
                                borderRadius: '8px 8px 0 0',
                                color: 'primary.main',
                            },
                        },
                    }}
                >
                    <Tab label="Users" id="admin-tab-0" aria-controls="admin-tabpanel-0" />
                    <Tab label="Invites" id="admin-tab-1" aria-controls="admin-tabpanel-1" />
                    <Tab label="Groups" id="admin-tab-2" aria-controls="admin-tabpanel-2" />
                    <Tab
                        label={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                Access requests
                                <Box
                                    sx={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        backgroundColor: 'error.main',
                                    }}
                                />
                            </Box>
                        }
                        id="admin-tab-3"
                        aria-controls="admin-tabpanel-3"
                    />
                </Tabs>
            </Box>

            <TabPanel value={activeTab} index={0}>
                <UsersTab />
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
                <InvitesTab />
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
                <GroupsTab />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
                <AccessRequestsTab />
            </TabPanel>
        </PageContainer>
    );
};

export default AdminSettings;
