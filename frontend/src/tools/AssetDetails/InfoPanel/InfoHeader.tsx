import { Box, Link, SvgIcon } from '@mui/material';
import React, { useId } from 'react';
import classNames from 'classnames';
import styles from './infopanel.module.css';

export interface InfoHeaderProps {
    /** Additional classes to add to the top-level element */
    readonly className?: string;
    /** Children */
    readonly children?: React.ReactNode;
}

export default function InfoHeader({ className, children }: InfoHeaderProps) {
    return <div className={classNames(styles.infoHeader, className)}>{children}</div>;
}

export interface InfoTitleProps {
    /** Additional classes to add to the top-level element */
    readonly className?: string;
    /** Children */
    readonly children: React.ReactNode;
}

export function InfoTitle({ children, className }: InfoHeaderProps) {
    return <h2 className={classNames(styles.infoTitle, className)}>{children}</h2>;
}

export interface StreetViewProps {
    /** Additional classes to add to the top-level element */
    readonly className?: string;
    /** Latitude, in decimal degrees */
    readonly latitude: number;
    /** Longitude, in decimal degrees */
    readonly longitude: number;
}

export function StreetView({ latitude, longitude, className }: StreetViewProps) {
    const label = 'Open street view';

    const params = {
        api: '1',
        map_action: 'pano',
        viewpoint: `${latitude},${longitude}`,
    };
    const tooltipID = useId();

    if (!latitude && !longitude) {
        return null;
    }

    return (
        <Box className={classNames(styles.streetViewContainer, className)}>
            <Link
                href={`https://www.google.com/maps/@?${new URLSearchParams(params).toString()}`}
                target="_blank"
                rel="noreferrer"
                aria-labelledby={tooltipID}
                className={styles.streetViewLink}
            >
                <SvgIcon className={styles.streetViewIcon}>
                    <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="14" cy="4" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                        <circle cx="25" cy="7" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                        <circle cx="19" cy="24" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                        <circle cx="4" cy="13" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                        <path d="M6.5 11L11.5 6M17 5.5H22M24 10L20 20.5M6.5 15L16.5 22" stroke="#0E142B" strokeWidth="1.5" />
                    </svg>
                </SvgIcon>
            </Link>
            <Box id={tooltipID} role="tooltip" className={styles.streetViewTooltip}>
                {label}
            </Box>
        </Box>
    );
}
