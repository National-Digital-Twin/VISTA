import csv
import io
import json
import networkx as nx
import pandas as pd
from flask import Flask, render_template_string, request, Response, session, redirect, url_for
from flask_session import Session
import os

# Initialize Flask App
app = Flask(__name__)

# Configure session to use filesystem. This stores session data on the server's disk.
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
app.config['SECRET_KEY'] = os.urandom(24)  # Secret key for signing the session cookie
Session(app)

# HTML template for the user interface
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>VISTA Asset Dependency Mapper</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <script src="https://unpkg.com/leaflet-polylinedecorator@1.6.0/dist/leaflet.polylineDecorator.js"></script>
    <style>
        html, body { 
            height: 100%; 
            margin: 0; 
            font-family: Arial, sans-serif; 
            background-color: #f4f4f4;
            overflow: hidden; /* Prevent body scrollbars */
        }
        .main-layout {
            display: flex;
            height: 100vh;
        }
        .sidebar {
            width: 35%;
            padding: 20px;
            background-color: #f4f4f4;
            overflow-y: auto; /* Allow sidebar to scroll if content overflows */
            box-shadow: 2px 0 5px rgba(0,0,0,0.1);
            z-index: 1000;
        }
        .map-container {
            width: 65%;
            height: 100vh;
        }
        #map { 
            height: 100%; 
            width: 100%;
        }
        .header { text-align: center; margin-bottom: 20px; }
        .form-section { margin-bottom: 20px; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
        .info-text { text-align: center; margin-top: 10px; color: #555; }
        .btn-group { margin-top: 20px; text-align: center; }
        .btn {
            background-color: #4CAF50;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            margin: 5px;
            width: 100%;
        }
        .btn:hover { opacity: 0.9; }
        .btn-update { background-color: #ff9800; }
        .btn-revert { background-color: #f44336; }
        .btn-export-csv { background-color: #008CBA; }
        .btn-export-geojson { background-color: #555; }
        input[type="file"] { margin-bottom: 10px; width: 100%; }
    </style>
</head>
<body>

<div class="main-layout">
    <div class="sidebar">
        <div class="header">
            <h1>VISTA Asset Dependency Mapper</h1>
        </div>

        <!-- Forms Section -->
        <div id="forms-section" class="form-section">
            <div id="initial-upload-section">
                <form method="post" enctype="multipart/form-data" action="{{ url_for('index') }}">
                    <h2>Upload Initial Asset CSV</h2>
                    <p>Upload a CSV with asset locations ('Asset_ID', 'lat', 'long', etc.).</p>
                    <input type="file" name="file" accept=".csv" required>
                    <button type="submit" class="btn">Upload Assets</button>
                </form>
            </div>
            
            <div id="dependency-upload-section" style="display: none; margin-top: 20px;">
                 <hr>
                <form method="post" enctype="multipart/form-data" action="{{ url_for('load_dependencies') }}">
                    <h2>Load Existing Dependencies</h2>
                    <p>Upload a CSV with existing connections ('from_asset', 'to_asset').</p>
                    <input type="file" name="dependency_file" accept=".csv" required>
                    <button type="submit" class="btn btn-update">Load Connections</button>
                </form>
            </div>
        </div>

        <p class="info-text">Click an asset to select it, then click another to create a connection. Click a connection line to delete it.</p>

        <div id="export-section" class="btn-group" style="display: none;">
            <button id="export-csv" class="btn btn-export-csv">Export Connections (CSV)</button>
            <button id="export-geojson" class="btn btn-export-geojson">Export Connections (GeoJSON)</button>
        </div>
    </div>

    <div class="map-container">
        <div id="map"></div>
    </div>
</div>

<script>
    var map = L.map('map').setView([50.7, -1.2], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    var assets = {{ assets|tojson }};
    var loaded_connections = {{ loaded_connections|tojson }};
    var markers = {};
    var connections = [];
    var selectedMarker = null;

    if (assets && assets.length > 0) {
        // If assets are loaded, show the dependency upload and export controls
        document.getElementById('dependency-upload-section').style.display = 'block';
        document.getElementById('export-section').style.display = 'block';
    }

    function getMarkerColor(assetType) {
        switch (assetType) {
            case 'Hospital': return 'purple';
            case 'Named Junction': return 'green';
            case 'PowerGen/Substation': return 'red';
            default: return 'blue';
        }
    }

    function drawAndStoreConnection(fromId, toId) {
        const fromMarker = markers[fromId];
        const toMarker = markers[toId];

        if (!fromMarker || !toMarker) {
            console.warn(`Could not draw connection: ${fromId} -> ${toId}. One or both assets not found.`);
            return;
        }

        const latlngs = [fromMarker.getLatLng(), toMarker.getLatLng()];
        const polyline = L.polyline(latlngs, { color: 'blue', dashArray: '5, 10' }).addTo(map);
        
        const decorator = L.polylineDecorator(polyline, {
            patterns: [{offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true, color: 'blue'}})}]
        }).addTo(map);

        const connection = { from: fromId, to: toId, line: polyline, decorator: decorator };
        connections.push(connection);

        // Add click event with confirmation for deletion
        polyline.on('click', function() {
            if (confirm(`Are you sure you want to delete the connection from ${fromId} to ${toId}?`)) {
                map.removeLayer(polyline);
                map.removeLayer(decorator);
                const index = connections.findIndex(c => c.line === polyline);
                if (index > -1) { connections.splice(index, 1); }
            }
        });
    }

    if (assets) {
        assets.forEach(function(asset) {
            const color = getMarkerColor(asset.Asset_Type);
            const marker = L.circleMarker([asset.lat, asset.long], {
                radius: 8, fillColor: color, color: color, weight: 1, opacity: 1, fillOpacity: 0.8
            }).addTo(map);
            
            marker.asset_id = asset.Asset_ID;
            marker.asset_type = asset.Asset_Type;
            marker.bindPopup(`<b>${asset.Asset_ID}</b><br>Type: ${asset.Asset_Type}<br>Criticality: ${asset.criticality_score}`);
            marker.bindTooltip(asset.Asset_ID);
            markers[asset.Asset_ID] = marker;

            marker.on('click', function(e) {
                if (!selectedMarker) {
                    selectedMarker = e.target;
                    selectedMarker.setStyle({ weight: 5, color: 'yellow' });
                } else {
                    const originalColor = getMarkerColor(selectedMarker.asset_type);
                    selectedMarker.setStyle({ weight: 1, color: originalColor });

                    if (selectedMarker !== e.target) {
                        drawAndStoreConnection(selectedMarker.asset_id, e.target.asset_id);
                    }
                    selectedMarker = null;
                }
            });
        });
    }

    // Draw pre-loaded connections from a dependency file
    if (loaded_connections && loaded_connections.length > 0) {
        loaded_connections.forEach(function(conn) {
            drawAndStoreConnection(conn.from_asset, conn.to_asset);
        });
    }


    async function exportData(url, connections) {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ connections: connections.map(c => ({from: c.from, to: c.to})) })
        });
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = response.headers.get('Content-Disposition').split('filename=')[1].replaceAll('"', '');
        document.body.appendChild(a);
        a.click();
        a.remove();
    }

    document.getElementById('export-csv').addEventListener('click', function() {
        if (connections.length > 0) { exportData('/export_csv', connections); } 
        else { alert("No connections made yet!"); }
    });

    document.getElementById('export-geojson').addEventListener('click', function() {
        if (connections.length > 0) { exportData('/export_geojson', connections); }
        else { alert("No connections made yet!"); }
    });
