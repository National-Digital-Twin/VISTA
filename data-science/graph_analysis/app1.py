import os
import glob
import json
import io
import networkx as nx
import pandas as pd
import geopandas as gpd
from shapely.geometry import Point
from flask import Flask, render_template_string, request, jsonify, session, redirect, url_for
from flask_session import Session

# --- Flask App Initialization ---
app = Flask(__name__)

# Configure session to use filesystem
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config['SECRET_KEY'] = os.urandom(24)
Session(app)

# --- Create Upload Directories ---
UPLOAD_FOLDERS = {
    'assets': 'uploads/assets',
    'dependencies': 'uploads/dependencies',
    'geojson': 'uploads/geojson'
}
for folder in UPLOAD_FOLDERS.values():
    if not os.path.exists(folder):
        os.makedirs(folder)

# --- Utility and Analysis Functions (from vista_criticality_utils.py) ---

def compute_dependency_score(G):
    for node in G.nodes():
        dependencies = list(G.successors(node))
        if not dependencies:
            dep_score = 0
        else:
            sum_of_criticalities = sum(G.nodes[dep].get('criticality_score', 0) for dep in dependencies)
            dep_score = round(sum_of_criticalities / len(dependencies))
        G.nodes[node]['dependency_score'] = dep_score
    return G

def compute_redundancy_score(G):
    assets_df = pd.DataFrame.from_dict(dict(G.nodes(data=True)), orient='index')
    if 'backup_asset_id' not in assets_df.columns:
        for node_id in G.nodes():
            G.nodes[node_id]['redundancy_score'] = 0
        return G
        
    asset_coordinates = {row.Index: (row.lat, row.long) for row in assets_df.itertuples()}
    
    for node_id, data in G.nodes(data=True):
        backup_id = data.get('backup_asset_id')
        score = 0
        if pd.notna(backup_id) and backup_id in asset_coordinates:
            lat1, lon1 = asset_coordinates[node_id]
            lat2, lon2 = asset_coordinates[backup_id]
            # Simple distance calculation (replace with haversine if needed)
            distance = ((lat1 - lat2)**2 + (lon1 - lon2)**2)**0.5 * 111 # Approx km
            if distance < 2: score = 0
            elif 2 <= distance <= 5: score = 1
            else: score = 2
        else:
            score = 3
        G.nodes[node_id]['redundancy_score'] = score
    return G

def compute_exposure_score(G, active_geojson_files):
    assets_df = pd.DataFrame.from_dict(dict(G.nodes(data=True)), orient='index')
    assets_df['Asset_ID'] = assets_df.index
    
    # Separate files by type
    flood_files = [f for f in active_geojson_files if 'flood' in f.lower() or 'water' in f.lower()]
    heat_files = [f for f in active_geojson_files if 'heat' in f.lower()]
    landslide_files = [f for f in active_geojson_files if 'landslide' in f.lower()]

    def get_union_geom(files):
        if not files: return None
        try:
            layers = [gpd.read_file(os.path.join(UPLOAD_FOLDERS['geojson'], f)) for f in files]
            if layers:
                return pd.concat(layers, ignore_index=True).geometry.unary_union
        except Exception as e:
            print(f"Could not process hazard files: {e}")
        return None

    flood_geom = get_union_geom(flood_files)
    heat_geom = get_union_geom(heat_files)
    landslide_geom = get_union_geom(landslide_files)

    geometry = [Point(xy) for xy in zip(assets_df['long'], assets_df['lat'])]
    assets_gdf = gpd.GeoDataFrame(assets_df, geometry=geometry, crs="EPSG:4326")
    assets_gdf_proj = assets_gdf.to_crs("EPSG:27700")
    
    flood_geom_proj = None
    if flood_geom and not flood_geom.is_empty:
        flood_geom_proj = gpd.GeoSeries([flood_geom], crs="EPSG:4326").to_crs("EPSG:27700").unary_union

    for index, asset in assets_gdf.iterrows():
        asset_geom = asset.geometry
        intersects_flood = flood_geom and asset_geom.intersects(flood_geom)
        score = 0
        if intersects_flood:
            intersects_heat = heat_geom and asset_geom.intersects(heat_geom)
            intersects_landslide = landslide_geom and asset_geom.intersects(landslide_geom)
            score = 3 if intersects_heat or intersects_landslide else 2
        elif flood_geom_proj:
            asset_geom_proj = assets_gdf_proj.loc[index].geometry
            if asset_geom_proj.distance(flood_geom_proj) <= 500:
                score = 1
        
        G.nodes[asset['Asset_ID']]['exposure_score'] = score
    return G

