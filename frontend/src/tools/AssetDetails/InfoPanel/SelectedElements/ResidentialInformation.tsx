import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import classNames from 'classnames';
import { isEmpty } from '@/utils/isEmpty';

import { fetchResidentialInformation } from '@/api/combined';

const LIMIT = 3;

export interface ResidentialInformationProps {
    /** Is this/there an asset? */
    readonly isAsset: boolean;
    /** URI of the asset */
    readonly uri?: string;
    /** Primary asset type */
    readonly primaryType?: string;
    /** Additional classes to add to the top-level element */
    readonly className?: string;
}

export default function ResidentialInformation({ isAsset, primaryType, uri, className }: ResidentialInformationProps) {
    const isPerson = primaryType?.toLowerCase() === 'person';
    const show = Boolean(uri) && isAsset && isPerson;

    const {
        isLoading,
        isError,
        error,
        data: residences,
    } = useQuery({
        enabled: show,
        queryKey: ['person-residences', uri],
        queryFn: () => fetchResidentialInformation(uri),
    });

    if (!show) {
        return null;
    }

    const totalResidences = residences?.length || 0;

    return (
        <div className={classNames('flex flex-col gap-y-1', className)}>
            <div className="flex items-center justify-between text-whiteSmoke-300">
                <h3 className="uppercase">Residential Information</h3>
                {totalResidences > LIMIT && <p className="text-sm">{totalResidences} addresses found</p>}
            </div>
            <Addresses residences={residences} isLoading={isLoading} isError={isError} error={error} />
        </div>
    );
}

interface AddressesProps {
    readonly residences: any[];
    readonly isLoading: boolean;
    readonly isError: boolean;
    readonly error?: Error;
}

function Addresses({ residences, isLoading = false, isError = false, error }: AddressesProps) {
    const WRAPPER_CLASSNAMES = 'flex flex-col gap-y-2 bg-black-100 p-2 rounded-sm';

    const [showAll, setShowAll] = useState(false);

    const items = useMemo(() => {
        if (isEmpty(residences)) {
            return [];
        }
        return showAll ? residences : residences.slice(0, LIMIT);
    }, [showAll, residences]);

    if (isLoading) {
        return <p className={WRAPPER_CLASSNAMES}>Fetching residential addresses</p>;
    }
    if (isError) {
        return <p className={WRAPPER_CLASSNAMES}>{error.message}</p>;
    }
    if (isEmpty(residences)) {
        return <p className={WRAPPER_CLASSNAMES}>Residential information not found</p>;
    }

    return (
        <>
            <ul className={WRAPPER_CLASSNAMES}>
                {items.map((residence, index) => {
                    const section = `Address ${index + 1}`;
                    return (
                        <li key={residence.uri}>
                            <p className="text-sm font-semibold">{section}</p>
                            <p>{residence?.address || residence.uri}</p>
                        </li>
                    );
                })}
            </ul>
            {residences.length > LIMIT && (
                <button className="text-sm" onClick={() => setShowAll((prev) => !prev)}>
                    {showAll ? 'show less addresses' : 'show all addresses'}
                </button>
            )}
        </>
    );
}
