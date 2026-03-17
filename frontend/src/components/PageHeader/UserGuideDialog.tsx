// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import CloseIcon from '@mui/icons-material/Close';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Typography } from '@mui/material';

type UserGuideDialogProps = {
    readonly open: boolean;
    readonly onClose: () => void;
};

const DOCUMENTATION_ZIP_PATH = '/downloads/VISTA - Documentation and Guides.zip';

function UserGuideDialog({ open, onClose }: UserGuideDialogProps) {
    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="user-guide-dialog-title">
            <DialogTitle
                id="user-guide-dialog-title"
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                }}
            >
                Download the VISTA user guides
                <IconButton onClick={onClose} size="small" aria-label="Close">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                <Typography variant="body1" component="div" sx={{ mb: 2 }}>
                    The pack is a single zip file containing guides to navigating the platform, using the map and data room, and for administrators, managing
                    settings and access.
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    After downloading, unzip the file to access the PDF guides and any supporting documentation for VISTA.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0, mt: 2 }}>
                <Button onClick={onClose} variant="outlined" sx={{ flex: 1, mr: 1, height: 48, borderRadius: 1 }}>
                    Cancel
                </Button>
                <Button
                    component="a"
                    href={DOCUMENTATION_ZIP_PATH}
                    download
                    variant="contained"
                    color="primary"
                    sx={{ flex: 2, height: 48, borderRadius: 1 }}
                    data-testid="user-guide-download-button"
                >
                    Download User Guides
                </Button>
            </DialogActions>
        </Dialog>
    );
}

export default UserGuideDialog;