def compute_asset_score(G):
    for node_id, data in G.nodes(data=True):
        asset_score = (data.get('criticality_score', 0) +
                       data.get('dependency_score', 0) +
                       data.get('redundancy_score', 0) +
                       data.get('exposure_score', 0))
        G.nodes[node_id]['asset_score'] = asset_score
    return G

# --- HTML Template ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Asset Network Analyzer</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
        html, body { height: 100%; margin: 0; font-family: Arial, sans-serif; overflow: hidden; }
        .main-layout { display: flex; height: 100vh; }
        .sidebar { width: 20%; min-width: 300px; padding: 15px; background-color: #f8f9fa; overflow-y: auto; box-shadow: 2px 0 5px rgba(0,0,0,0.1); }
        .map-container { flex-grow: 1; height: 100vh; }
        #map { height: 100%; width: 100%; }
        .form-section { margin-bottom: 20px; background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; }
        .btn { display: block; width: 100%; background-color: #007bff; color: white; padding: 10px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; margin-top: 10px; }
        .btn:hover { background-color: #0056b3; }
        .btn-analyze { background-color: #28a745; }
        .btn-analyze:hover { background-color: #218838; }
        .btn-simulate { background-color: #dc3545; }
        .btn-simulate:hover { background-color: #c82333; }
        .btn-revert { background-color: #ffc107; color: black; }
        .btn-revert:hover { background-color: #e0a800; }
        h2 { font-size: 1.2rem; margin-top: 0; }
        .filter-group, .node-explorer, .simulation-group { margin-top: 20px; }
        .slider-container { margin-bottom: 10px; }
        .slider-container label { display: block; margin-bottom: 5px; }
        .slider-container input[type=range] { width: 100%; }
        #node-details { background-color: #e9ecef; padding: 10px; border-radius: 5px; min-height: 50px; }
    </style>
</head>
<body>
<div class="main-layout">
    <div class="sidebar">
        <h2>File Management</h2>
        <div class="form-section">
            <form id="upload-assets" class="upload-form" data-url="/upload_assets">
                <label>Asset CSV File</label>
                <input type="file" name="file" accept=".csv" required>
                <button type="submit" class="btn">Upload/Update Assets</button>
            </form>
        </div>
        <div class="form-section">
            <form id="upload-deps" class="upload-form" data-url="/upload_dependencies">
                <label>Dependency CSV File</label>
                <input type="file" name="file" accept=".csv" required>
                <button type="submit" class="btn">Upload/Update Dependencies</button>
            </form>
        </div>
        <div class="form-section">
            <form id="upload-geojson" class="upload-form" data-url="/upload_geojson">
                <label>GeoJSON Hazard Layer</label>
                <input type="file" name="file" accept=".geojson" required>
                <button type="submit" class="btn">Upload GeoJSON</button>
            </form>
        </div>
        <form action="/revert" method="post"><button type="submit" class="btn btn-revert">Revert Last Additions</button></form>

        <hr>
        <h2>Analysis & Simulation</h2>
        <button id="analyze-btn" class="btn btn-analyze">Analyse Network</button>
        
        <div class="filter-group form-section">
            <h3>Filter by Score</h3>
            <div class="slider-container">
                <label for="crit-slider">Criticality: <span id="crit-val">0-5</span></label>
                <input type="range" id="crit-slider" min="0" max="5" value="0,5" class="score-slider">
            </div>
            <!-- Add more sliders for other scores -->
        </div>

        <div class="simulation-group form-section">
            <h3>Failure Simulation</h3>
            <input type="text" id="node-to-fail" placeholder="Select node on map or enter ID">
            <label for="deep-prop">Deep Propagation</label>
            <input type="checkbox" id="deep-prop">
            <button id="simulate-btn" class="btn btn-simulate">Simulate Failure</button>
        </div>
        
        <div class="node-explorer form-section">
            <h3>Node Explorer</h3>
            <input type="text" id="node-explorer-input" placeholder="Click node or enter ID">
            <div id="node-details">Select a node to see details.</div>
        </div>
    </div>
    <div class="map-container"><div id="map"></div></div>
</div>

<script>
    // --- Map Initialization ---
    const map = L.map('map').setView([52.5, -1.5], 6); // Centered on UK
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let graphData = { nodes: [], edges: [] };
    let geojsonLayers = {};
    let assetMarkers = L.layerGroup().addTo(map);
    let dependencyLines = L.layerGroup().addTo(map);
    const layerControl = L.control.layers(null, {}).addTo(map);

    // --- Core Functions ---
    function fetchAndDrawGraph() {
        fetch('/get_graph_data')
            .then(res => res.json())
            .then(data => {
                graphData = data;
                drawGraph();
            });
    }

    function drawGraph() {
        assetMarkers.clearLayers();
        dependencyLines.clearLayers();

        if (!graphData.nodes) return;

        graphData.nodes.forEach(node => {
            const color = node.id.startsWith('JN') ? 'green' :
                          node.criticality_score == 3 ? 'red' :
                          node.criticality_score == 2 ? 'orange' : // Amber
                          node.criticality_score == 1 ? 'blue' : 'grey';
            
            const marker = L.circleMarker([node.lat, node.long], {
                radius: 6, color: 'black', weight: 1, fillColor: color, fillOpacity: 0.8
            }).addTo(assetMarkers);

            marker.nodeId = node.id;
            marker.on('click', () => {
                document.getElementById('node-explorer-input').value = node.id;
                fetchNodeDetails(node.id);
                document.getElementById('node-to-fail').value = node.id;
            });
        });

        graphData.edges.forEach(edge => {
            const fromNode = graphData.nodes.find(n => n.id === edge.source);
            const toNode = graphData.nodes.find(n => n.id === edge.target);
            if (fromNode && toNode) {
                const latlngs = [[fromNode.lat, fromNode.long], [toNode.lat, toNode.long]];
                L.polyline(latlngs, { color: '#3388ff', weight: 2 }).addTo(dependencyLines);
            }
        });
    }

    function fetchNodeDetails(nodeId) {
        fetch(`/get_node_details/${nodeId}`)
            .then(res => res.json())
            .then(details => {
                const detailsDiv = document.getElementById('node-details');
                if (details.error) {
                    detailsDiv.innerHTML = `<p>${details.error}</p>`;
                } else {
                    let content = '';
                    for (const [key, value] of Object.entries(details)) {
                        content += `<strong>${key}:</strong> ${value}<br>`;
                    }
                    detailsDiv.innerHTML = content;
                }
            });
    }
    
    // --- Event Listeners ---
    document.querySelectorAll('.upload-form').forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            fetch(this.dataset.url, { method: 'POST', body: formData })
                .then(res => res.json())
                .then(result => {
                    alert(result.message || result.error);
                    if(result.success) location.reload();
                });
        });
    });

    document.getElementById('analyze-btn').addEventListener('click', () => {
        const activeLayers = [];
        map.eachLayer(layer => {
            const layerName = Object.keys(geojsonLayers).find(key => geojsonLayers[key] === layer);
            if (layerName) activeLayers.push(layerName);
        });

        fetch('/analyze_network', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ active_layers: activeLayers })
        }).then(res => res.json()).then(result => {
            alert(result.message);
            fetchAndDrawGraph(); // Refresh graph to update scores internally
        });
    });

    document.getElementById('simulate-btn').addEventListener('click', () => {
        const nodeId = document.getElementById('node-to-fail').value;
        const deep = document.getElementById('deep-prop').checked;
        if (!nodeId) {
            alert("Please select a node to fail.");
            return;
        }
        
        // Reset node colors first
        assetMarkers.eachLayer(m => m.setStyle({ fillColor: m.options.originalColor }));

        fetch('/simulate_failure', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ node_id: nodeId, deep_propagation: deep })
        }).then(res => res.json()).then(result => {
            if (result.error) {
                alert(result.error);
            } else {
                assetMarkers.eachLayer(marker => {
                    if (result.failed_nodes.includes(marker.nodeId)) {
                        marker.setStyle({ fillColor: 'black' });
                    }
                });
                alert(`Simulation complete. ${result.failed_nodes.length} nodes failed.`);
            }
        });
    });
    
    document.getElementById('node-explorer-input').addEventListener('change', (e) => {
        fetchNodeDetails(e.target.value);
    });

    // --- Initial Load ---
    fetchAndDrawGraph();
    // Load existing GeoJSON layers
    fetch('/get_geojson_layers').then(res => res.json()).then(layers => {
        layers.forEach(layerFile => {
            fetch(`/uploads/geojson/${layerFile}`).then(res => res.json()).then(data => {
                const layer = L.geoJSON(data, { style: { color: '#ff7800', weight: 2 } });
                geojsonLayers[layerFile] = layer;
                layerControl.addOverlay(layer, layerFile);
            });
        });
    });

