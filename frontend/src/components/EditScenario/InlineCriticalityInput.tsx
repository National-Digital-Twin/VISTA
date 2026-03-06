// SPDX-License-Identifier: Apache-2.0
// © Crown Copyright 2026. This work has been developed by the National Digital Twin Programme
// and is legally attributed to the Department for Business and Trade (UK) as the governing entity.

import { TextField } from '@mui/material';
import type { KeyboardEvent } from 'react';
import { useState } from 'react';
import { MAX_CRITICALITY_SCORE } from '@/api/dataroom-assets';

type InlineCriticalityInputProps = {
    onSubmit: (score: number) => void;
    onCancel: () => void;
};

export default function InlineCriticalityInput({ onSubmit, onCancel }: Readonly<InlineCriticalityInputProps>) {
    const [editValue, setEditValue] = useState('');

    const submit = () => {
        if (editValue === '') {
            onCancel();
            return;
        }
        onSubmit(Number(editValue));
    };

    return (
        <TextField
            value={editValue}
            onChange={(e) => {
                const v = e.target.value;
                if (v === '' || (/^\d$/.test(v) && Number(v) >= 0 && Number(v) <= MAX_CRITICALITY_SCORE)) {
                    setEditValue(v);
                }
            }}
            onBlur={submit}
            onKeyDown={(e: KeyboardEvent) => {
                if (e.key === 'Enter') {
                    submit();
                } else if (e.key === 'Escape') {
                    onCancel();
                }
            }}
            size="small"
            autoFocus
            slotProps={{ htmlInput: { maxLength: 1, style: { textAlign: 'center', padding: '2px 4px', fontSize: '0.8rem' } } }}
            sx={{ 'width': 40, '& .MuiOutlinedInput-root': { height: 24 } }}
            onClick={(e) => e.stopPropagation()}
        />
    );
}
