import React, { useState, useRef, useCallback, useEffect, useTransition } from 'react';
import classNames from 'classnames';
import SideDropdown from './SideDropdown';
import SideBar from './SideBar';
import styles from './style.module.css';
import useSharedStore from '@/hooks/useSharedStore';

/** Bar for asset search, shown in the top left of the map */
export default function SearchBar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const searchInputRef = useRef(null);
    const sideDropdownRef = useRef(null);
    const selectedFloodAreas = useSharedStore((state: any) => state.selectedFloodAreas);
    const selectedAssetTypes = useSharedStore((state: any) => state.selectedAssetTypes);

    const [_isPending, startTransition] = useTransition();

    const debouncedSetSearchQuery = useCallback(
        (value: string) => {
            startTransition(() => {
                setSearchQuery(value);
            });
        },
        [setSearchQuery],
    );

    const handleSearchChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            debouncedSetSearchQuery(e.target.value);
        },
        [debouncedSetSearchQuery],
    );

    const handleFocus = useCallback(() => {
        startTransition(() => {
            setIsFocused(true);
        });
    }, []);

    const handleClickOutside = useCallback((event) => {
        if (sideDropdownRef.current && !sideDropdownRef.current.contains(event.target) && !searchInputRef.current.contains(event.target)) {
            startTransition(() => {
                setIsFocused(false);
            });
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    const hasSelectedAssetTypes = Object.values(selectedAssetTypes).includes(true);
    const showSidebar = selectedFloodAreas.length > 0 || hasSelectedAssetTypes;

    const showSideDropdown = isFocused;

    return (
        <div className={styles.searchBarContainer}>
            <div className={styles.searchBarWrapper}>
                <input
                    type="search"
                    className={classNames('form-control', styles.searchBarInput)}
                    placeholder="Search for assets..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onFocus={handleFocus}
                    ref={searchInputRef}
                />
                {showSideDropdown && <SideDropdown searchQuery={searchQuery} className="absolute w-full" ref={sideDropdownRef} />}
            </div>
            {showSidebar && <SideBar />}
        </div>
    );
}
