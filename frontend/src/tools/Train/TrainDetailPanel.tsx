import { useQuery } from '@tanstack/react-query';
import { Box } from '@mui/material';
import styles from './style.module.css';

import useStore from './useStore';
import TRAIN_STATIONS from '@/data/train-stations.json';
import { fetchTrainDepartures, fetchTrainArrivals } from '@/api/train-connections';
import DetailsPanel from '@/components/DetailsPanel/DetailsPanel';

export default function TrainDetailPanel() {
    const selectedStation = useStore((state) => state.selectedTrainStation);
    const deselectStation = useStore((state) => state.deselectTrainStation);

    const stationObj = selectedStation ? TRAIN_STATIONS[selectedStation] : null;

    const { data: departureData, isLoading: isDeparturesLoading } = useQuery({
        queryKey: ['train-departures', selectedStation],
        queryFn: () => fetchTrainDepartures(stationObj?.NLC || ''),
        enabled: !!selectedStation,
    });

    const { data: arrivalData, isLoading: isArrivalsLoading } = useQuery({
        queryKey: ['train-arrivals', selectedStation],
        queryFn: () => fetchTrainArrivals(stationObj?.NLC || ''),
        enabled: !!selectedStation && !!departureData,
    });

    const isLoading = isDeparturesLoading || isArrivalsLoading;

    if (!selectedStation || stationObj === null) {
        return null;
    }

    const content = (
        <Box className={styles.trainsContent}>
            <h2 className="text-xl font-bold">{selectedStation}</h2>
            {isLoading ? (
                <p>Loading train data...</p>
            ) : (
                <Box className={styles.trainDataContainer}>
                    <Box className={styles.trainDataColumn}>
                        <h3 className="text-lg font-semibold mb-2">Departures</h3>
                        <table className={styles.trainTable}>
                            <thead>
                                <tr>
                                    <th>Booked</th>
                                    <th>Public</th>
                                    <th>Destination</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {departureData?.services?.slice(0, 5).map((service) => (
                                    <tr key={service.serviceUid}>
                                        <td>{service.locationDetail.gbttBookedDeparture}</td>
                                        <td>{service.locationDetail.destination[0].publicTime}</td>
                                        <td>{service.locationDetail.destination[0].description}</td>
                                        <td>{service.serviceType}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>

                    <Box className={styles.trainDataColumn}>
                        <h3 className="text-lg font-semibold mb-2">Arrivals</h3>
                        <table className={styles.trainTable}>
                            <thead>
                                <tr>
                                    <th>Booked</th>
                                    <th>Public</th>
                                    <th>Origin</th>
                                    <th>Type</th>
                                </tr>
                            </thead>
                            <tbody>
                                {arrivalData?.services?.slice(0, 5).map((service) => (
                                    <tr key={service.serviceUid}>
                                        <td>{service.locationDetail.gbttBookedArrival}</td>
                                        <td>{service.locationDetail.origin[0].publicTime}</td>
                                        <td>{service.locationDetail.origin[0].description}</td>
                                        <td>{service.serviceType}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Box>
                </Box>
            )}
        </Box>
    );

    return (
        <DetailsPanel isOpen={!!selectedStation} onClose={deselectStation}>
            <div className={styles.trainsDetailsPanelContent}>
                <div className={styles.trainsContent}>{content}</div>
            </div>
        </DetailsPanel>
    );
}
