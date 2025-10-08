import React, { useRef, useId, useState, useEffect, useCallback } from 'react';
import { IconDefinition } from '@fortawesome/fontawesome-common-types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { Button, Box, Menu } from '@mui/material';
import styles from './style.module.css';

export interface ToolbarDropdownProps {
    /** Dropdown icon */
    readonly icon?: IconDefinition;
    /** Title */
    readonly title: string;
    /** Children */
    readonly children: React.ReactNode | ((props: { toggle: (event: React.MouseEvent<HTMLElement>) => void }) => React.ReactNode);
}

export default function ToolbarDropdown({ icon, title, children }: ToolbarDropdownProps) {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

    const toggleDropdown = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
        setIsOpen((state) => !state);
    }, []);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setAnchorEl(null);
    }, []);

    const handleClickOutside = useCallback(
        (event: any) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                handleClose();
            }
        },
        [handleClose],
    );

    const menuId = useId();

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return (
        <Box className={styles.toolbarDropdown} ref={wrapperRef} data-dropdown-open={isOpen}>
            <ToolbarDropdownButton id={menuId} onClick={toggleDropdown} icon={icon} title={title} />

            <Menu
                id={menuId}
                anchorEl={anchorEl}
                open={isOpen}
                onClose={handleClose}
                MenuListProps={{
                    'aria-labelledby': menuId,
                }}
            >
                {typeof children === 'function' ? children({ toggle: toggleDropdown }) : children}
            </Menu>
        </Box>
    );
}

interface ToolbarDropdownButtonProps {
    readonly id: string;
    readonly onClick: (event: React.MouseEvent<HTMLElement>) => void;
    readonly icon?: IconDefinition;
    readonly title: string;
}

function ToolbarDropdownButton({ id, onClick, icon, title }: ToolbarDropdownButtonProps) {
    return (
        <Button
            id={id}
            onClick={onClick}
            startIcon={icon && <FontAwesomeIcon icon={icon} />}
            endIcon={<FontAwesomeIcon icon={faChevronDown} />}
            sx={{ backgroundColor: '#f0f0f0' }}
        >
            {title}
        </Button>
    );
}
