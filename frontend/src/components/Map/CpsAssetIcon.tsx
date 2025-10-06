import { SVGProps } from 'react';

export interface CpsAssetIconProps extends SVGProps<SVGSVGElement> {
    children: string;
    width?: number;
    height?: number;
}

export const CpsAssetIcon = ({ children, width = 50, height = 50, ...rest }: CpsAssetIconProps) => (
    <svg x="0px" y="0px" width={width} height={height} viewBox="0 0 256 256" {...rest}>
        <rect x="15.644" y="4.973" fill="#FFFFFF" width="224.533" height="138.489" />
        <path
            d="M246.313,0H9.688v150.266h0.056l-0.025,0.029l122.031,105.708l114.506-105.678l-0.055-0.06h0.112V0z M20.688,11h214.625
	v128.266H20.688V11z M131.517,241.249L26.485,150.266H230.1L131.517,241.249z"
        />
        <g>
            <text x="50%" y="35%" dominantBaseline="top" textAnchor="middle" fontSize="48" fontWeight="bold" fontFamily="Arial" fill="black">
                {children}
            </text>
        </g>
    </svg>
);
