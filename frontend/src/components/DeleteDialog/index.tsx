import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export const STANDARD_INPUT_SX = {
    'mt': 1,
    '& .MuiInput-root': {
        backgroundColor: '#f5f5f5',
        borderRadius: 1,
        px: 1,
        py: 0.5,
    },
} as const;

export type DeleteDialogProps = {
    readonly open: boolean;
    readonly onClose: () => void;
    readonly onConfirm: () => void;
    readonly confirmText: string;
    readonly onConfirmTextChange: (value: string) => void;
    readonly isPending?: boolean;
    readonly title?: string;
    readonly description?: React.ReactNode;
    readonly confirmInstruction?: string;
    readonly confirmWord?: string;
    readonly confirmButtonLabel?: string;
    readonly cancelButtonLabel?: string;
};

function DeleteDialog({
    open,
    onClose,
    onConfirm,
    confirmText,
    onConfirmTextChange,
    isPending = false,
    title = 'Are you sure?',
    description,
    confirmInstruction = 'Type delete to confirm',
    confirmWord = 'delete',
    confirmButtonLabel = 'CONFIRM DELETION',
    cancelButtonLabel = 'CANCEL',
}: DeleteDialogProps) {
    const canConfirm = confirmText.trim().toLowerCase() === confirmWord.toLowerCase();

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {title}
                <IconButton onClick={onClose} size="small" aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {description !== null && description !== undefined && (
                    <Typography variant="body1" component="div" sx={{ mb: 2 }}>
                        {description}
                    </Typography>
                )}
                <Typography variant="body2" sx={{ mb: 1 }}>
                    {confirmInstruction}
                </Typography>
                <TextField fullWidth variant="standard" value={confirmText} onChange={(e) => onConfirmTextChange(e.target.value)} sx={STANDARD_INPUT_SX} />
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0, mt: 2 }}>
                <Button onClick={onClose} variant="outlined" sx={{ flex: 1, mr: 1, height: 48, borderRadius: 1 }}>
                    {cancelButtonLabel}
                </Button>
                <Button onClick={onConfirm} variant="contained" color="error" disabled={!canConfirm || isPending} sx={{ flex: 2, height: 48, borderRadius: 1 }}>
                    {confirmButtonLabel}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default DeleteDialog;
