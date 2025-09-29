import { useCallback, useContext } from 'react';
import { DynamicProximityDrawingContext } from './DynamicProximityProvider';
import ComplexLayerControl from '@/components/ComplexLayerControl';
import MenuItemRow from '@/components/MenuItemRow';
import SearchConditional from '@/components/SearchConditional';
import type { LayerControlProps } from '@/tools/Tool';

export default function DynamicProximityLayerControl({ searchQuery }: Readonly<LayerControlProps>) {
    return (
        <SearchConditional searchQuery={searchQuery} terms={['dynamic proximity', 'radius', 'circle', 'km']}>
            <ComplexLayerControl title="Dynamic proximity" hideCount={true}>
                <DynamicProximityControlPanelBody />
            </ComplexLayerControl>
        </SearchConditional>
    );
}

function DynamicProximityControlPanelBody() {
    return (
        <div>
            {[1, 2, 3].map((radiusKm) => (
                <DynamicProximityMenuItem key={radiusKm} radiusKm={radiusKm} />
            ))}
        </div>
    );
}

interface DynamicProximityMenuItemProps {
    readonly radiusKm: number;
    readonly onClick?: () => void;
}

function DynamicProximityMenuItem({ radiusKm, onClick }: DynamicProximityMenuItemProps) {
    const context = useContext(DynamicProximityDrawingContext);

    const clicked = useCallback(() => {
        if (context) {
            context.startDrawingWithRange(radiusKm);
        }
        onClick?.();
    }, [radiusKm, onClick, context]);

    return (
        <MenuItemRow
            primaryText={`${radiusKm}km radius`}
            checked={false}
            searchQuery=""
            terms={[`${radiusKm}km radius`]}
            buttons={[
                {
                    iconSvg: (
                        <svg width="29" height="28" viewBox="0 0 29 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="14" cy="4" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                            <circle cx="25" cy="7" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                            <circle cx="19" cy="24" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                            <circle cx="4" cy="13" r="3.25" stroke="#0E142B" strokeWidth="1.5" />
                            <path d="M6.5 11L11.5 6M17 5.5H22M24 10L20 20.5M6.5 15L16.5 22" stroke="#0E142B" strokeWidth="1.5" />
                        </svg>
                    ),
                    name: `${radiusKm}km radius`,
                    onClick: clicked,
                },
            ]}
        />
    );
}
