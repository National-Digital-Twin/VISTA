import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronUp, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import styles from './elements.module.css';

export interface DetailsSectionProps {
    /** Whether the section is expanded */
    expand: boolean;
    /** Callback when the toggle is pressed */
    onToggle?: () => void;
    /** Title of the secdion */
    title: string;
    /** Children */
    children?: React.ReactNode;
}

const DetailsSection = ({ expand, onToggle, title, children }: DetailsSectionProps) => {
    if (!expand) {
        return (
            <DetailsSectionTitle expand={expand} onToggle={onToggle}>
                <h3 className={styles.detailsSectionHeading}>{title}</h3>
            </DetailsSectionTitle>
        );
    }

    return (
        <div className={styles.detailsSection}>
            <DetailsSectionTitle expand={expand} onToggle={onToggle}>
                <h3 className={styles.detailsSectionHeading}>{title}</h3>
            </DetailsSectionTitle>
            <div className={styles.detailsSectionContent}>{children}</div>
        </div>
    );
};

interface DetailsSectionTitleProps {
    expand: boolean;
    onToggle?: () => void;
    children: React.ReactNode;
}

const DetailsSectionTitle = ({ expand, onToggle, children }: DetailsSectionTitleProps) => {
    if (onToggle) {
        return (
            <button className={styles.detailsSectionTitle} onClick={onToggle}>
                {children}
                <FontAwesomeIcon icon={expand ? faChevronUp : faChevronDown} className="ml-auto text-lg" />
            </button>
        );
    }
    return <div className={styles.detailsSectionTitle}>{children}</div>;
};

export default DetailsSection;
