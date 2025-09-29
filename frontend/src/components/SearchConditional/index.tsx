import type React from 'react';

import styles from './style.module.css';

export interface SearchConditionalProps {
    /** Current search query being used */
    readonly searchQuery: string | undefined;
    /** Search terms which we purport to match */
    readonly terms: string[];
    /** Children to include if we're matching */
    readonly children: React.ReactNode;
}

/** Component which is conditionally included if it matches search */
export default function SearchConditional({ searchQuery, terms, children }: SearchConditionalProps) {
    if (!searchQuery || matchesSearchTerms(searchQuery, terms)) {
        return (
            <div className={styles.searchConditional} data-show-layer={true}>
                {children}
            </div>
        );
    } else {
        return null;
    }
}

function matchesSearchTerms(searchQuery: string, terms: string[]): boolean {
    if (searchQuery === '') {
        return true;
    }
    return terms.some((term) => searchMatches(searchQuery, term));
}

function searchMatches(searchQuery: string, term: string): boolean {
    const needleNormalised = normaliseTerm(searchQuery);
    const haystackNormalised = normaliseTerm(term);
    return haystackNormalised.includes(needleNormalised);
}

function normaliseTerm(term: string) {
    return term.toLowerCase().replace(/\s/g, '');
}
