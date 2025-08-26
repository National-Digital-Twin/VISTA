from flask import Flask, request, jsonify, render_template_string, send_from_directory
import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
from shapely.ops import unary_union
import networkx as nx
import os
import glob
import json

# --- Flask App Setup ---
app = Flask(__name__)
# Define the folder where data files are stored
app.config['DATA_FOLDER'] = 'data'
os.makedirs(app.config['DATA_FOLDER'], exist_ok=True)

# Global variable to store the graph and scores
network_data = {
    "graph": None,
    "network_resilience": 0.0
}

# --- Core Data Processing and Network Functions ---

def haversine_distance(lat1, lon1, lat2, lon2):
    """Calculate the great-circle distance between two points."""
    R = 6371.0
    lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(np.radians, [lat1, lon1, lat2, lon2])
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = np.sin(dlat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
    return R * c

def compute_redundancy_score(df):
    """
    Computes the Redundancy score for each asset in the DataFrame.
    """
    asset_coordinates = {row.Asset_ID: (row.lat, row.long) for index, row in df.iterrows()}
    scores = []
    for index, row in df.iterrows():
        backup_id = row['backup_asset_id']
        if pd.isna(backup_id) or backup_id not in asset_coordinates:
            scores.append(3)
            continue
        lat1, lon1 = asset_coordinates[row['Asset_ID']]
        lat2, lon2 = asset_coordinates[backup_id]
        distance = haversine_distance(lat1, lon1, lat2, lon2)
        if distance < 2:
            scores.append(0)
        elif 2 <= distance <= 5:
            scores.append(1)
        else: # distance > 5
            scores.append(2)
    df['redundancy_score'] = scores
    return df

def compute_exposure_score(assets_df, flood_files, heat_files=None, landslide_files=None):
    """
    Version 2 updated based on client requirement 060825
    Computes exposure score based on asset intersection with hazard layers and
    adds it as a new column to the assets_df.
    """
    exposure_scores = []

    # Load and combine hazard layers
    try:
        if flood_files:
            flood_layers = [gpd.read_file(f) for f in flood_files]
            if flood_layers:
                all_flood_gdf = pd.concat(flood_layers, ignore_index=True)
                flood_geom = all_flood_gdf.geometry.unary_union
            else:
                flood_geom = None
        else:
            flood_geom = None
    except Exception as e:
        print(f"Could not process flood files: {e}")
        flood_geom = None

    heat_geom = None
    if heat_files:
        try:
            heat_layers = [gpd.read_file(f) for f in heat_files]
            if heat_layers:
                all_heat_gdf = pd.concat(heat_layers, ignore_index=True)
                heat_geom = all_heat_gdf.geometry.unary_union
        except Exception as e:
            print(f"Could not process heat files: {e}")
            heat_geom = None

    landslide_geom = None
    if landslide_files:
        try:
            landslide_layers = [gpd.read_file(f) for f in landslide_files]
            if landslide_layers:
                all_landslide_gdf = pd.concat(landslide_layers, ignore_index=True)
                landslide_geom = all_landslide_gdf.geometry.unary_union
        except Exception as e:
            print(f"Could not process landslide files: {e}")
            landslide_geom = None

    # Create GeoDataFrame for assets
    geometry = [Point(xy) for xy in zip(assets_df['long'], assets_df['lat'])]
    assets_gdf = gpd.GeoDataFrame(assets_df, geometry=geometry, crs="EPSG:4326")
    assets_gdf_proj = assets_gdf.to_crs("EPSG:27700")

    flood_geom_proj = None
    if flood_geom and not flood_geom.is_empty:
        # Reproject the combined flood geometry for distance calculations
        flood_geom_proj = gpd.GeoSeries([flood_geom], crs="EPSG:4326").to_crs("EPSG:27700").unary_union

    for index, asset in assets_gdf.iterrows():
        asset_geom = asset.geometry

        intersects_flood = flood_geom and not flood_geom.is_empty and asset_geom.intersects(flood_geom)
        intersects_heat = heat_geom and not heat_geom.is_empty and asset_geom.intersects(heat_geom)
        intersects_landslide = landslide_geom and not landslide_geom.is_empty and asset_geom.intersects(landslide_geom)

        score = 0
        if intersects_flood:
            if intersects_heat or intersects_landslide:
                score = 3
            else:
                score = 2
        elif flood_geom_proj:
            asset_geom_proj = assets_gdf_proj.loc[index].geometry
            distance_to_flood = asset_geom_proj.distance(flood_geom_proj)
            if distance_to_flood <= 500:
                score = 1

        exposure_scores.append(score)

    assets_df['exposure_score'] = exposure_scores
    return assets_df

def load_network_data(df):
    """Loads asset data from a DataFrame into a networkx graph."""
    G = nx.DiGraph()
    for _, row in df.iterrows():
        node_id = row['Asset_ID']
        node_attrs = row.to_dict()
        for key, value in node_attrs.items():
            if pd.isna(value): node_attrs[key] = None
        node_attrs['status'] = 'running'
        G.add_node(node_id, **node_attrs)
    return G

def load_dependency_mapping(G, mapping_path):
    """Adds weighted dependency edges to the graph."""
    df_mapping = pd.read_csv(mapping_path)
    for _, row in df_mapping.iterrows():
        from_node, to_node = row['from_asset'], row['to_asset']
        weight = row['dependency_score']
        if G.has_node(from_node) and G.has_node(to_node):
            G.add_edge(from_node, to_node, weight=weight)
    return G

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
            sum_of_criticalities = sum(G.nodes[dep].get('criticality_score', 0) for dep in dependencies)
            dep_score = round(sum_of_criticalities / num_dependencies)
        G.nodes[node]['dependency_score'] = dep_score
    return G

def compute_resilience_scores(G):
    """
    Computes the overall asset resilience score for each asset and the network average.
    """
    total_score = 0
    num_nodes = G.number_of_nodes()
    if num_nodes == 0:
        return G, 0
    for node_id in G.nodes():
        node_data = G.nodes[node_id]
        criticality = node_data.get('criticality_score', 0)
        dependency = node_data.get('dependency_score', 0)
        redundancy = node_data.get('redundancy_score', 0)
        exposure = node_data.get('exposure_score', 0)
        asset_score = criticality + dependency + redundancy + exposure
        node_data['asset_resilience_score'] = asset_score
        total_score += asset_score
    average_network_score = total_score / num_nodes
    return G, average_network_score

def simulate_failure(G, failed_node, threshold=0.5, propagate_deep=False):
    """
    Simulates a cascading failure.
    """
    print(f"Failing: {failed_node}")
    G.nodes[failed_node]["status"] = "failed"
    failed = []
    nodes_to_check = G.successors(failed_node) if not propagate_deep else nx.descendants(G, failed_node)
    for neighbor in nodes_to_check:
        try:
            path = nx.shortest_path(G, source=failed_node, target=neighbor)
            if len(path) > 1:
                min_dependency = min(G.edges[path[i], path[i+1]]["weight"] for i in range(len(path)-1))
                if min_dependency >= threshold and G.nodes[neighbor]["status"] != "failed":
                    print(f"Propagated failure to: {neighbor} (via dependency {min_dependency})")
                    G.nodes[neighbor]["status"] = "failed"
                    failed.append(neighbor)
        except (nx.NetworkXNoPath, KeyError):
            continue
    return failed

def get_node_info(G, node_id):
    """Gets attributes and edge info for a specific node."""
    if not G.has_node(node_id):
        return {"error": "Node not found"}
    info = {"attributes": G.nodes[node_id]}
    info["outgoing_dependencies"] = [
        {"target": succ, "weight": G.get_edge_data(node_id, succ).get('weight', 'N/A')}
        for succ in G.successors(node_id)
    ]
    info["incoming_dependencies"] = [
        {"source": pred, "weight": G.get_edge_data(pred, node_id).get('weight', 'N/A')}
        for pred in G.predecessors(node_id)
    ]
    return info

# --- Flask Routes ---

@app.route('/', methods=['GET'])
def index():
    with open('index.html', 'r') as f:
        html_template = f.read()
    return render_template_string(html_template)

@app.route('/get-hazard-layers', methods=['GET'])
def get_hazard_layers():
    """Scans the data directory and returns a list of available GeoJSON files."""
    data_folder = app.config['DATA_FOLDER']
    layers = {
        "flood": [os.path.basename(f) for f in glob.glob(os.path.join(data_folder, 'flood', '*.geojson'))],
        "heatstress": [os.path.basename(f) for f in glob.glob(os.path.join(data_folder, 'heatstress', '*.geojson'))],
        "landslide": [os.path.basename(f) for f in glob.glob(os.path.join(data_folder, 'landslide', '*.geojson'))]
    }
    return jsonify(layers)

@app.route('/get-geojson-layer/<layer_type>/<filename>')
def get_geojson_layer(layer_type, filename):
    """Serves a specific GeoJSON file from the correct subfolder."""
    data_folder = app.config['DATA_FOLDER']
    # Security check: ensure layer_type is one of the allowed types
    if layer_type not in ['flood', 'heatstress', 'landslide']:
        return jsonify({"error": "Invalid layer type"}), 400
    
    directory = os.path.join(data_folder, layer_type)
    
    # Security check: ensure the resolved path is within the intended directory
    if not os.path.abspath(os.path.join(directory, filename)).startswith(os.path.abspath(directory)):
        return jsonify({"error": "File path is not allowed"}), 400

    try:
        with open(os.path.join(directory, filename)) as f:
            return jsonify(json.load(f))
    except FileNotFoundError:
        return jsonify({"error": "File not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/load-network', methods=['POST'])
def load_network():
    """Reads data from local folders based on selected layers, processes it, and builds the graph."""
    data_folder = app.config['DATA_FOLDER']
    asset_path = os.path.join(data_folder, 'assets.csv')
    dep_path = os.path.join(data_folder, 'dependencies.csv')
    
    layer_files = request.get_json()
    
    flood_files = [os.path.join(data_folder, 'flood', f) for f in layer_files.get('flood', [])]
    heat_files = [os.path.join(data_folder, 'heatstress', f) for f in layer_files.get('heat', [])]
    landslide_files = [os.path.join(data_folder, 'landslide', f) for f in layer_files.get('landslide', [])]

    if not os.path.exists(asset_path) or not os.path.exists(dep_path):
        return jsonify({"error": "assets.csv or dependencies.csv not found in the 'data' folder."}), 404
    
    try:
        asset_df = pd.read_csv(asset_path)
        asset_df = compute_redundancy_score(asset_df)
        asset_df = compute_exposure_score(asset_df, flood_files, heat_files, landslide_files)
        
        G = load_network_data(asset_df)
        G = load_dependency_mapping(G, dep_path)
        G = compute_dependency_score(G)
        G, network_resilience = compute_resilience_scores(G)
        
        network_data["graph"] = G
        network_data["network_resilience"] = network_resilience

        graph_json = nx.node_link_data(G)
        return jsonify({"graph": graph_json, "network_resilience": network_resilience})
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 500

@app.route('/node_info/<node_id>', methods=['GET'])
def node_info(node_id):
    """Returns detailed information for a specific node."""
    G = network_data.get("graph")
    if G is None: return jsonify({"error": "Graph not loaded yet."}), 404
    info = get_node_info(G, node_id)
    return jsonify(info)

@app.route('/simulate/<node_id>', methods=['POST'])
def simulate(node_id):
    """Runs the failure simulation for a given node."""
    G = network_data.get("graph")
    if G is None: return jsonify({"error": "Graph not loaded yet."}), 404
    
    data = request.get_json()
    propagate_deep = data.get('propagateDeep', False)
        
    G_copy = G.copy()
    propagated_failures = simulate_failure(G_copy, failed_node=node_id, threshold=0.5, propagate_deep=propagate_deep)
    
    all_failed_nodes = [node_id] + propagated_failures
    total_failed_count = len(all_failed_nodes)
    
    return jsonify({
        "failed_nodes": all_failed_nodes,
        "total_failed": total_failed_count
    })

if __name__ == '__main__':
    app.run(debug=True, port=5001)


# from flask import Flask, request, jsonify, render_template_string
# import pandas as pd
# import numpy as np
# import geopandas as gpd
# from shapely.geometry import Point
# from shapely.ops import unary_union
# import networkx as nx
# import os
# import glob

# # --- Flask App Setup ---
# app = Flask(__name__)
# # Define the folder where data files are stored
# app.config['DATA_FOLDER'] = 'data'
# os.makedirs(app.config['DATA_FOLDER'], exist_ok=True)

# # Global variable to store the graph and scores
# network_data = {
#     "graph": None,
#     "network_resilience": 0.0
# }

# # --- Core Data Processing and Network Functions ---

# def haversine_distance(lat1, lon1, lat2, lon2):
#     """Calculate the great-circle distance between two points."""
#     R = 6371.0
#     lat1_rad, lon1_rad, lat2_rad, lon2_rad = map(np.radians, [lat1, lon1, lat2, lon2])
#     dlon = lon2_rad - lon1_rad
#     dlat = lat2_rad - lat1_rad
#     a = np.sin(dlat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2)**2
#     c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))
#     return R * c

# def compute_redundancy_score(df):
#     """
#     Computes the Redundancy score for each asset in the DataFrame.
#     """
#     asset_coordinates = {row.Asset_ID: (row.lat, row.long) for index, row in df.iterrows()}
#     scores = []
#     for index, row in df.iterrows():
#         backup_id = row['backup_asset_id']
#         if pd.isna(backup_id) or backup_id not in asset_coordinates:
#             scores.append(3)
#             continue
#         lat1, lon1 = asset_coordinates[row['Asset_ID']]
#         lat2, lon2 = asset_coordinates[backup_id]
#         distance = haversine_distance(lat1, lon1, lat2, lon2)
#         if distance < 2:
#             scores.append(0)
#         elif 2 <= distance <= 5:
#             scores.append(1)
#         else: # distance > 5
#             scores.append(2)
#     df['redundancy_score'] = scores
#     return df

# def compute_exposure_score(assets_df, flood_files, heat_files=None, landslide_files=None):
#     """
#     Version 2 updated based on client requirement 060825
#     Computes exposure score based on asset intersection with hazard layers and
#     adds it as a new column to the assets_df.
#     """
#     exposure_scores = []

#     # Load and combine hazard layers using the recommended union_all() method
#     try:
#         if flood_files:
#             flood_layers = [gpd.read_file(f) for f in flood_files]
#             if flood_layers:
#                 all_flood_gdf = pd.concat(flood_layers, ignore_index=True)
#                 flood_geom = all_flood_gdf.geometry.unary_union
#             else:
#                 flood_geom = None
#         else:
#             flood_geom = None
#     except Exception as e:
#         print(f"Could not process flood files: {e}")
#         flood_geom = None

#     heat_geom = None
#     if heat_files:
#         try:
#             heat_layers = [gpd.read_file(f) for f in heat_files]
#             if heat_layers:
#                 all_heat_gdf = pd.concat(heat_layers, ignore_index=True)
#                 heat_geom = all_heat_gdf.geometry.unary_union
#         except Exception as e:
#             print(f"Could not process heat files: {e}")
#             heat_geom = None

#     landslide_geom = None
#     if landslide_files:
#         try:
#             landslide_layers = [gpd.read_file(f) for f in landslide_files]
#             if landslide_layers:
#                 all_landslide_gdf = pd.concat(landslide_layers, ignore_index=True)
#                 landslide_geom = all_landslide_gdf.geometry.unary_union
#         except Exception as e:
#             print(f"Could not process landslide files: {e}")
#             landslide_geom = None

#     # Create GeoDataFrame for assets
#     geometry = [Point(xy) for xy in zip(assets_df['long'], assets_df['lat'])]
#     assets_gdf = gpd.GeoDataFrame(assets_df, geometry=geometry, crs="EPSG:4326")
#     assets_gdf_proj = assets_gdf.to_crs("EPSG:27700")

#     flood_geom_proj = None
#     if flood_geom and not flood_geom.is_empty:
#         # Reproject the combined flood geometry for distance calculations
#         flood_geom_proj = gpd.GeoSeries([flood_geom], crs="EPSG:4326").to_crs("EPSG:27700").unary_union

#     for index, asset in assets_gdf.iterrows():
#         asset_geom = asset.geometry

#         intersects_flood = flood_geom and not flood_geom.is_empty and asset_geom.intersects(flood_geom)
#         intersects_heat = heat_geom and not heat_geom.is_empty and asset_geom.intersects(heat_geom)
#         intersects_landslide = landslide_geom and not landslide_geom.is_empty and asset_geom.intersects(landslide_geom)

#         score = 0
#         if intersects_flood:
#             if intersects_heat or intersects_landslide:
#                 score = 3
#             else:
#                 score = 2
#         elif flood_geom_proj:
#             asset_geom_proj = assets_gdf_proj.loc[index].geometry
#             distance_to_flood = asset_geom_proj.distance(flood_geom_proj)
#             if distance_to_flood <= 500:
#                 score = 1

#         exposure_scores.append(score)

#     assets_df['exposure_score'] = exposure_scores
#     return assets_df

# def load_network_data(df):
#     """Loads asset data from a DataFrame into a networkx graph."""
#     G = nx.DiGraph()
#     for _, row in df.iterrows():
#         node_id = row['Asset_ID']
#         node_attrs = row.to_dict()
#         for key, value in node_attrs.items():
#             if pd.isna(value): node_attrs[key] = None
#         node_attrs['status'] = 'running'
#         G.add_node(node_id, **node_attrs)
#     return G

# def load_dependency_mapping(G, mapping_path):
#     """Adds weighted dependency edges to the graph."""
#     df_mapping = pd.read_csv(mapping_path)
#     for _, row in df_mapping.iterrows():
#         from_node, to_node = row['from_asset'], row['to_asset']
#         weight = row['dependency_score']
#         if G.has_node(from_node) and G.has_node(to_node):
#             G.add_edge(from_node, to_node, weight=weight)
#     return G

# def compute_dependency_score(G):
#     """
#     Computes the dependency score based on the average criticality of connected nodes.
#     The score is the average criticality of the nodes it depends on (successors), rounded to the nearest whole number
#     """
#     for node in G.nodes():
#         dependencies = list(G.successors(node))
#         num_dependencies = len(dependencies)
#         if num_dependencies == 0:
#             dep_score = 0
#         else:
#             sum_of_criticalities = sum(G.nodes[dep].get('criticality_score', 0) for dep in dependencies)
#             dep_score = round(sum_of_criticalities / num_dependencies)
#         G.nodes[node]['dependency_score'] = dep_score
#     return G

# def compute_resilience_scores(G):
#     """
#     Computes the overall asset resilience score for each asset and the network average.
#     """
#     total_score = 0
#     num_nodes = G.number_of_nodes()
#     if num_nodes == 0:
#         return G, 0
#     for node_id in G.nodes():
#         node_data = G.nodes[node_id]
#         criticality = node_data.get('criticality_score', 0)
#         dependency = node_data.get('dependency_score', 0)
#         redundancy = node_data.get('redundancy_score', 0)
#         exposure = node_data.get('exposure_score', 0)
#         asset_score = criticality + dependency + redundancy + exposure
#         node_data['asset_resilience_score'] = asset_score
#         total_score += asset_score
#     average_network_score = total_score / num_nodes
#     return G, average_network_score

# def simulate_failure(G, failed_node, threshold=0.5, propagate_deep=False):
#     """
#     Simulates a cascading failure.
#     """
#     print(f"Failing: {failed_node}")
#     G.nodes[failed_node]["status"] = "failed"
#     failed = []
#     nodes_to_check = G.successors(failed_node) if not propagate_deep else nx.descendants(G, failed_node)
#     for neighbor in nodes_to_check:
#         try:
#             path = nx.shortest_path(G, source=failed_node, target=neighbor)
#             if len(path) > 1:
#                 min_dependency = min(G.edges[path[i], path[i+1]]["weight"] for i in range(len(path)-1))
#                 if min_dependency >= threshold and G.nodes[neighbor]["status"] != "failed":
#                     print(f"Propagated failure to: {neighbor} (via dependency {min_dependency})")
#                     G.nodes[neighbor]["status"] = "failed"
#                     failed.append(neighbor)
#         except (nx.NetworkXNoPath, KeyError):
#             continue
#     return failed

# def get_node_info(G, node_id):
#     """Gets attributes and edge info for a specific node."""
#     if not G.has_node(node_id):
#         return {"error": "Node not found"}
#     info = {"attributes": G.nodes[node_id]}
#     info["outgoing_dependencies"] = [
#         {"target": succ, "weight": G.get_edge_data(node_id, succ).get('weight', 'N/A')}
#         for succ in G.successors(node_id)
#     ]
#     info["incoming_dependencies"] = [
#         {"source": pred, "weight": G.get_edge_data(pred, node_id).get('weight', 'N/A')}
#         for pred in G.predecessors(node_id)
#     ]
#     return info

# # --- Flask Routes ---

# @app.route('/', methods=['GET'])
# def index():
#     with open('index.html', 'r') as f:
#         html_template = f.read()
#     return render_template_string(html_template)

# @app.route('/get-hazard-layers', methods=['GET'])
# def get_hazard_layers():
#     """Scans the data directory and returns a list of available GeoJSON files."""
#     data_folder = app.config['DATA_FOLDER']
#     layers = {
#         "flood": [os.path.basename(f) for f in glob.glob(os.path.join(data_folder, 'flood', '*.geojson'))],
#         "heatstress": [os.path.basename(f) for f in glob.glob(os.path.join(data_folder, 'heatstress', '*.geojson'))],
#         "landslide": [os.path.basename(f) for f in glob.glob(os.path.join(data_folder, 'landslide', '*.geojson'))]
#     }
#     return jsonify(layers)

# @app.route('/load-network', methods=['POST'])
# def load_network():
#     """Reads data from local folders based on selected layers, processes it, and builds the graph."""
#     data_folder = app.config['DATA_FOLDER']
#     asset_path = os.path.join(data_folder, 'assets.csv')
#     dep_path = os.path.join(data_folder, 'dependencies.csv')
    
#     # Get selected layer filenames from frontend
#     layer_files = request.get_json()
    
#     # Construct full paths for the selected files
#     flood_files = [os.path.join(data_folder, 'flood', f) for f in layer_files.get('flood', [])]
#     heat_files = [os.path.join(data_folder, 'heatstress', f) for f in layer_files.get('heat', [])]
#     landslide_files = [os.path.join(data_folder, 'landslide', f) for f in layer_files.get('landslide', [])]

#     if not os.path.exists(asset_path) or not os.path.exists(dep_path):
#         return jsonify({"error": "assets.csv or dependencies.csv not found in the 'data' folder."}), 404
    
#     try:
#         asset_df = pd.read_csv(asset_path)
#         asset_df = compute_redundancy_score(asset_df)
#         asset_df = compute_exposure_score(asset_df, flood_files, heat_files, landslide_files)
        
#         G = load_network_data(asset_df)
#         G = load_dependency_mapping(G, dep_path)
#         G = compute_dependency_score(G)
#         G, network_resilience = compute_resilience_scores(G)
        
#         network_data["graph"] = G
#         network_data["network_resilience"] = network_resilience

#         graph_json = nx.node_link_data(G)
#         return jsonify({"graph": graph_json, "network_resilience": network_resilience})
#     except Exception as e:
#         import traceback
#         print(traceback.format_exc())
#         return jsonify({"error": str(e)}), 500

# @app.route('/node_info/<node_id>', methods=['GET'])
# def node_info(node_id):
#     """Returns detailed information for a specific node."""
#     G = network_data.get("graph")
#     if G is None: return jsonify({"error": "Graph not loaded yet."}), 404
#     info = get_node_info(G, node_id)
#     return jsonify(info)

# @app.route('/simulate/<node_id>', methods=['POST'])
# def simulate(node_id):
#     """Runs the failure simulation for a given node."""
#     G = network_data.get("graph")
#     if G is None: return jsonify({"error": "Graph not loaded yet."}), 404
    
#     data = request.get_json()
#     propagate_deep = data.get('propagateDeep', False)
        
#     G_copy = G.copy()
#     propagated_failures = simulate_failure(G_copy, failed_node=node_id, threshold=0.5, propagate_deep=propagate_deep)
    
#     all_failed_nodes = [node_id] + propagated_failures
#     total_failed_count = len(all_failed_nodes)
    
#     return jsonify({
#         "failed_nodes": all_failed_nodes,
#         "total_failed": total_failed_count
#     })

# if __name__ == '__main__':
#     app.run(debug=True, port=5001)
