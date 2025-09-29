import { useMemo } from 'react';
import styles from './TypeIcon.module.css';
import useFindIcon from '@/hooks/useFindIcon';

export interface TypeIconProps {
    /** Icon size */
    readonly size?: 'sm' | 'md' | 'lg' | 'base';
    /** Ontology type (class) URI or short URI */
    readonly type: string;
    /** Disabled - if true, icon is rendered in a disabled state */
    readonly disabled?: boolean;
}

function NewTypeIcon({ size = 'base', type, disabled = false }: TypeIconProps) {
    const iconProps = useFindIcon(type);
    // Most of these icons are missing in fontawesome
    //const hasIcon = Boolean(iconProps?.faIcon);
    const hasIcon = false;

    const dataSize = size === 'base' ? 'md' : size;
    const dataDisabled = disabled ? 'true' : 'false';

    const style = useMemo(
        () => ({
            color: iconProps.color,
            backgroundColor: iconProps.backgroundColor,
            borderColor: iconProps.color,
        }),
        [iconProps.color, iconProps.backgroundColor],
    );

    return (
        <div
            className={styles.typeIcon}
            style={style}
            aria-label={iconProps.alt}
            data-type-icon-size={dataSize}
            data-type-icon-disabled={dataDisabled}
        >
            {hasIcon ? <i className={iconProps.faIcon} title={iconProps.alt} /> : iconProps.iconFallbackText}
        </div>
    );
}

/**
 * This component can be used to display type/class iconography defined in the
 * ontology. If the styles cannot be found, the initials will be rendered as a
 * fallback as demonstrated in the stories.
 *
 * It emulates a subset of the behaviour of TeliTypeIcon.
 */
export default function TypeIcon({ size = 'base', type, disabled = false }: TypeIconProps) {
    return <NewTypeIcon size={size} type={type} disabled={disabled} />;
}
