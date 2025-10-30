import { capitalCase } from 'change-case';
import { useSuspenseQuery } from '@tanstack/react-query';
import ontologyService from '@/ontology-service';

export interface FoundIcon {
    /** Class URI */
    classUri: string;
    /** Foreground color */
    color: string;
    /** Background color */
    backgroundColor: string;
    /** Fallback text */
    iconFallbackText: string;
    /** Alt-text */
    alt: string;
    /** Fontawesome icon class */
    faIcon?: string;
}

// These utilities are taken from the ontology service
function hasFragment(uri: string) {
    return uri && uri.startsWith('http') && uri.includes('#');
}

function getURIFragment(uri: string) {
    if (hasFragment(uri)) {
        const uriParts = uri.split('#');
        return uriParts.length > 1 ? uriParts[1] : uri;
    }
    return uri;
}

function getInitials(value: string) {
    if (value) {
        const REGEX_GET_FIRST_CHAR_OF_STRING = /(\b[a-zA-Z0-9])?/g; // matches any alphanumeric character (letters or digits).
        const initials = value.match(REGEX_GET_FIRST_CHAR_OF_STRING);
        if (initials) {
            return initials.join('').slice(0, 3);
        }
    }

    return '-';
}

function getTypeInitials(type: string) {
    if (hasFragment(type)) {
        const uriParts = type.split('#');
        if (uriParts.length === 2) {
            return getInitials(capitalCase(uriParts[1]));
        }
    }

    return type ?? '';
}

function useStyles(): Record<string, FoundIcon> | undefined {
    const { data, error, isLoading } = useSuspenseQuery({
        queryKey: ['ontology-styles'],
        queryFn: async () => {
            const iconEntries: Record<
                string,
                {
                    defaultIcons: {
                        faClass: string;
                        faIcon: string;
                        faUnicode: string;
                        riIcon: string;
                    };
                    defaultStyles: {
                        borderRadius: string;
                        borderWidth: string;
                        shape: string;
                        selectedBorderWidth: string;
                        dark: {
                            color: string;
                            backgroundColor: string;
                        };
                        light: {
                            color: string;
                            backgroundColor: string;
                        };
                    };
                }
            > = await ontologyService.getStyles([]);
            return Object.fromEntries(
                Object.keys(iconEntries).map((classUri) => {
                    const value = iconEntries[classUri];

                    return [
                        classUri,
                        {
                            classUri,
                            color: value.defaultStyles.dark.color,
                            backgroundColor: value.defaultStyles.dark.backgroundColor,
                            faIcon: value.defaultIcons.faIcon,
                            alt: getURIFragment(classUri),
                            iconFallbackText: getTypeInitials(classUri),
                        },
                    ];
                }),
            );
        },
    });

    if (isLoading) {
        return undefined; // or return a loading state if needed
    }

    if (error) {
        console.error('Error fetching ontology styles:', error);
        return undefined; // or handle the error state if needed
    }

    return data;
}

export default function useFindIcon(classUri: string): FoundIcon {
    const styles = useStyles();

    if (styles && classUri in styles) {
        return styles[classUri];
    }

    const alt = getURIFragment(classUri);
    const iconFallbackText = getTypeInitials(classUri);

    return {
        classUri,
        color: '#DDDDDD',
        backgroundColor: '#121212',
        iconFallbackText,
        alt,
    };
}
