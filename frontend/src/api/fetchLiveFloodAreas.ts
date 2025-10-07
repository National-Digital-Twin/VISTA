const fetchLiveFloodAreas = async () => {
    const response = await fetch('https://environment.data.gov.uk/flood-monitoring/id/floods?lat=50.7&long=-1.35&dist=10');
    if (!response.ok) {
        throw new Error('An error occurred while retrieving live flood areas');
    }
    const data = await response.json();
    return (
        await Promise.all(
            data.items.map(async (v) => {
                const response = await fetch(v.floodArea.polygon);
                if (!response.ok) {
                    throw new Error('An error occurred while retrieving live flood polygon');
                }
                return (await response.json()).features;
            }),
        )
    ).flat();
};

export default fetchLiveFloodAreas;