</script>
</body>
</html>
"""

def compute_dependency_score(G):
    """
    Computes the dependency score based on the average criticality of connected nodes,
    rounded to the nearest whole number.
    """
    for node in G.nodes():
        dependencies = list(G.successors(node))
        num_dependencies = len(dependencies)
        if num_dependencies == 0:
            dep_score = 0
        else:
            sum_of_criticalities = sum(G.nodes[dep].get('criticality_score', 0) for dep in dependencies)
            dep_score = sum_of_criticalities / num_dependencies
            dep_score = f"{dep_score:.2f}" #format to two decimal places
            
        G.nodes[node]['dependency_score'] = dep_score
    return G

@app.route('/', methods=['GET', 'POST'])
def index():
    """Handles the initial upload of the main asset file."""
    if request.method == 'POST':
        file = request.files.get('file')
        if file and file.filename.endswith('.csv'):
            try:
                assets_df = pd.read_csv(file.stream)
                assets = assets_df.to_dict('records')
                session['current_assets'] = assets
                session.pop('loaded_connections', None) # Clear old connections on new asset upload
            except Exception as e:
                return f"Error processing asset CSV file: {e}. Please check the file format.", 400
            return redirect(url_for('index'))
    
    current_assets = session.get('current_assets', [])
    loaded_connections = session.get('loaded_connections', [])
    return render_template_string(HTML_TEMPLATE, assets=current_assets, loaded_connections=loaded_connections)

@app.route('/load_dependencies', methods=['POST'])
def load_dependencies():
    """Handles the upload of a dependency map CSV file."""
    if 'current_assets' not in session:
        return "Please upload an initial asset file first.", 400
    
    file = request.files.get('dependency_file')
    if file and file.filename.endswith('.csv'):
        try:
            # Read the dependency file
            dep_df = pd.read_csv(file.stream)
            # Ensure required columns exist
            if 'from_asset' not in dep_df.columns or 'to_asset' not in dep_df.columns:
                raise ValueError("Dependency file must contain 'from_asset' and 'to_asset' columns.")
            
            # Store connections in the session
            session['loaded_connections'] = dep_df.to_dict('records')
        except Exception as e:
            return f"Error processing dependency file: {e}.", 400
            
    return redirect(url_for('index'))

def process_connections(connections):
    """Prepares the graph and asset data for export."""
    assets_data = session.get('current_assets', [])
    if not assets_data:
        return None, None

    assets = {asset['Asset_ID']: asset for asset in assets_data}
    G = nx.DiGraph()

    for asset_id, asset_info in assets.items():
        # Ensure criticality_score is treated as an integer
        G.add_node(asset_id, criticality_score=int(asset_info.get('criticality_score', 0)))

    for conn in connections:
        G.add_edge(conn['from'], conn['to'])
        
    G = compute_dependency_score(G)
    return assets, G

@app.route('/export_csv', methods=['POST'])
def export_csv():
    """Exports the current connections to a CSV file."""
    data = request.json
    connections = data.get('connections', [])
    assets, G = process_connections(connections)

    if not assets or not G:
        return "No asset data found.", 400

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['from_asset', 'to_asset', 'connection', 'dependency_score'])

    for conn in connections:
        from_asset_id = conn['from']
        if from_asset_id in G.nodes:
            dependency_score = G.nodes[from_asset_id]['dependency_score']
            writer.writerow([from_asset_id, conn['to'], f"{from_asset_id}-->{conn['to']}", dependency_score])

    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-disposition": "attachment; filename=connections.csv"}
    )

@app.route('/export_geojson', methods=['POST'])
def export_geojson():
    """Exports the current connections to a GeoJSON file."""
    data = request.json
    connections = data.get('connections', [])
    assets, G = process_connections(connections)

    if not assets or not G:
        return "No asset data found.", 400
    
    features = []
    for conn in connections:
        from_asset_id, to_asset_id = conn['from'], conn['to']
        from_asset, to_asset = assets.get(from_asset_id), assets.get(to_asset_id)

        if from_asset and to_asset and from_asset_id in G.nodes:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[float(from_asset['long']), float(from_asset['lat'])], [float(to_asset['long']), float(to_asset['lat'])]]
                },
                "properties": {
                    "from_asset": from_asset_id,
                    "to_asset": to_asset_id,
                    "dependency_score": G.nodes[from_asset_id]['dependency_score']
                }
            }
            features.append(feature)
            
    geojson_data = {"type": "FeatureCollection", "features": features}

    return Response(
        json.dumps(geojson_data, indent=2),
        mimetype="application/json",
        headers={"Content-disposition": "attachment; filename=connections.geojson"}
    )

if __name__ == '__main__':
    app.run(debug=True, port=5002)
