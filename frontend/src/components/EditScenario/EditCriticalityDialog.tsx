import { useCallback, useRef, useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Typography } from '@mui/material';
import { MAX_CRITICALITY_SCORE } from '@/api/dataroom-assets';
import { pluralize } from '@/utils';

type EditCriticalityDialogProps = {
    open: boolean;
    count: number;
    onClose: () => void;
    onConfirm: (score: number) => void;
};

export default function EditCriticalityDialog({ open, count, onClose, onConfirm }: Readonly<EditCriticalityDialogProps>) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleEntered = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const handleClose = useCallback(() => {
        setValue('');
        onClose();
    }, [onClose]);

    const parsed = Number(value);
    const hasError = value !== '' && (!Number.isInteger(parsed) || parsed < 0 || parsed > MAX_CRITICALITY_SCORE);

    const handleConfirm = () => {
        if (value !== '' && !hasError) {
            setValue('');
            onConfirm(parsed);
        }
    };

    const label = `Edit ${count} ${pluralize('item', count)}`;
    const description = `You are changing the criticality score for ${count} ${pluralize('item', count)}`;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth slotProps={{ transition: { onEntered: handleEntered } }}>
            <DialogTitle>{label}</DialogTitle>
            <DialogContent>
                <Typography variant="body1" sx={{ mb: 2 }}>
                    {description}
                </Typography>
                <TextField
                    label="Criticality score"
                    type="number"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            handleConfirm();
                        }
                    }}
                    fullWidth
                    error={hasError}
                    helperText={hasError ? `Enter a value between 0 and ${MAX_CRITICALITY_SCORE}` : ''}
                    slotProps={{ htmlInput: { min: 0, max: MAX_CRITICALITY_SCORE, ref: inputRef } }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose} variant="outlined">
                    CANCEL
                </Button>
                <Button onClick={handleConfirm} variant="contained" disabled={value === '' || hasError}>
                    CONFIRM
                </Button>
            </DialogActions>
        </Dialog>
    );
}
