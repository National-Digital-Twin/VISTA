import type React from 'react';
import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Paper,
    Typography,
    CircularProgress,
    Box,
    Button,
    Stack,
} from '@mui/material';
import { format } from 'date-fns';
import { fetchResourceInterventionActions } from '@/api/resources';

const DEFAULT_ROWS_PER_PAGE = 10;
const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];

interface ResourceUsageLogProps {
    open: boolean;
    onClose: () => void;
    scenarioId?: string;
    typeId?: string;
    typeName?: string;
}

export const ResourceUsageLog = ({ open, onClose, scenarioId, typeId, typeName }: ResourceUsageLogProps) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_ROWS_PER_PAGE);
    const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);

    const { data, isLoading } = useQuery({
        queryKey: ['resourceActions', scenarioId, typeId, cursors[page], rowsPerPage],
        queryFn: () =>
            fetchResourceInterventionActions(scenarioId!, {
                cursor: cursors[page],
                limit: rowsPerPage,
                typeId,
            }),
        enabled: open && !!scenarioId,
    });

    const handleChangePage = useCallback(
        (_event: unknown, newPage: number) => {
            if (newPage > page && data?.nextCursor) {
                setCursors((prev) => {
                    const next = [...prev];
                    next[newPage] = data.nextCursor!;
                    return next;
                });
            }
            setPage(newPage);
        },
        [page, data?.nextCursor],
    );

    const handleChangeRowsPerPage = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setRowsPerPage(Number.parseInt(event.target.value, 10));
        setPage(0);
        setCursors([undefined]);
    }, []);

    const handleClose = useCallback(() => {
        setPage(0);
        setCursors([undefined]);
        onClose();
    }, [onClose]);

    // TODO: Implement CSV/PDF export
    const handleExportCsv = () => {};

    const actions = data?.results ?? [];
    const totalCount = data?.totalCount ?? 0;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">{typeName ? `${typeName} Inventory Logs` : 'Inventory Logs'}</Typography>
                    <Stack direction="row" spacing={1}>
                        <Button variant="outlined" size="small" onClick={handleExportCsv}>
                            Export CSV
                        </Button>
                    </Stack>
                </Stack>
            </DialogTitle>
            <DialogContent>
                {isLoading && (
                    <Box display="flex" justifyContent="center" p={4}>
                        <CircularProgress />
                    </Box>
                )}
                {!isLoading && actions.length > 0 && (
                    <>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Time</TableCell>
                                        <TableCell>Location</TableCell>
                                        {!typeId && <TableCell>Resource Type</TableCell>}
                                        <TableCell>Action</TableCell>
                                        <TableCell align="right">Quantity</TableCell>
                                        <TableCell>User</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {actions.map((action) => (
                                        <TableRow key={action.id}>
                                            <TableCell>
                                                <Typography variant="body2" noWrap>
                                                    {format(new Date(action.createdAt), 'dd-MM-yyyy HH:mm:ss')}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{action.locationName}</TableCell>
                                            {!typeId && <TableCell>{action.resourceType}</TableCell>}
                                            <TableCell>{action.actionType === 'withdraw' ? 'Withdraw' : 'Restock'}</TableCell>
                                            <TableCell align="right">{action.quantity}</TableCell>
                                            <TableCell>{action.user.name ?? action.user.id}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={totalCount}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                        />
                    </>
                )}
                {!isLoading && actions.length === 0 && (
                    <Box p={4} textAlign="center">
                        <Typography color="text.secondary">No resource actions yet</Typography>
                    </Box>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ResourceUsageLog;
