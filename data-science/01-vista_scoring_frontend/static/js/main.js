document.addEventListener('DOMContentLoaded', () => {
    const map = L.map('map').setView([50.69, -1.3], 10); // Centered on Isle of Wight
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    let graphData = { nodes: [], edges: [] };
    const nodeLayers = L.layerGroup().addTo(map);
    const edgeLayers = L.layerGroup().addTo(map);
    const nodeMarkers = {};

    const criticalityFilter = document.getElementById('criticality-filter');
    const criticalityValue = document.getElementById('criticality-value');
    const failureNodeSelect = document.getElementById('failure-node-select');
    const simulateBtn = document.getElementById('simulate-btn');
    const failedAssetsList = document.getElementById('failed-assets-list');
    const resetBtn = document.getElementById('reset-btn');

    const fetchAndDrawGraph = async () => {
        try {
            const response = await fetch('/api/graph');
            graphData = await response.json();
            populateDropdown(graphData.nodes);
            drawGraph();
        } catch (error) {
            console.error('Failed to fetch graph data:', error);
        }
    };

    const populateDropdown = (nodes) => {
        failureNodeSelect.innerHTML = '';
        nodes.sort((a, b) => a.id.localeCompare(b.id)).forEach(node => {
            const option = document.createElement('option');
            option.value = node.id;
            option.textContent = `${node.id} (${node.Asset_Name})`;
            failureNodeSelect.appendChild(option);
        });
    };

    const drawGraph = () => {
        nodeLayers.clearLayers();
        edgeLayers.clearLayers();
        Object.keys(nodeMarkers).forEach(key => delete nodeMarkers[key]);

        const critFilterValue = parseInt(criticalityFilter.value, 10);
        criticalityValue.textContent = critFilterValue;

        const visibleNodes = new Set();

        graphData.nodes.forEach(node => {
            if (node.criticality_score >= critFilterValue) {
                visibleNodes.add(node.id);
                if (node.lat && node.long) {
                    const marker = L.circleMarker([node.lat, node.long], {
                        radius: 6,
                        fillColor: '#3498db',
                        color: 'white',
                        weight: 1,
                        fillOpacity: 0.8
                    }).bindPopup(`<b>${node.Asset_Name}</b><br>ID: ${node.id}<br>Criticality: ${node.criticality_score}`);
                    nodeLayers.addLayer(marker);
                    nodeMarkers[node.id] = marker;
                }
            }
        });

        graphData.edges.forEach(edge => {
            if (visibleNodes.has(edge.source) && visibleNodes.has(edge.target)) {
                const sourceNode = graphData.nodes.find(n => n.id === edge.source);
                const targetNode = graphData.nodes.find(n => n.id === edge.target);
                if (sourceNode && targetNode && sourceNode.lat && targetNode.lat) {
                    const latlngs = [[sourceNode.lat, sourceNode.long], [targetNode.lat, targetNode.long]];
                    const polyline = L.polyline(latlngs, { color: '#555', weight: 2 });
                    edgeLayers.addLayer(polyline);
                }
            }
        });
    };
    
    const resetSimulationView = () => {
        failedAssetsList.innerHTML = '';
        drawGraph(); // Redraws the graph with original colors and filters
    };


    criticalityFilter.addEventListener('input', drawGraph);
    resetBtn.addEventListener('click', resetSimulationView);


    simulateBtn.addEventListener('click', async () => {
        const nodeId = failureNodeSelect.value;
        if (!nodeId) return;

        try {
            const response = await fetch('/api/simulate_failure', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ node_id: nodeId })
            });
            const { failed_nodes } = await response.json();
            
            // First, reset the view to clear previous simulations
            resetSimulationView();
            
            // Update failed assets list
            failedAssetsList.innerHTML = '';
            failed_nodes.forEach(id => {
                const li = document.createElement('li');
                li.textContent = id;
                failedAssetsList.appendChild(li);
            });

            // Highlight failed nodes and edges
            const failedSet = new Set(failed_nodes);
            edgeLayers.eachLayer(layer => {
                const sourceId = graphData.edges.find(e => e.target === layer.getLatLngs()[1].lat)?.source;
                const targetId = graphData.edges.find(e => e.source === layer.getLatLngs()[0].lat)?.target;
                
                // A simplified check; might need refinement for complex graphs
                let sourceNode, targetNode;
                graphData.edges.forEach(edge => {
                    const s = graphData.nodes.find(n => n.id === edge.source);
                    const t = graphData.nodes.find(n => n.id === edge.target);
                    if (s && t && s.lat === layer.getLatLngs()[0].lat && t.lat === layer.getLatLngs()[1].lat) {
                        sourceNode = s.id;
                        targetNode = t.id;
                    }
                });

                if (sourceNode && targetNode && failedSet.has(sourceNode) && failedSet.has(targetNode)) {
                    layer.setStyle({ color: 'red' });
                }
            });

            Object.keys(nodeMarkers).forEach(id => {
                if (failedSet.has(id)) {
                    nodeMarkers[id].setStyle({ fillColor: 'red', color: 'red' });
                }
            });

        } catch (error) {
            console.error('Simulation failed:', error);
        }
    });

    fetchAndDrawGraph();
});
