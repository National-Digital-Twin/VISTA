import type { Feature } from 'geojson';
import { DataSourceHandler } from './data-source-handler';
import { AssetSpecification } from '@/hooks/queries/dataset-utils';

interface LocationDetail {
    locationId: string;
    name: string;
    type: string;
    onspdLatitude: number;
    onspdLongitude: number;
    registrationStatus: string;
    careHome: string;
    numberOfBeds?: number;
    postalCode: string;
}

interface LocationSearchResponse {
    total: number;
    page: number;
    totalPages: number;
    nextPageUri: string | null;
    locations: {
        locationId: string;
        locationName: string;
        postalCode: string;
    }[];
}

/**
 * DataSourceHandler which handles the fetching of data from the Care Quality Commission (CQC) API.
 * https://api-portal.service.cqc.org.uk/
 */
export class CQCDataSourceHandler extends DataSourceHandler {
    public buildUrlsForDataSource(_assetSpecification: AssetSpecification): string[] {
        return [`/transparent-proxy/cqc/public/v1/locations?localAuthority=${this.locator}&careHome=Y&perPage=1000`];
    }

    /**
     * A function which fetches all data from the CQC API for a given asset specification.
     *
     * @param assetSpecification the specification of the asset
     * @param url the URL to be queried for data
     * @returns a list of mapped GeoJSON-compatible features
     */
    public async fetchDataForAssetSpecification(assetSpecification: AssetSpecification, url: string): Promise<Feature[]> {
        const allLocations: LocationSearchResponse['locations'] = [];
        let currentUrl: string | null = url;
        while (currentUrl) {
            const response: LocationSearchResponse = await this.fetchFromUrl(currentUrl);
            allLocations.push(...response.locations);

            currentUrl = response.nextPageUri ? `/transparent-proxy/cqc${response.nextPageUri}` : null;
        }

        const locationDetails = await Promise.all(allLocations.map((location) => this.fetchLocationDetails(location.locationId)));

        return this.mapLocationToGeoJSON(locationDetails, assetSpecification);
    }

    private async fetchLocationDetails(locationId: string): Promise<LocationDetail> {
        const url = `/transparent-proxy/cqc/public/v1/locations/${locationId}`;
        return await this.fetchFromUrl(url);
    }

    /**
     * A mapper function which creates GeoJSON features from the response returned by CQC.
     * It also filters out any features returned by CQC which do not match the specification of the asset.
     *
     * @param locationDetails the response returned from the CQC API
     * @param assetSpec the specification of the asset
     * @returns an array of Features
     */
    private mapLocationToGeoJSON(locationDetails: LocationDetail[], assetSpec: AssetSpecification): Feature[] {
        return locationDetails.reduce<Feature[]>((features, detail) => {
            if (detail.registrationStatus === 'Deregistered') {
                return features;
            }

            const feature: Feature = {
                type: 'Feature' as const,
                id: detail.locationId,
                geometry: {
                    type: 'Point' as const,
                    coordinates: [detail.onspdLongitude, detail.onspdLatitude],
                },
                properties: {
                    locationId: detail.locationId,
                    name: detail.name,
                    description: detail.type,
                },
            };

            if (this.isMatchForAssetSpecificationFilters(assetSpec, feature)) {
                features.push(feature);
            }

            return features;
        }, []);
    }
}
