import { useState } from 'react';
import { noCase } from 'change-case';
import { useQuery } from '@tanstack/react-query';
import DetailsSection from './DetailsSection';
import { isEmpty } from '@/utils/isEmpty';

import { fetchResidents } from '@/api/combined';

const TYPES = ['residential building'];

export interface ResidentsProps {
    /** Is this/there an asset? */
    isAsset: boolean;
    /** URI of the asset */
    assetUri?: string;
    /** Primary asset type */
    primaryType?: string;
}

export default function Residents({ isAsset, assetUri, primaryType }) {
    const hasResidents = TYPES.some((type) => type === noCase(primaryType));
    const {
        fetchStatus,
        isLoading,
        isError,
        error,
        data: residents,
    } = useQuery({
        enabled: !!assetUri && isAsset && hasResidents,
        queryKey: ['residents', assetUri],
        queryFn: () => fetchResidents(assetUri),
    });
    const isIdle = fetchStatus === 'idle';

    const [expand, setExpand] = useState(false);

    const totalResidents = residents?.length || 0;

    const toggleSection = () => {
        setExpand((prev) => !prev);
    };

    if (isIdle) {
        return null;
    }
    if (isLoading) {
        return <p className="px-4 py-3 rounded-lg bg-black-100">Fetching residents information</p>;
    }
    if (isError) {
        return <p className="px-4 py-3 bg-red-900 rounded-lg">{error.message}</p>;
    }
    if (isEmpty(residents)) {
        return null;
    }

    return (
        <DetailsSection expand={expand} onToggle={toggleSection} title={`${totalResidents} resident${totalResidents > 1 ? 's' : ''}`}>
            <ul>
                {residents.map((resident) => {
                    const residentName = resident?.name;
                    return <li key={residentName ?? resident.uri}>{residentName || resident.uri}</li>;
                })}
            </ul>
        </DetailsSection>
    );
}
