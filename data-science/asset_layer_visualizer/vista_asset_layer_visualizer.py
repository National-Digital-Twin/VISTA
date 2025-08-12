import os
import glob
import json
import csv
from flask import Flask, render_template_string, request, jsonify, send_from_directory

# --- Configuration ---
# Create folders for layer files if they don't exist.
GEOJSON_FOLDER = 'geojson_layers'
ASSET_FOLDER = 'asset_layers'
if not os.path.exists(GEOJSON_FOLDER):
    os.makedirs(GEOJSON_FOLDER)
if not os.path.exists(ASSET_FOLDER):
    os.makedirs(ASSET_FOLDER)

# --- Flask App Initialization ---
app = Flask(__name__)
app.config['GEOJSON_FOLDER'] = GEOJSON_FOLDER
app.config['ASSET_FOLDER'] = ASSET_FOLDER

# --- HTML and JavaScript Template ---
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>VISTA GeoJSON & Asset Visualizer</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; display: flex; flex-direction: column; height: 100vh; }
        .header { text-align: center; padding: 10px; background-color: white; box-shadow: 0 2px 4px rgba(0,0,0,0.1); z-index: 1000;}
        .container { display: flex; flex: 1; overflow: hidden; }
        #map { width: 100%; height: 100%; }
        .sidebar { width: 300px; background: white; padding: 15px; overflow-y: auto; box-shadow: 2px 0 5px rgba(0,0,0,0.1); z-index: 1000; }
        h2 { margin-top: 0; border-bottom: 1px solid #eee; padding-bottom: 10px; }
        .btn {
            background-color: #4CAF50;
            color: white;
            padding: 10px 15px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }
        .btn:hover { background-color: #45a049; }
        input[type="file"] { width: 100%; }
        #layer-control-container label {
            display: block;
            padding: 8px;
            border-radius: 4px;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        #layer-control-container label:hover {
            background-color: #f0f0f0;
        }
        #layer-control-container input {
            margin-right: 8px;
        }
        hr { border: 0; border-top: 1px solid #eee; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>VISTA Asset and Exposure Layer Visualizer</h1>
    </div>
    <div class="container">
        <div class="sidebar">
            <h2>Upload GeoJSON Layer</h2>
            <form id="upload-geojson-form">
                <input type="file" name="file" accept=".geojson" required>
                <button type="submit" class="btn">Upload GeoJSON</button>
            </form>
            <div id="message-geojson" class="message-area"></div>
            <hr>
            <h2>Upload Asset Layer</h2>
            <form id="upload-asset-form">
                <input type="file" name="file" accept=".csv" required>
                <button type="submit" class="btn">Upload Assets (CSV)</button>
            </form>
            <div id="message-asset" class="message-area"></div>
            <hr>
            <h2>Layers</h2>
            <div id="layer-control-container">
                <!-- Layer toggles will be dynamically inserted here -->
            </div>
        </div>
        <div id="map"></div>
    </div>

<script>
    // Initialize Leaflet map centered on the Isle of Wight
    var map = L.map('map').setView([50.69, -1.29], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Store references to loaded layers
    const loadedLayers = {};
    const layerContainer = document.getElementById('layer-control-container');

    // --- Layer Styling ---
    function getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    function getAssetColor(assetId) {
        if (assetId.startsWith('PGS')) return 'red';
        if (assetId.startsWith('JN')) return 'green';
        if (assetId.startsWith('HS')) return 'purple';
        return 'blue';
    }
    
    // --- Layer Management ---
    function addLayerToControl(layerName, layer) {
        loadedLayers[layerName] = layer;
        const isVisible = map.hasLayer(layer);

        const controlDiv = document.createElement('div');
        const checkboxId = `checkbox-${layerName.replace(/[^a-zA-Z0-9]/g, '')}`;
        controlDiv.innerHTML = `
            <label for="${checkboxId}">
                <input type="checkbox" id="${checkboxId}" ${isVisible ? 'checked' : ''}>
                ${layerName}
            </label>
        `;
        layerContainer.appendChild(controlDiv);

        document.getElementById(checkboxId).addEventListener('change', function() {
            if (this.checked) {
                map.addLayer(layer);
            } else {
                map.removeLayer(layer);
            }
        });
    }

    async function loadGeoJsonLayer(fileName) {
        try {
            const response = await fetch(`/geojson/${fileName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            const layerStyle = { color: getRandomColor(), weight: 2, opacity: 0.8, fillOpacity: 0.2 };
            const geoJsonLayer = L.geoJSON(data, {
                style: layerStyle,
                onEachFeature: (feature, layer) => {
                    if (feature.properties) {
                        let popupContent = '';
                        for (const key in feature.properties) {
                            popupContent += `<b>${key}:</b> ${feature.properties[key]}<br>`;
                        }
                        layer.bindPopup(popupContent);
                    }
                }
            }).addTo(map);
            addLayerToControl(fileName, geoJsonLayer);
        } catch (error) {
            console.error(`Error loading GeoJSON layer ${fileName}:`, error);
        }
    }

    async function loadAssetLayer(fileName) {
        try {
            const response = await fetch(`/assets/${fileName}`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const assets = await response.json();

            const assetLayerGroup = L.layerGroup();
            assets.forEach(asset => {
                if (asset.lat && asset.long) {
                    const color = getAssetColor(asset.Asset_ID || '');
                    const tooltipContent = `
                        <b>ID:</b> ${asset.Asset_ID || 'N/A'}<br>
                        <b>Type:</b> ${asset.Asset_Type || 'N/A'}<br>
                        <b>Name:</b> ${asset.Asset_Name || 'N/A'}<br>
                        <b>Criticality:</b> ${asset.criticality_score || 'N/A'}
                    `;
                    const marker = L.circleMarker([parseFloat(asset.lat), parseFloat(asset.long)], {
                        radius: 5,
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.7
                    }).bindTooltip(tooltipContent);
                    assetLayerGroup.addLayer(marker);
                }
            });
            assetLayerGroup.addTo(map);
            addLayerToControl(fileName, assetLayerGroup);
        } catch (error) {
            console.error(`Error loading asset layer ${fileName}:`, error);
        }
    }

    // --- Initial Layer Loading ---
    const initialGeoJsonLayers = {{ initial_geojson_layers|tojson }};
    initialGeoJsonLayers.forEach(fileName => loadGeoJsonLayer(fileName));

    const initialAssetLayers = {{ initial_asset_layers|tojson }};
    initialAssetLayers.forEach(fileName => loadAssetLayer(fileName));

    // --- File Upload Handling ---
    async function handleUpload(form, url, messageElementId) {
        const formData = new FormData(form);
        const messageArea = document.getElementById(messageElementId);
        messageArea.textContent = 'Uploading...';
        messageArea.style.color = 'orange';

        try {
            const response = await fetch(url, { method: 'POST', body: formData });
            const result = await response.json();

            if (response.ok) {
                messageArea.style.color = 'green';
                messageArea.textContent = result.message;
                // Load the new layer based on its type
                if (url.includes('geojson')) {
                    await loadGeoJsonLayer(result.filename);
                } else {
                    await loadAssetLayer(result.filename);
                }
            } else {
                throw new Error(result.error || 'File upload failed');
            }
        } catch (error) {
            messageArea.style.color = 'red';
            messageArea.textContent = `Error: ${error.message}`;
        }
        setTimeout(() => { messageArea.textContent = ''; }, 5000);
    }

    document.getElementById('upload-geojson-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleUpload(this, '/upload_geojson', 'message-geojson');
    });

    document.getElementById('upload-asset-form').addEventListener('submit', function(e) {
        e.preventDefault();
        handleUpload(this, '/upload_asset', 'message-asset');
    });
</script>
</body>
</html>
"""

# --- Flask Backend Routes ---
@app.route('/')
def index():
    """Renders the main map page and lists available GeoJSON and CSV files."""
    geojson_files = [os.path.basename(f) for f in glob.glob(f"{app.config['GEOJSON_FOLDER']}/*.geojson")]
    asset_files = [os.path.basename(f) for f in glob.glob(f"{app.config['ASSET_FOLDER']}/*.csv")]
    return render_template_string(HTML_TEMPLATE, initial_geojson_layers=geojson_files, initial_asset_layers=asset_files)

@app.route('/geojson/<path:filename>')
def serve_geojson(filename):
    """Serves a specific GeoJSON file."""
    return send_from_directory(app.config['GEOJSON_FOLDER'], filename)

@app.route('/assets/<path:filename>')
def serve_asset_csv(filename):
    """Serves a CSV asset file as JSON."""
    file_path = os.path.join(app.config['ASSET_FOLDER'], filename)
    try:
        with open(file_path, mode='r', encoding='utf-8-sig') as csv_file:
            csv_reader = csv.DictReader(csv_file)
            data = list(csv_reader)
            return jsonify(data)
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def upload_logic(request, folder_config, extension):
    """Generic logic for handling file uploads."""
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    if file and file.filename.endswith(extension):
        filename = file.filename
        folder_path = app.config[folder_config]
        file_path = os.path.join(folder_path, filename)
        
        if os.path.exists(file_path):
            return jsonify({"error": f"File '{filename}' already exists."}), 409
            
        file.save(file_path)
        return jsonify({"message": "File uploaded successfully!", "filename": filename}), 201
    else:
        return jsonify({"error": f"Invalid file type. Please upload a {extension} file."}), 400

@app.route('/upload_geojson', methods=['POST'])
def upload_geojson_file():
    """Handles GeoJSON file uploads."""
    return upload_logic(request, 'GEOJSON_FOLDER', '.geojson')

@app.route('/upload_asset', methods=['POST'])
def upload_asset_file():
    """Handles asset CSV file uploads."""
    return upload_logic(request, 'ASSET_FOLDER', '.csv')

# --- Main Execution ---
if __name__ == '__main__':
    app.run(debug=True, port=5001)
