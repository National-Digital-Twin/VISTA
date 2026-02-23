import SearchIcon from '@mui/icons-material/Search';
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import { Box, InputBase, alpha, styled } from '@mui/material';
import { useCallback, useEffect, useRef, useState, type FocusEventHandler, type KeyboardEvent } from 'react';
import { searchOsNamesLocations, type OsNamesLocation } from '@/api/os-names';
import { fetchAssetByExternalId, fetchAssetById } from '@/api/asset-search';
import type { AssetDetailsResponse } from '@/api/asset-details';

const EXPANDED_WIDTH = '28rem';
const COLLAPSED_WIDTH = '14rem';
const SEARCH_DEBOUNCE_MS = 700;
const MAX_RESULTS = 8;

const SearchWrapper = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ isActive }) => ({
    position: 'relative',
    width: isActive ? EXPANDED_WIDTH : COLLAPSED_WIDTH,
    transition: 'width 220ms ease',
}));

const SearchContainer = styled(Box, {
    shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>(({ theme }) => ({
    alignItems: 'center',
    backgroundColor: alpha(theme.palette.background.paper, 1),
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    cursor: 'text',
    display: 'flex',
    height: '3rem',
    gap: '0.375rem',
    padding: '0 0.75rem',
    opacity: 0.8,
    transition: 'opacity 220ms ease',
    width: '100%',
}));

const SearchInput = styled(InputBase)(({ theme }) => ({
    'color': theme.palette.text.primary,
    'flex': 1,
    '& input::placeholder': {
        color: theme.palette.text.secondary,
        opacity: 1,
    },
}));

const SearchResultsPanel = styled(Box)(({ theme }) => ({
    backgroundColor: theme.palette.background.paper,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[4],
    left: 0,
    marginTop: '0.5rem',
    maxHeight: '16rem',
    overflowY: 'auto',
    position: 'absolute',
    right: 0,
    top: '100%',
    zIndex: 4,
}));

const SearchResultButton = styled('button')(({ theme }) => ({
    'alignItems': 'center',
    'background': 'transparent',
    'border': 'none',
    'color': theme.palette.text.primary,
    'cursor': 'pointer',
    'display': 'flex',
    'font': 'inherit',
    'gap': '0.5rem',
    'padding': '0.6rem 0.75rem',
    'textAlign': 'left',
    'width': '100%',
    '&:hover': {
        backgroundColor: theme.palette.action.hover,
    },
}));

const SearchStatusMessage = styled(Box)(({ theme }) => ({
    color: theme.palette.text.secondary,
    padding: '0.75rem',
}));

type SearchControlProps = {
    onResultSelect?: (result: SearchSelection) => void;
};

type LocationSearchResult = {
    kind: 'location';
    id: string;
    label: string;
    icon: 'location';
    data: OsNamesLocation;
};

type AssetSearchResult = {
    kind: 'asset';
    id: string;
    label: string;
    icon: 'asset';
    data: AssetDetailsResponse;
};

type SearchResultItem = LocationSearchResult | AssetSearchResult;

export type SearchSelection =
    | { kind: 'location'; lng: number; lat: number; bounds?: [[number, number], [number, number]] }
    | { kind: 'asset'; asset: AssetDetailsResponse };

const SearchControl = ({ onResultSelect }: SearchControlProps) => {
    const [isActive, setIsActive] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [showNoResults, setShowNoResults] = useState(false);
    const [results, setResults] = useState<SearchResultItem[]>([]);
    const lastAttemptedQuery = useRef<string>('');
    const searchWrapperRef = useRef<HTMLDivElement | null>(null);
    const inputRef = useRef<HTMLInputElement | null>(null);

    const activateControl = useCallback(() => {
        // New search session: allow same query to be searched again.
        lastAttemptedQuery.current = '';
        setIsActive(true);
        requestAnimationFrame(() => {
            inputRef.current?.focus();
        });
    }, []);
    const handleInputBlur: FocusEventHandler<HTMLInputElement | HTMLTextAreaElement> = useCallback((event) => {
        const nextTarget = (event?.relatedTarget as Node | null) ?? null;
        if (nextTarget && searchWrapperRef.current?.contains(nextTarget)) {
            return;
        }
        setIsActive(false);
        setResults([]);
        setShowNoResults(false);
    }, []);

    const handleSearch = useCallback(
        async (query: string, options?: { force?: boolean }) => {
            const trimmedQuery = query.trim();
            const isForced = options?.force === true;
            if (!trimmedQuery || isSearching || (!isForced && trimmedQuery === lastAttemptedQuery.current)) {
                return;
            }

            lastAttemptedQuery.current = trimmedQuery;
            setShowNoResults(false);
            setIsSearching(true);
            try {
                if (trimmedQuery.length >= 3) {
                    const resolvedAsset = await fetchAssetByExternalId(trimmedQuery);
                    if (resolvedAsset) {
                        const asset = await fetchAssetById(resolvedAsset.id);
                        if (!asset) {
                            setResults([]);
                            setShowNoResults(true);
                            return;
                        }

                        setResults([
                            {
                                kind: 'asset',
                                id: asset.id,
                                label: `${asset.name || resolvedAsset.name || asset.id} (${asset.type.name})`,
                                icon: 'asset',
                                data: asset,
                            },
                        ]);
                        return;
                    }
                }

                const nextResults = await searchOsNamesLocations(trimmedQuery);
                const mappedResults = nextResults.slice(0, MAX_RESULTS).map((result) => ({
                    kind: 'location' as const,
                    id: `${result.name}-${result.lng}-${result.lat}`,
                    label: result.label,
                    icon: 'location' as const,
                    data: result,
                }));
                setResults(mappedResults);
                setShowNoResults(mappedResults.length === 0);
            } catch {
                // Keep the control responsive if upstream search fails.
                setResults([]);
                setShowNoResults(false);
            } finally {
                setIsSearching(false);
            }
        },
        [isSearching],
    );

    useEffect(() => {
        const trimmedQuery = searchText.trim();
        if (!trimmedQuery) {
            lastAttemptedQuery.current = '';
            setResults([]);
            setShowNoResults(false);
            return;
        }

        const timeoutId = setTimeout(() => {
            handleSearch(trimmedQuery).catch(() => undefined);
        }, SEARCH_DEBOUNCE_MS);

        return () => {
            clearTimeout(timeoutId);
        };
    }, [handleSearch, searchText]);

    const handleKeyDown = useCallback(
        (event: KeyboardEvent<HTMLInputElement>) => {
            if (event.key !== 'Enter') {
                return;
            }

            event.preventDefault();
            handleSearch(searchText, { force: true }).catch(() => undefined);
        },
        [handleSearch, searchText],
    );

    const handleSelectResult = useCallback(
        (result: SearchResultItem) => {
            setSearchText(result.kind === 'asset' ? (result.data.externalId ?? result.data.id) : result.data.name);
            setResults([]);
            setShowNoResults(false);
            setIsActive(false);
            if (result.kind === 'asset') {
                onResultSelect?.({ kind: 'asset', asset: result.data });
                return;
            }

            onResultSelect?.({
                kind: 'location',
                lng: result.data.lng,
                lat: result.data.lat,
                bounds: result.data.bounds,
            });
        },
        [onResultSelect],
    );

    return (
        <SearchWrapper ref={searchWrapperRef} role="search" aria-label="Map search" isActive={isActive} data-active={isActive ? 'true' : 'false'}>
            <SearchContainer isActive={isActive} onClick={activateControl} data-testid="map-search-container">
                <SearchIcon fontSize="small" />
                <SearchInput
                    inputRef={inputRef}
                    value={searchText}
                    onChange={(event) => {
                        setSearchText(event.target.value);
                        setShowNoResults(false);
                    }}
                    onFocus={() => setIsActive(true)}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    placeholder="Search VISTA"
                    inputProps={{ 'aria-label': 'Search map' }}
                />
            </SearchContainer>
            {isActive && (results.length > 0 || showNoResults) && (
                <SearchResultsPanel>
                    {results.map((result) => (
                        <SearchResultButton
                            key={result.id}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => handleSelectResult(result)}
                            type="button"
                        >
                            {result.icon === 'asset' ? <LayersOutlinedIcon fontSize="small" /> : <LocationOnOutlinedIcon fontSize="small" />}
                            <span>{result.label}</span>
                        </SearchResultButton>
                    ))}
                    {showNoResults && <SearchStatusMessage>No Results Found</SearchStatusMessage>}
                </SearchResultsPanel>
            )}
        </SearchWrapper>
    );
};

export default SearchControl;
