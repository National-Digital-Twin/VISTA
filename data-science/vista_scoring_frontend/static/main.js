// This function runs once the entire HTML page is loaded.
document.addEventListener('DOMContentLoaded', function() {
    
    // 1. Initialize the Leaflet map
    // The view is centered on the latitude and longitude of the Isle of Wight.
    const map = L.map('map').setView([50.69, -1.30], 11);

    // 2. Add a tile layer to the map (the background map image)
    // Using OpenStreetMap for the map tiles.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // 3. Fetch the graph data from our Flask backend API.
    fetch('/api/graph')
        .then(response => response.json())
        .then(data => {
            const nodeMarkers = {}; // Object to store markers for easy lookup

            // 4. Process and draw each node (asset) on the map.
            data.nodes.forEach(node => {
                // Check if the node has valid latitude and longitude data.
                if (node.lat && node.long) {
                    const marker = L.circleMarker([node.lat, node.long], {
                        radius: 8,
                        fillColor: "#3498db",
                        color: "#2980b9",
                        weight: 1,
                        opacity: 1,
                        fillOpacity: 0.8
                    }).addTo(map);

                    // Create a popup with asset information.
                    marker.bindPopup(`<b>${node.Asset_Name}</b><br>
                                     ID: ${node.id}<br>
                                     Type: ${node.Asset_Type}<br>
                                     Criticality: ${node.criticality_score}`);
                    
                    // Store the marker using its ID for connecting edges later.
                    nodeMarkers[node.id] = marker;
                }
            });

            // 5. Process and draw each edge (dependency) on the map.
            data.edges.forEach(edge => {
                const sourceMarker = nodeMarkers[edge.source];
                const targetMarker = nodeMarkers[edge.target];

                // Check if both source and target markers exist.
                if (sourceMarker && targetMarker) {
                    const sourceLatLng = sourceMarker.getLatLng();
                    const targetLatLng = targetMarker.getLatLng();
                    
                    // Draw a line between the source and target assets.
                    const polyline = L.polyline([sourceLatLng, targetLatLng], { 
                        color: '#e74c3c', 
                        weight: 2 
                    }).addTo(map);

                    // Add a tooltip to the line showing the dependency score.
                    polyline.bindTooltip(`Dependency Score: ${edge.dependency_score}`);
                }
            });
        })
        .catch(error => {
            // Display an error message if data fetching fails.
            console.error('Error fetching or processing graph data:', error);
            document.getElementById('map').innerHTML = '<p style="color: red; text-align: center;">Could not load map data. Please ensure the backend server is running correctly.</p>';
        });
});
