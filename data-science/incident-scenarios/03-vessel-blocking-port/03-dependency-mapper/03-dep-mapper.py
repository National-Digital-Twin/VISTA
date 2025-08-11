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
        
        /* Styles to reduce the size of the update section */
        #update-section {
            padding: 15px;
            margin-bottom: 15px;
        }
        #update-section h2 {
            font-size: 1.1rem;
            margin-bottom: 10px;
        }
        #update-section h3 {
            font-size: 1rem;
        }
        #update-section p {
            font-size: 0.8rem;
            margin-bottom: 5px;
        }
    </style>
</head>
<body>

<div class="main-layout">
    <div class="sidebar">
        <div class="header">
            <h1>VISTA Asset Dependency Mapper</h1>
        </div>

        <!-- Initial Upload Form -->
        <div id="initial-upload-section" class="form-section">
            <form method="post" enctype="multipart/form-data" action="{{ url_for('index') }}">
                <h2>Upload Initial Asset CSV</h2>
                <p>Upload a CSV file with columns: 'Asset_ID', 'Asset_Type', 'lat', 'long', and 'criticality_score'.</p>
                <input type="file" name="file" accept=".csv" required>
                <button type="submit" class="btn">Upload and Display</button>
            </form>
        </div>
        
        <!-- Update and Revert Controls -->
        <div id="update-section" class="form-section" style="display: none;">
            <h2>Update Data</h2>
            <form action="{{ url_for('update_view') }}" method="post" enctype="multipart/form-data" style="margin-bottom: 1rem;">
                <h3>Merge Additional File</h3>
                <p>Upload another CSV to merge with the current view.</p>
                <input type="file" name="additional_file" accept=".csv" required>
                <button type="submit" class="btn btn-update">Update View</button>
            </form>
            <hr>
            <form action="{{ url_for('revert_changes') }}" method="post" style="margin-top: 1rem;">
                <h3>Revert Changes</h3>
                <p>Revert to the original uploaded file.</p>
                <button type="submit" class="btn btn-revert">Revert to Original</button>
            </form>
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
    var new_asset_ids = {{ new_asset_ids|tojson }}; // List of new asset IDs from the backend
    var markers = {};
    var connections = [];
    var selectedMarker = null;

    if (assets && assets.length > 0) {
        // If assets are loaded, show the update/export controls and hide the initial upload form
        document.getElementById('initial-upload-section').style.display = 'none';
        document.getElementById('update-section').style.display = 'block';
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

    if (assets) {
        assets.forEach(function(asset) {
            var color;
            // Check if the asset is in the list of new assets
            if (new_asset_ids && new_asset_ids.includes(asset.Asset_ID)) {
                color = 'green'; // New assets are green
            } else {
                color = getMarkerColor(asset.Asset_Type); // Existing logic for original assets
            }

            var marker = L.circleMarker([asset.lat, asset.long], {
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
                    // Use the marker's current color to reset it, which could be green
                    const originalColor = e.target.options.color;
                    selectedMarker.setStyle({ weight: 1, color: getMarkerColor(selectedMarker.asset_type) });

                    if (selectedMarker !== e.target) {
                        var fromAsset = selectedMarker.asset_id;
                        var toAsset = e.target.asset_id;
                        var latlngs = [selectedMarker.getLatLng(), e.target.getLatLng()];
                        var polyline = L.polyline(latlngs, { color: 'blue', dashArray: '5, 10' }).addTo(map);
                        
                        var decorator = L.polylineDecorator(polyline, {
                            patterns: [{offset: '100%', repeat: 0, symbol: L.Symbol.arrowHead({pixelSize: 15, polygon: false, pathOptions: {stroke: true, color: 'blue'}})}]
                        }).addTo(map);

                        const connection = { from: fromAsset, to: toAsset, line: polyline, decorator: decorator };
                        connections.push(connection);

                        polyline.on('click', function() {
                            map.removeLayer(polyline);
                            map.removeLayer(decorator);
                            const index = connections.findIndex(c => c.line === polyline);
                            if (index > -1) { connections.splice(index, 1); }
                        });
                    }
                    selectedMarker = null;
                }
            });
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

# def compute_dependency_score(G):
#     for node in G.nodes():
#         dependencies = list(G.successors(node))
#         score = sum(G.nodes[dep]['criticality_score'] for dep in dependencies if dep in G.nodes)
        
#         if score == 0: dep_score = 0
#         elif score <= 3: dep_score = 1
#         elif score <= 6: dep_score = 2
#         else: dep_score = 3
#         G.nodes[node]['dependency_score'] = dep_score
#     return G

def compute_dependency_score(G):
    """
    Computes the dependency score based on the average criticality of connected nodes.
    The score is the average criticality of the nodes it depends on (successors), rounded to the nearest whole number
    
    """
    for node in G.nodes():
        dependencies = list(G.successors(node))
        num_dependencies = len(dependencies)

        if num_dependencies == 0:
            dep_score = 0
        else:
            # Sum the criticality scores of all dependent nodes
            sum_of_criticalities = sum(G.nodes[dep].get('criticality_score', 0) for dep in dependencies)
            
            # Calculate the average criticality
            dep_score = round(sum_of_criticalities / num_dependencies)
            
                
        G.nodes[node]['dependency_score'] = dep_score
    return G

@app.route('/', methods=['GET', 'POST'])
def index():
    if request.method == 'POST':
        file = request.files.get('file')
        if file and file.filename.endswith('.csv'):
            try:
                assets_df = pd.read_csv(file.stream)
                assets = assets_df.to_dict('records')
                session['original_assets'] = assets
                session['current_assets'] = assets
                session.pop('new_asset_ids', None) # Clear new asset IDs on initial upload
            except Exception as e:
                return f"Error processing CSV file: {e}. Please check the file format.", 400
            return redirect(url_for('index'))
    
    current_assets = session.get('current_assets', [])
    new_asset_ids = session.get('new_asset_ids', [])
    return render_template_string(HTML_TEMPLATE, assets=current_assets, new_asset_ids=new_asset_ids)

@app.route('/update', methods=['POST'])
def update_view():
    if 'current_assets' not in session:
        return "Please upload an initial file first.", 400
    
    file = request.files.get('additional_file')
    if file and file.filename.endswith('.csv'):
        try:
            current_df = pd.DataFrame(session['current_assets'])
            original_ids = set(current_df['Asset_ID'])

            additional_df = pd.read_csv(file.stream)

            # Merge dataframes, keeping the new data in case of duplicate Asset_IDs
            merged_df = pd.concat([current_df, additional_df]).drop_duplicates(subset=['Asset_ID'], keep='last')
            
            # Identify the new assets that were not in the original set
            merged_ids = set(merged_df['Asset_ID'])
            new_ids = list(merged_ids - original_ids)

            session['current_assets'] = merged_df.to_dict('records')
            session['new_asset_ids'] = new_ids # Store the list of new IDs

        except Exception as e:
            return f"Error processing additional file: {e}.", 400
    
    return redirect(url_for('index'))

@app.route('/revert', methods=['POST'])
def revert_changes():
    if 'original_assets' in session:
        session['current_assets'] = session['original_assets']
        session.pop('new_asset_ids', None) # Clear new asset IDs on revert
    else:
        # Clear data if original is somehow lost
        session.pop('current_assets', None)
        session.pop('new_asset_ids', None)
    return redirect(url_for('index'))

def process_connections(connections):
    assets_data = session.get('current_assets', [])
    if not assets_data:
        return None, None

    assets = {asset['Asset_ID']: asset for asset in assets_data}
    G = nx.DiGraph()

    for asset_id, asset_info in assets.items():
        G.add_node(asset_id, criticality_score=int(asset_info.get('criticality_score', 0)))

    for conn in connections:
        G.add_edge(conn['from'], conn['to'])
        
    G = compute_dependency_score(G)
    return assets, G

@app.route('/export_csv', methods=['POST'])
def export_csv():
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
    app.run(debug=True, port=5001)
