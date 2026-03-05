// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import {
    Box,
    Typography,
    LinearProgress,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Tab,
    Tabs,
    CircularProgress,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useRef } from 'react';
import useResourceMutations from '../hooks/useResourceMutations';
import { fetchResourceInterventionLocation } from '@/api/resources';
import type { ResourceLocation } from '@/api/resources';
import { percentage } from '@/utils';
import { getStockColor } from '@/utils/stockLevels';

const TAB = { WITHDRAW: 0, RESTOCK: 1 } as const;

type StockValidation = {
    withdrawError: string;
    restockError: string;
    canSubmitWithdraw: boolean;
    canSubmitRestock: boolean;
    qty: number;
};

const getValidationError = (quantity: string, isValidNumber: boolean, boundsCheck: () => string | null): string => {
    if (!quantity) {
        return '';
    }
    if (!isValidNumber) {
        return 'Please enter a valid positive number';
    }
    return boundsCheck() ?? '';
};

const validateStockAction = (quantity: string, location: ResourceLocation | undefined): StockValidation => {
    const qty = quantity ? Number.parseInt(quantity, 10) : Number.NaN;
    const isValidNumber = !Number.isNaN(qty) && qty > 0;

    const withdrawError = getValidationError(quantity, isValidNumber, () =>
        location && qty > location.currentStock ? `Insufficient stock. Available: ${location.currentStock}` : null,
    );

    const restockError = getValidationError(quantity, isValidNumber, () =>
        location && location.currentStock + qty > location.maxCapacity
            ? `Exceeds capacity. Available space: ${location.maxCapacity - location.currentStock}`
            : null,
    );

    return {
        withdrawError,
        restockError,
        canSubmitWithdraw: isValidNumber && !withdrawError && !!location && location.currentStock > 0,
        canSubmitRestock: isValidNumber && !restockError && !!location && location.currentStock < location.maxCapacity,
        qty,
    };
};

const getFieldConfig = (isWithdraw: boolean, location: ResourceLocation, validation: StockValidation) => {
    if (isWithdraw) {
        if (location.currentStock === 0) {
            return { disabled: true, error: false, helperText: 'No stock available', max: 0 };
        }
        return {
            disabled: false,
            error: !!validation.withdrawError,
            helperText: validation.withdrawError || `Available: ${location.currentStock}`,
            max: location.currentStock,
        };
    }

    const availableSpace = location.maxCapacity - location.currentStock;
    if (availableSpace === 0) {
        return { disabled: true, error: false, helperText: 'At max capacity', max: 0 };
    }
    return {
        disabled: false,
        error: !!validation.restockError,
        helperText: validation.restockError || `Available space: ${availableSpace}`,
        max: availableSpace,
    };
};

interface StockActionDialogProps {
    open: boolean;
    onClose: () => void;
    scenarioId?: string;
    locationId: string | null;
    withdrawStock: ReturnType<typeof useResourceMutations>['withdrawStock'];
    restockLocation: ReturnType<typeof useResourceMutations>['restockLocation'];
    isMutating: boolean;
    onSuccess: (message: string) => void;
}

export const StockActionDialog = ({ open, onClose, scenarioId, locationId, withdrawStock, restockLocation, isMutating, onSuccess }: StockActionDialogProps) => {
    const [actionTab, setActionTab] = useState<number>(TAB.WITHDRAW);
    const [quantity, setQuantity] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const { data: location, isLoading } = useQuery({
        queryKey: ['resourceInterventionLocation', scenarioId, locationId],
        queryFn: () => fetchResourceInterventionLocation(scenarioId!, locationId!),
        enabled: open && !!scenarioId && !!locationId,
    });

    useEffect(() => {
        if (location) {
            setActionTab(location.currentStock === 0 ? TAB.RESTOCK : TAB.WITHDRAW);
        }
    }, [location]);

    const focusInput = () => {
        inputRef.current?.focus();
    };

    const handleClose = () => {
        setQuantity('');
        setActionTab(TAB.WITHDRAW);
        onClose();
    };

    if (!open) {
        return null;
    }

    if (isLoading) {
        return (
            <Dialog open onClose={handleClose} maxWidth="sm" fullWidth>
                <Box display="flex" justifyContent="center" p={4}>
                    <CircularProgress />
                </Box>
            </Dialog>
        );
    }

    if (!location) {
        return null;
    }

    const isWithdrawTab = actionTab === TAB.WITHDRAW;
    const validation = validateStockAction(quantity, location);
    const fieldConfig = getFieldConfig(isWithdrawTab, location, validation);
    const canSubmit = isWithdrawTab ? validation.canSubmitWithdraw : validation.canSubmitRestock;
    const submitLabel = isWithdrawTab ? 'Withdraw' : 'Restock';

    const handleSubmit = () => {
        if (!canSubmit || !locationId) {
            return;
        }

        const onMutationSuccess = () => {
            onSuccess(isWithdrawTab ? 'Stock withdrawn successfully' : 'Location restocked successfully');
            handleClose();
        };

        if (isWithdrawTab) {
            withdrawStock({ locationId, quantity: validation.qty }, { onSuccess: onMutationSuccess });
        } else {
            restockLocation({ locationId, quantity: validation.qty }, { onSuccess: onMutationSuccess });
        }
    };

    return (
        <Dialog open onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ transition: { onEntered: focusInput } }}>
            <DialogTitle>{location.name}</DialogTitle>
            <DialogContent>
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Current Stock: {location.currentStock} / {location.maxCapacity}
                    </Typography>
                    <LinearProgress
                        variant="determinate"
                        value={percentage(location.currentStock, location.maxCapacity)}
                        sx={{
                            'mt': 1,
                            'height': 8,
                            'borderRadius': 4,
                            '& .MuiLinearProgress-bar': { backgroundColor: getStockColor(location.currentStock, location.maxCapacity) },
                        }}
                    />
                </Box>

                <Tabs
                    value={actionTab}
                    onChange={(_, newValue) => {
                        setActionTab(newValue);
                        setQuantity('');
                        focusInput();
                    }}
                >
                    <Tab label="Withdraw" />
                    <Tab label="Restock" />
                </Tabs>

                <Box sx={{ p: 3 }}>
                    <TextField
                        label="Quantity"
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        onKeyDown={(e) => {
                            if ('.,-eE+'.includes(e.key)) {
                                e.preventDefault();
                            } else if (e.key === 'Enter') {
                                handleSubmit();
                            }
                        }}
                        fullWidth
                        disabled={fieldConfig.disabled || isMutating}
                        error={fieldConfig.error}
                        helperText={fieldConfig.helperText}
                        slotProps={{
                            htmlInput: { min: 1, max: fieldConfig.max, step: 1, ref: inputRef },
                        }}
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={isMutating}>
                    Cancel
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isMutating || !canSubmit}>
                    {isMutating ? <CircularProgress size={24} /> : submitLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default StockActionDialog;
