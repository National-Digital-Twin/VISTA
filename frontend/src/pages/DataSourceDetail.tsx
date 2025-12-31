import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { DataRoomOutletContext } from '@/components/DataRoom';
import { DataSource, fetchDataSource } from '@/api/datasources';

const MarkdownRenderer = ({ content }: { content: string }) => {
    return <ReactMarkdown>{content}</ReactMarkdown>;
};

export default function DataSourceDetail() {
    const { id } = useParams<{ id: string }>();
    const { getFormattedLastUpdated } = useOutletContext<DataRoomOutletContext>();
    const { data } = useQuery<DataSource, Error>({
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

    const navigate = useNavigate();

    return (
        <Box>
            {data ? (
                <Box>
                    <Box sx={{ px: 2, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconButton size="small" onClick={() => navigate('/data-room')} aria-label="Back to previous panel">
                                <ArrowBackIcon fontSize="small" />
                            </IconButton>
                            <Typography variant="h6" fontWeight={600} sx={{ flex: 1 }}>
                                {data.name}
                            </Typography>
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                            {data.owner} - {getFormattedLastUpdated(data.lastUpdated)}
                        </Typography>
                    </Box>
                    <Box>
                        <MarkdownRenderer content={data.description} />
                    </Box>
                </Box>
            ) : (
                <Typography>Loading data sources...</Typography>
            )}
        </Box>
    );
}