</script>
</body>
</html>
"""

# --- Flask Backend Routes ---

@app.route('/')
def index():
    return render_template_string(HTML_TEMPLATE)

@app.route('/upload_assets', methods=['POST'])
def upload_assets():
    # ... (upload logic for assets)
    return jsonify({"success": True, "message": "Assets uploaded!"})

@app.route('/upload_dependencies', methods=['POST'])
def upload_dependencies():
    # ... (upload logic for dependencies)
    return jsonify({"success": True, "message": "Dependencies uploaded!"})

@app.route('/upload_geojson', methods=['POST'])
def upload_geojson():
    file = request.files.get('file')
    if file and file.filename.endswith('.geojson'):
        filepath = os.path.join(UPLOAD_FOLDERS['geojson'], file.filename)
        file.save(filepath)
        return jsonify({"success": True, "message": f"GeoJSON layer '{file.filename}' uploaded."})
    return jsonify({"success": False, "error": "Invalid file."})

@app.route('/revert', methods=['POST'])
def revert():
    # ... (revert logic)
    return redirect(url_for('index'))

@app.route('/get_graph_data')
def get_graph_data():
    if 'graph' not in session:
        return jsonify({'nodes': [], 'edges': []})
    G = session['graph']
    nodes = [{'id': n, **d} for n, d in G.nodes(data=True)]
    edges = [{'source': u, 'target': v} for u, v in G.edges()]
    return jsonify({'nodes': nodes, 'edges': edges})

@app.route('/get_node_details/<node_id>')
def get_node_details(node_id):
    if 'graph' not in session or not session['graph'].has_node(node_id):
        return jsonify({"error": "Node not found."})
    return jsonify(session['graph'].nodes[node_id])

@app.route('/get_geojson_layers')
def get_geojson_layers():
    files = os.listdir(UPLOAD_FOLDERS['geojson'])
    return jsonify([f for f in files if f.endswith('.geojson')])

@app.route('/analyze_network', methods=['POST'])
def analyze_network():
    if 'graph' not in session:
        return jsonify({"error": "No graph loaded."})
    
    G = session['graph']
    active_layers = request.json.get('active_layers', [])
    
    G = compute_dependency_score(G)
    G = compute_redundancy_score(G)
    G = compute_exposure_score(G, active_layers)
    G = compute_asset_score(G)
    
    session['graph'] = G
    return jsonify({"message": "Network analysis complete. Scores have been updated."})

@app.route('/simulate_failure', methods=['POST'])
def simulate_failure_route():
    if 'graph' not in session:
        return jsonify({"error": "No graph loaded."})
    
    data = request.json
    node_id = data.get('node_id')
    deep = data.get('deep_propagation', False)
    
    G = session['graph'].copy()
    if not G.has_node(node_id):
        return jsonify({"error": "Node not found in graph."})

    failed_nodes = [node_id]
    
    if deep:
        # Full cascade
        descendants = nx.descendants(G, node_id)
        failed_nodes.extend(list(descendants))
    else:
        # Immediate successors only
        failed_nodes.extend(list(G.successors(node_id)))
        
    return jsonify({"failed_nodes": list(set(failed_nodes))})


# --- Helper for building the graph from session files ---
def build_graph_from_session():
    G = nx.DiGraph()
    # Logic to read asset and dependency files from session and build G
    # This is a simplified placeholder
    asset_files = session.get('asset_files', [])
    dep_files = session.get('dep_files', [])
    
    if asset_files:
        # Load latest asset file
        df_assets = pd.read_csv(asset_files[-1])
        for _, row in df_assets.iterrows():
            G.add_node(row['Asset_ID'], **row.to_dict())
    
    if dep_files:
        # Load latest dependency file
        df_deps = pd.read_csv(dep_files[-1])
        for _, row in df_deps.iterrows():
            if G.has_node(row['from_asset']) and G.has_node(row['to_asset']):
                G.add_edge(row['from_asset'], row['to_asset'], 
                           dependency_score=row.get('dependency_score'))
                # Also add as node attribute
                nx.set_node_attributes(G, {row['from_asset']: {'dependency_score': row.get('dependency_score')}})

    session['graph'] = G
    return G

@app.before_request
def before_request_func():
    if 'graph' not in session and request.endpoint not in ['index', 'upload_assets']:
        build_graph_from_session()


if __name__ == '__main__':
    app.run(debug=True, port=5003)
