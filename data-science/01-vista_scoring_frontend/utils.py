import networkx as nx
import matplotlib.pyplot as plt
import pandas as pd
import numpy as np
import geopandas as gpd
from shapely.geometry import Point
from shapely.ops import unary_union
import glob
import os
import csv
import json
from typing import List, Optional

def load_assets_to_graph(assets_filepath):
    """
    Loads asset data from a CSV file into a NetworkX DiGraph.

    Each row in the CSV is added as a node. The 'Asset_ID' column is used
    as the node identifier. Node attributes 'criticality_score' and 'status'
    are also added.

    Args:
        graph (nx.DiGraph): The NetworkX DiGraph object to add nodes to.
        assets_filepath (str): The file path for the assets CSV data.

    Returns:
        nx.DiGraph: The graph with the new nodes added.
    """
    # Initailise a new directed graph
    graph = nx.DiGraph()

    try:
        # Read the asset data from the CSV file into a pandas DataFrame
        assets_df = pd.read_csv(assets_filepath)
        print(f"Successfully loaded {assets_filepath}")

        # Iterate over each row in the DataFrame
        for _, row in assets_df.iterrows():
            graph.add_node(row['Asset_ID'], **row.to_dict(), status="working")
        # for index, row in assets_df.iterrows():
        #     asset_id = row['Asset_ID']
        #     criticality_score = row['criticality_score']

        #     # Add a node to the graph for each asset
        #     # The node ID is the Asset_ID from the CSV
        #     # Attributes for criticality score and a default status are added
        #     graph.add_node(
        #         asset_id,
        #         criticality_score=float(criticality_score),
        #         status="working"
        #     )

        print(f"Added {graph.number_of_nodes()} nodes to the graph.")
        return graph

    except FileNotFoundError:
        print(f"Error: The file '{assets_filepath}' was not found.")
        return None
    except KeyError as e:
        print(f"Error: A required column is missing from the CSV: {e}")
        return None

def add_dependencies_to_graph(graph, dependencies_filepath):
    """
    Adds weighted, directed edges to a graph based on a dependency CSV file.

    The function reads a CSV file to establish connections (edges) between
    existing nodes in the graph.

    Args:
        graph (nx.DiGraph): The NetworkX DiGraph object to add edges to.
        dependencies_filepath (str): The file path for the dependencies CSV.

    Returns:
        nx.DiGraph: The graph with the new edges added.
    """
    if graph is None:
        print("Error: The graph object is invalid. Cannot add dependencies.")
        return None

    try:
        # Read the dependency data from the CSV file
        dependencies_df = pd.read_csv(dependencies_filepath)
        print(f"\nSuccessfully loaded {dependencies_filepath}")

        # Iterate over each row in the DataFrame to create edges
        for index, row in dependencies_df.iterrows():
            from_asset = row['from_asset']
            to_asset = row['to_asset']
            dependency_score = row['dependency_score']

            # Check if both nodes exist in the graph before adding an edge
            if graph.has_node(from_asset) and graph.has_node(to_asset):
                # Add a directed edge from 'from_asset' to 'to_asset'
                # The 'weight' of the edge is the dependency_score
                graph.add_edge(
                    from_asset,
                    to_asset,
                    weight=float(dependency_score)
                )
            else:
                # Print a warning if a node mentioned in the dependency file
                # does not exist in the graph.
                if not graph.has_node(from_asset):
                    print(f"Warning: Node '{from_asset}' not found in graph. Skipping edge.")
                if not graph.has_node(to_asset):
                    print(f"Warning: Node '{to_asset}' not found in graph. Skipping edge.")

        print(f"Added edges. The graph now has {graph.number_of_edges()} edges.")
        return graph

    except FileNotFoundError:
        print(f"Error: The file '{dependencies_filepath}' was not found.")
        return None
    except KeyError as e:
        print(f"Error: A required column is missing from the CSV: {e}")
        return None

def check_for_duplicate_connections(file_path):
    """
    Reads a dependency mapping CSV and checks for duplicate connections.

    This function identifies two types of duplicates:
    1. Direct duplicates (e.g., A -> B appears multiple times).
    2. Reciprocal duplicates (e.g., both A -> B and B -> A exist).

    Args:
        file_path (str): The path to the CSV file.
    """
    print(f"--- Analyzing '{file_path}' for duplicate connections ---\n")

    # --- 1. Read the data ---
    try:
        df = pd.read_csv(file_path)
    except FileNotFoundError:
        print(f"Error: The file '{file_path}' was not found.")
        return
    except Exception as e:
        print(f"An error occurred while reading the file: {e}")
        return

    # --- 2. Check for Direct Duplicates ---
    # Find rows where the combination of 'from_asset' and 'to_asset' is duplicated.
    # keep=False marks all occurrences of duplicates, making them easy to see.
    direct_duplicates = df[df.duplicated(subset=['from_asset', 'to_asset'], keep=False)]

    if not direct_duplicates.empty:
        print("Found Direct Duplicate Connections (same direction):")
        print(direct_duplicates.sort_values(by=['from_asset', 'to_asset']))
        print("-" * 50)
    else:
        print("No direct duplicate connections found.")
        print("-" * 50)


    # --- 3. Check for Reciprocal Duplicates ---
    # To find pairs like (A, B) and (B, A), we can create a canonical representation
    # for each pair by sorting the asset names alphabetically.
    # This way, both (A, B) and (B, A) become ('A', 'B').

    # Create a temporary copy to avoid modifying the original DataFrame view
    df_reciprocal_check = df.copy()
    df_reciprocal_check['canonical_pair'] = df_reciprocal_check.apply(
        lambda row: tuple(sorted((row['from_asset'], row['to_asset']))),
        axis=1
    )

    # Now find duplicates based on this canonical pair
    reciprocal_duplicates_mask = df_reciprocal_check.duplicated(subset=['canonical_pair'], keep=False)
    reciprocal_duplicates = df_reciprocal_check[reciprocal_duplicates_mask]

    # We only want to show pairs that are not also direct duplicates,
    # as those have already been reported.
    # We can identify true reciprocal duplicates by seeing if a canonical pair has more than one unique (from, to) combination.
    if not reciprocal_duplicates.empty:
        # Group by the canonical pair and count the unique connections
        grouped = reciprocal_duplicates.groupby('canonical_pair').filter(lambda x: len(x[['from_asset', 'to_asset']].drop_duplicates()) > 1)

        if not grouped.empty:
            print("\nFound Reciprocal Duplicate Connections (opposite directions):")
            print(grouped.sort_values(by='canonical_pair'))
            print("-" * 50)
        else:
            print("\nNo reciprocal duplicate connections found.")
            print("-" * 50)
    else:
        print("\nNo reciprocal duplicate connections found.")
        print("-" * 50)


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

            # Normalize the average score to a 0-3 scale
            # if avg_criticality == 0:
            #     dep_score = 0
            # elif avg_criticality <= 2:
            #     dep_score = 1
            # elif avg_criticality <= 4:
            #     dep_score = 2
            # else:
            #     dep_score = 3

        G.nodes[node]['dependency_score'] = dep_score
    return G


def export_nodes_to_csv(G, filepath='nodes.csv'):
    with open(filepath, 'w', newline='') as f:
        writer = csv.writer(f)
        # Extract all attribute keys from all nodes
        all_keys = set(k for _, d in G.nodes(data=True) for k in d.keys())
        headers = ['node_id'] + list(sorted(all_keys))
        #headers = list(sorted(all_keys))
        writer.writerow(headers)

        for node, data in G.nodes(data=True):
            row = [node] + [data.get(k, '') for k in sorted(all_keys)]
            writer.writerow(row)

def add_attribute_from_df(G, df, column_name, attribute_name=None):
    """
    Adds a column from a DataFrame as an attribute to graph nodes.

    Args:
        G (nx.DiGraph): A NetworkX directed graph.
        df (pd.DataFrame): A pandas DataFrame with an 'Asset_ID' column that
                           corresponds to the nodes in the graph.
        column_name (str): The name of the column in the DataFrame to add.
        attribute_name (str, optional): The name for the new attribute on the graph nodes.
                                        If None, the column_name is used.

    Returns:
        nx.DiGraph: The graph with the new attribute added to its nodes.
    """
    if attribute_name is None:
        attribute_name = column_name

    # Create a dictionary from the DataFrame for easy lookup
    # Assumes the DataFrame index is the 'Asset_ID'
    if 'Asset_ID' in df.columns:
        df = df.set_index('Asset_ID')

    if column_name not in df.columns:
        print(f"Warning: Column '{column_name}' not found in DataFrame.")
        return G

    attribute_dict = df[column_name].to_dict()

    # Set the new attribute for each node in the graph
    nx.set_node_attributes(G, attribute_dict, name=attribute_name)
    print(f"Added {column_name} to the graph.")

    return G



# def compute_exposure_score(
#     assets_df: pd.DataFrame,
#     flood_files: List[str],
#     heat_files: Optional[List[str]] = None,
#     landslide_files: Optional[List[str]] = None
# ) -> pd.DataFrame:
#     """
#     Computes an exposure score based on asset intersection with hazard layers and
#     adds it as a new column to the assets_df.

#     This version includes a check to ensure at least one hazard file is successfully
#     loaded before proceeding with calculations.

#     Args:
#         assets_df (pd.DataFrame): DataFrame containing asset data with 'lat' and 'long' columns.
#         flood_files (List[str]): List of file paths to flood hazard GeoJSON files.
#         heat_files (Optional[List[str]], optional): List of file paths to heat hazard GeoJSON files.
#         landslide_files (Optional[List[str]], optional): List of file paths to landslide hazard GeoJSON files.

#     Returns:
#         pd.DataFrame: The original DataFrame with an added 'exposure_score' column.
#     """
#     exposure_scores = []
#     files_successfully_read = 0

#     # --- Load and combine hazard layers ---

#     # Helper lambda to load files for a given hazard type
#     def load_hazard_geometries(files: Optional[List[str]], hazard_name: str) -> Optional[gpd.GeoSeries]:
#         nonlocal files_successfully_read
#         if not files:
#             return None

#         loaded_layers = []
#         for f in files:
#             try:
#                 gdf = gpd.read_file(f)
#                 loaded_layers.append(gdf)
#             except Exception as e:
#                 # Warn about individual file errors but continue
#                 print(f"Warning: Could not read {hazard_name} file '{f}'. Reason: {e}")

#         if loaded_layers:
#             files_successfully_read += len(loaded_layers)
#             all_gdf = pd.concat(loaded_layers, ignore_index=True)
#             return all_gdf.geometry.union_all()
#         return None

#     flood_geom = load_hazard_geometries(flood_files, "flood")
#     heat_geom = load_hazard_geometries(heat_files, "heat")
#     landslide_geom = load_hazard_geometries(landslide_files, "landslide")

#     # --- CRITICAL CHECK: Ensure at least one hazard file was loaded ---
#     if files_successfully_read == 0:
#         print("\n" + "="*60)
#         print("CRITICAL ERROR: No valid hazard GeoJSON files could be loaded.")
#         print("Execution halted. Please check the following:")
#         print("  1. The file paths provided in 'flood_files', 'heat_files', or 'landslide_files' are correct.")
#         print("  2. The files exist at those locations and are accessible.")
#         print("  3. The files are valid, non-empty GeoJSON files.")
#         print("="*60 + "\n")
#         return assets_df # Return the original, unmodified DataFrame

#     # --- Proceed with calculations if files were loaded ---

#     # Create GeoDataFrame for assets
#     geometry = [Point(xy) for xy in zip(assets_df['long'], assets_df['lat'])]
#     assets_gdf = gpd.GeoDataFrame(assets_df, geometry=geometry, crs="EPSG:4326")
#     assets_gdf_proj = assets_gdf.to_crs("EPSG:27700") # Project for distance calculation

#     flood_geom_proj = None
#     if flood_geom and not flood_geom.is_empty:
#         # Reproject the combined flood geometry for accurate distance calculations
#         flood_geom_proj = gpd.GeoSeries([flood_geom], crs="EPSG:4326").to_crs("EPSG:27700").union_all()

#     for index, asset in assets_gdf.iterrows():
#         asset_geom = asset.geometry

#         # Check for intersection with each hazard
#         intersects_flood = flood_geom and not flood_geom.is_empty and asset_geom.intersects(flood_geom)
#         intersects_heat = heat_geom and not heat_geom.is_empty and asset_geom.intersects(heat_geom)
#         intersects_landslide = landslide_geom and not landslide_geom.is_empty and asset_geom.intersects(landslide_geom)

#         score = 0
#         if intersects_flood:
#             # Score is 3 if it intersects flood AND at least one other hazard
#             if intersects_heat or intersects_landslide:
#                 score = 3
#             else: # Score is 2 if it only intersects flood
#                 score = 2
#         elif flood_geom_proj:
#             # If not in a flood zone, check proximity. Score is 1 if within 500m.
#             asset_geom_proj = assets_gdf_proj.loc[index].geometry
#             distance_to_flood = asset_geom_proj.distance(flood_geom_proj)
#             if distance_to_flood <= 500:
#                 score = 1

#         exposure_scores.append(score)

#     assets_df['exposure_score'] = exposure_scores
#     return assets_df

def compute_exposure_score(assets_df, flood_files, heat_files=None, landslide_files=None):
    """
    Version 2 updated based on client requirement 060825
    Computes exposure score based on asset intersection with hazard layers and
    adds it as a new column to the assets_df.
    """
    exposure_scores = []

    # Load and combine hazard layers using the recommended union_all() method
    try:
        flood_layers = [gpd.read_file(f) for f in flood_files]
        if flood_layers:
            all_flood_gdf = pd.concat(flood_layers, ignore_index=True)
            flood_geom = all_flood_gdf.geometry.union_all()
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
                heat_geom = all_heat_gdf.geometry.union_all()
        except Exception as e:
            print(f"Could not process heat files: {e}")
            heat_geom = None

    landslide_geom = None
    if landslide_files:
        try:
            landslide_layers = [gpd.read_file(f) for f in landslide_files]
            if landslide_layers:
                all_landslide_gdf = pd.concat(landslide_layers, ignore_index=True)
                landslide_geom = all_landslide_gdf.geometry.union_all()
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
        flood_geom_proj = gpd.GeoSeries([flood_geom], crs="EPSG:4326").to_crs("EPSG:27700").union_all()

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

def compute_exposure_score_v2(assets_df, flood_files, heat_files=None, landslide_files=None):
    """
    Computes exposure score based on asset intersection with hazard layers and
    adds it as a new column to the assets_df.
    """
    exposure_scores = []

    # Load and combine hazard layers using the recommended union_all() method
    try:
        flood_layers = [gpd.read_file(f) for f in flood_files]
        if flood_layers:
            all_flood_gdf = pd.concat(flood_layers, ignore_index=True)
            flood_geom = all_flood_gdf.geometry.union_all()
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
                heat_geom = all_heat_gdf.geometry.union_all()
        except Exception as e:
            print(f"Could not process heat files: {e}")
            heat_geom = None

    landslide_geom = None
    if landslide_files:
        try:
            landslide_layers = [gpd.read_file(f) for f in landslide_files]
            if landslide_layers:
                all_landslide_gdf = pd.concat(landslide_layers, ignore_index=True)
                landslide_geom = all_landslide_gdf.geometry.union_all()
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
        flood_geom_proj = gpd.GeoSeries([flood_geom], crs="EPSG:4326").to_crs("EPSG:27700").union_all()

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


def haversine_distance(lat1, lon1, lat2, lon2):
    """
    Calculate the great-circle distance between two points
    on the earth (specified in decimal degrees).

    Args:
        lat1 (float): Latitude of the first point.
        lon1 (float): Longitude of the first point.
        lat2 (float): Latitude of the second point.
        lon2 (float): Longitude of the second point.

    Returns:
        float: The distance in kilometers.
    """
    # Earth radius in kilometers
    R = 6371.0

    # Convert decimal degrees to radians
    lat1_rad = np.radians(lat1)
    lon1_rad = np.radians(lon1)
    lat2_rad = np.radians(lat2)
    lon2_rad = np.radians(lon2)

    # Differences in coordinates
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad

    # Haversine formula
    a = np.sin(dlat / 2)**2 + np.cos(lat1_rad) * np.cos(lat2_rad) * np.sin(dlon / 2)**2
    c = 2 * np.arctan2(np.sqrt(a), np.sqrt(1 - a))

    distance = R * c
    return distance

def compute_redundancy_score(df):
    """
    Computes the Redundancy score for each asset in the DataFrame.

    The score is based on the existence and proximity of a backup asset:
    - Score 3: No backup asset is listed.
    - Score 2: A backup asset exists and is more than 5km away.
    - Score 1: A backup asset exists and is between 2km and 5km away.
    - Score 0: A backup asset exists and is less than 2km away.

    Args:
        df (pd.DataFrame): DataFrame containing asset data, including 'Asset_ID',
                           'backup_asset_id', 'lat', and 'long'.

    Returns:
        pd.DataFrame: The original DataFrame with an added 'dependency_score' column.
    """
    # Create a dictionary to quickly look up the coordinates of any asset by its ID
    # This is much more efficient than searching the DataFrame for each backup asset.
    asset_coordinates = {row.Asset_ID: (row.lat, row.long) for index, row in df.iterrows()}

    scores = []
    # Iterate over each asset in the DataFrame to calculate its score
    for index, row in df.iterrows():
        backup_id = row['backup_asset_id']

        # Check if the backup_asset_id is missing or null
        if pd.isna(backup_id):
            scores.append(3)
            continue

        # Check if the backup asset exists in our coordinate map
        if backup_id not in asset_coordinates:
            # If the backup ID is invalid or doesn't have coordinates, score is 3
            scores.append(3)
            continue

        # Get the coordinates for the primary and backup assets
        lat1, lon1 = asset_coordinates[row['Asset_ID']]
        lat2, lon2 = asset_coordinates[backup_id]

        # Calculate the distance between them
        distance = haversine_distance(lat1, lon1, lat2, lon2)

        # Assign score based on the distance
        if distance < 2:
            scores.append(0)
        elif 2 <= distance <= 5:
            scores.append(1)
        else: # distance > 5
            scores.append(2)

    # Add the calculated scores as a new column to the DataFrame
    df['redundancy_score'] = scores
    return df

def compute_asset_score(G):
    """
    Computes the overall asset resilience score for each asset in the graph.

    The resilience score is the sum of:
    1. Criticality Score (inherent to the asset)
    2. Dependency Score (based on criticality of assets it depends on)
    3. Redundancy Score (based on proximity of a backup asset)
    4. Exposure Score (based on how many other assets depend on it)

    Args:
        G (nx.DiGraph): A NetworkX directed graph where nodes are assets.
                        It is assumed that node attributes for 'criticality_score'
                        have already been set.
        assets_list (list): A list of dictionaries, where each dictionary
                            represents an asset and its properties.

    Returns:
        nx.DiGraph: The graph with 'resilience_score' and its component scores
                    added as attributes to each node.
    """

    for node_id in G.nodes():
        node_data = G.nodes[node_id]

        # Retrieve component scores, using 0 as a default if a score is missing
        criticality = node_data.get('criticality_score', 0)
        dependency = node_data.get('dependency_score', 0)
        redundancy = node_data.get('redundancy_score', 0)
        exposure = node_data.get('exposure_score', 0)

        # Sum the scores to get the final resilience score
        asset_score = criticality + dependency + redundancy + exposure

        # Add the final score to the node's attributes
        node_data['asset_score'] = asset_score
    print(f"Added asset_score to assets.")
    #network_score = round(total_asset_score / G.number_of_nodes(), 2) if G.number_of_nodes() > 0 else 0

    return G

def simulate_failure(G, failed_node, threshold=1):
    print(f"Failing: {failed_node}")
    G.nodes[failed_node]["status"] = "failed"
    failed = []
    # Use BFS to propagate failure
    for neighbor in nx.descendants(G, failed_node):
        path = nx.shortest_path(G, source=failed_node, target=neighbor)
        min_dependency = min(G.edges[path[i], path[i+1]]["weight"] for i in range(len(path)-1))

        if min_dependency >= threshold:
            print(f"Propagated failure to: {neighbor} (via dependency {min_dependency})")
            #print(f"Propagated failure to: {neighbor} ")
            G.nodes[neighbor]["status"] = "failed"
            failed.append(neighbor)
    return failed

def compute_impact_score(G, failed_node):
    """
    Creates a copy of the graph, simulates a failure, and computes the impact score.
    """
    # Copy graph and simulate failure
    G_copy = G.copy()
    # Ensure all nodes are initially working in the copy
    for n in G_copy.nodes:
        G_copy.nodes[n]["status"] = "working"

    # Simulate the failure on the copy
    simulate_failure(G_copy, failed_node)

    # Count affected nodes
    total = len(G.nodes)
    if total == 0:
        return 0.0

    failed_count = sum(1 for n in G_copy.nodes if G_copy.nodes[n]["status"] == "failed")

    impact_score = round(failed_count / total, 3)
    print(f"\nImpact Score of failing '{failed_node}': {impact_score} ({failed_count}/{total} nodes failed)")
    print(f"\nPercentage Impact", {impact_score * 100},'%')
    return impact_score

def check_node_and_edges(G, node_id):
    """
    Checks and prints the attributes and edges for a specific node in the graph.

    Args:
        G (networkx.DiGraph): The graph to inspect.
        node_id (str): The ID of the node to check.
    """
    if not G.has_node(node_id):
        print(f"Node '{node_id}' not found in the graph.")
        return

    print(f"\n--- Analysis for Node: {node_id} ---")

    # --- Print Node Attributes ---
    print("\n[Asset Attributes]")
    node_attributes = G.nodes[node_id]
    for attr, value in node_attributes.items():
        print(f"  - {attr}: {value}")

    # --- Print Outgoing Edges (Dependencies) ---
    print("\n[Outgoing Dependencies (This asset depends on...)]")
    successors = list(G.successors(node_id))
    if not successors:
        print("  - None")
    else:
        for successor in successors:
            edge_data = G.get_edge_data(node_id, successor)
            weight = edge_data.get('weight', 'N/A')
            print(f"  -> {node_id} impacts {successor} with dependency_score (weight): {weight}")

    # --- Print Incoming Edges (Dependents) ---
    print("\n[Incoming Dependencies (...depend on this asset)]")
    predecessors = list(G.predecessors(node_id))
    if not predecessors:
        print("  - None")
    else:
        for predecessor in predecessors:
            edge_data = G.get_edge_data(predecessor, node_id)
            weight = edge_data.get('weight', 'N/A')
            print(f"  <- {predecessor} is parent to {node_id} with dependency_score (weight): {weight}")

    print("-" * (25 + len(node_id)))


def filter_graph_by_criticality(graph, threshold):
    """
    Filters a graph to include only nodes with a criticality score
    above or equal to a given threshold.

    Args:
        graph (nx.DiGraph): The input graph.
        threshold (float): The minimum criticality score for a node to be included.

    Returns:
        nx.DiGraph: A new graph containing only the filtered nodes and their edges.
    """
    if graph is None:
        print("Error: The graph object is invalid. Cannot filter.")
        return None

    # Identify nodes that meet the criticality score threshold
    nodes_to_keep = [
        node for node, data in graph.nodes(data=True)
        if data.get('criticality_score', 0) >= threshold
    ]

    # Create a new graph containing only the selected nodes and the edges between them
    filtered_graph = graph.subgraph(nodes_to_keep).copy()

    print(f"\nFiltered graph by criticality score >= {threshold}.")
    return filtered_graph


def convert_geojson_to_csv(geojson_file_path, csv_file_path):
    """
    Reads a GeoJSON file, extracts relevant data, transforms it,
    and exports it to a CSV file.

    Args:
        geojson_file_path (str): The path to the input GeoJSON file.
        csv_file_path (str): The path where the output CSV file will be saved.
    """
    try:
        # Step 1: Read the GeoJSON file
        with open(geojson_file_path, 'r') as f:
            geojson_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: The file '{geojson_file_path}' was not found.")
        return
    except json.JSONDecodeError:
        print(f"Error: Could not decode JSON from the file '{geojson_file_path}'.")
        return

    # Prepare to write to the CSV file
    try:
        with open(csv_file_path, 'w', newline='', encoding='utf-8') as csvfile:
            # Define CSV header
            header = ['Asset_ID', 'Asset_Type', 'Asset_Name', 'lat', 'long']
            writer = csv.DictWriter(csvfile, fieldnames=header)

            # Write the header row
            writer.writeheader()

            # Step 2 & 3: Iterate through features, transform data, and write rows
            # The features are in a list under the 'features' key
            for i, feature in enumerate(geojson_data.get('features', []), start=1):
                properties = feature.get('properties', {})
                geometry = feature.get('geometry', {})

                # Extract coordinates. Since it's a MultiPoint, we'll take the first point.
                # The coordinates are in [longitude, latitude] format.
                coordinates = geometry.get('coordinates', [])
                longitude, latitude = (None, None)
                if coordinates and len(coordinates) > 0:
                    # Take the first coordinate pair from the list
                    longitude, latitude = coordinates[0]

                # Prepare the row with the required data structure
                row = {
                    'Asset_ID': f'JN{i:02}',  # e.g., JN01, JN02
                    'Asset_Type': properties.get('description', 'N/A'),
                    'Asset_Name': properties.get('name1_text', 'N/A'),
                    'lat': latitude,
                    'long': longitude
                }

                # Write the transformed row to the CSV
                writer.writerow(row)

        print(f"Successfully converted '{geojson_file_path}' to '{csv_file_path}'")

    except IOError:
        print(f"Error: Could not write to the file '{csv_file_path}'.")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")


def add_new_assets_to_graph(G, assets_df):
    """
    Adds new assets from a DataFrame to an existing graph.

    Each row in the DataFrame is treated as a new asset. The 'Asset_ID'
    is used as the node ID, and all other columns in the row are added
    as attributes to that node.

    Args:
        G (nx.DiGraph): The existing NetworkX directed graph to add assets to.
        assets_df (pd.DataFrame): A DataFrame containing the new assets.
                                  Must include an 'Asset_ID' column.

    Returns:
        nx.DiGraph: The graph with the new assets added as nodes.
    """
    if 'Asset_ID' not in assets_df.columns:
        raise ValueError("assets_df must contain an 'Asset_ID' column.")

    added_count = 0
    updated_count = 0
    for index, row in assets_df.iterrows():
        # Use the 'Asset_ID' as the node identifier
        node_id = row['Asset_ID']

        # Convert the entire row to a dictionary to use as attributes
        attributes = row.to_dict()

        # Add the node to the graph with all its attributes
        if not G.has_node(node_id):
            G.add_node(node_id, **attributes)
            added_count += 1
        else:
            # If the node already exists, update its attributes
            nx.set_node_attributes(G, {node_id: attributes})
            updated_count += 1

    print(f"Added {added_count} new assets and updated {updated_count} existing assets.")
    return G

def add_new_dependency_to_graph(G, dependency_df):
    """
    Adds new dependencies (edges) from a DataFrame to an existing graph.

    It checks if a connection already exists before adding a new one.
    The 'dependency_score' is added as both an edge attribute and an
    attribute of the 'from_asset' node.

    Args:
        G (nx.DiGraph): The existing NetworkX directed graph.
        dependency_df (pd.DataFrame): A DataFrame with new dependencies.
                                      Must include 'from_asset', 'to_asset',
                                      and 'dependency_score' columns.

    Returns:
        nx.DiGraph: The graph with the new dependencies added as edges.
    """
    required_cols = ['from_asset', 'to_asset', 'dependency_score']
    if not all(col in dependency_df.columns for col in required_cols):
        raise ValueError(f"dependency_df must contain the columns: {', '.join(required_cols)}")

    added_count = 0
    for index, row in dependency_df.iterrows():
        from_node = row['from_asset']
        to_node = row['to_asset']
        dep_score = row['dependency_score']

        # Ensure both nodes exist in the graph before adding an edge
        if not G.has_node(from_node):
            print(f"Warning: Node '{from_node}' not found in graph. Skipping dependency.")
            continue
        if not G.has_node(to_node):
            print(f"Warning: Node '{to_node}' not found in graph. Skipping dependency.")
            continue

        # Check if an edge already exists between the two nodes
        if not G.has_edge(from_node, to_node):
            # Add the new edge with the dependency_score as an attribute
            G.add_edge(from_node, to_node, dependency_score=dep_score)

            # Add the dependency_score as a node attribute for the 'from' node
            nx.set_node_attributes(G, {from_node: {'dependency_score': dep_score}})
            added_count += 1
        else:
            print(f"Info: Dependency from '{from_node}' to '{to_node}' already exists. Skipping.")

    print(f"Added {added_count} new dependencies.")
    return G

def remove_assets_from_graph(G, assets_df):
    """
    Removes assets listed in a DataFrame from an existing graph.

    Args:
        G (nx.DiGraph): The existing NetworkX directed graph.
        assets_df (pd.DataFrame): A DataFrame containing the assets to remove.
                                  Must include an 'Asset_ID' column.

    Returns:
        nx.DiGraph: The graph with the specified assets removed.
    """
    if 'Asset_ID' not in assets_df.columns:
        raise ValueError("assets_df must contain an 'Asset_ID' column.")

    removed_count = 0
    for node_id in assets_df['Asset_ID']:
        if G.has_node(node_id):
            G.remove_node(node_id)
            removed_count += 1
        else:
            print(f"Warning: Node '{node_id}' not found in graph. Cannot remove.")

    print(f"Removed {removed_count} assets.")
    return G

def remove_dependency_from_graph(G, dependency_df):
    """
    Removes dependencies (edges) listed in a DataFrame from an existing graph.

    Args:
        G (nx.DiGraph): The existing NetworkX directed graph.
        dependency_df (pd.DataFrame): A DataFrame with dependencies to remove.
                                      Must include 'from_asset' and 'to_asset' columns.

    Returns:
        nx.DiGraph: The graph with the specified dependencies removed.
    """
    required_cols = ['from_asset', 'to_asset']
    if not all(col in dependency_df.columns for col in required_cols):
        raise ValueError(f"dependency_df must contain the columns: {', '.join(required_cols)}")

    removed_count = 0
    for index, row in dependency_df.iterrows():
        from_node = row['from_asset']
        to_node = row['to_asset']

        if G.has_edge(from_node, to_node):
            G.remove_edge(from_node, to_node)
            removed_count += 1
        else:
            print(f"Warning: Dependency from '{from_node}' to '{to_node}' not found. Cannot remove.")

    print(f"Removed {removed_count} dependencies.")
    return G

def graph_to_dataframe(G):
    """
    Converts a graph with node attributes back to a pandas DataFrame.

    Args:
        G (nx.DiGraph): The NetworkX graph to convert.


    Returns:
        pd.DataFrame: A DataFrame representation of the graph's nodes and their attributes.
    """
    # Extract node data into a list of dictionaries
    node_data = []
    for node, attrs in G.nodes(data=True):
        # Start with the node's ID as 'Asset_ID'
        record = {'Asset_ID': node}
        # Add all other attributes
        record.update(attrs)
        node_data.append(record)

    # if not node_data:
    #     # Return an empty DataFrame with the specified columns if the graph is empty
    #     return pd.DataFrame(columns=column_order)

    # Create the DataFrame
    df = pd.DataFrame(node_data)

    # # Ensure all columns from the desired order exist in the DataFrame, adding them with None if they don't
    # for col in column_order:
    #     if col not in df.columns:
    #         df[col] = None

    # Reorder the DataFrame columns
    # df = df[column_order]

    return df

def graph_to_dataframe_ordered(G, column_order):
    """
    Converts a graph with node attributes back to a pandas DataFrame.

    Args:
        G (nx.DiGraph): The NetworkX graph to convert.
        column_order (list): A list of column names in the desired order for the output DataFrame.

    Returns:
        pd.DataFrame: A DataFrame representation of the graph's nodes and their attributes.
    """
    # Extract node data into a list of dictionaries
    node_data = []
    for node, attrs in G.nodes(data=True):
        # Start with the node's ID as 'Asset_ID'
        record = {'Asset_ID': node}
        # Add all other attributes
        record.update(attrs)
        node_data.append(record)

    if not node_data:
        # Return an empty DataFrame with the specified columns if the graph is empty
        return pd.DataFrame(columns=column_order)

    # Create the DataFrame
    df = pd.DataFrame(node_data)

    # Ensure all columns from the desired order exist in the DataFrame, adding them with None if they don't
    for col in column_order:
        if col not in df.columns:
            df[col] = None

    # Reorder the DataFrame columns
    df = df[column_order]

    return df

def remove_node_attributes(G, attributes_to_remove):
    """
    Removes one or more attributes from all nodes in the graph.

    Args:
        G (nx.DiGraph): The existing NetworkX directed graph.
        attributes_to_remove (list): A list of attribute names (strings) to remove.

    Returns:
        nx.DiGraph: The graph with the specified attributes removed from its nodes.
    """
    for node in G.nodes():
        for attr in attributes_to_remove:
            if attr in G.nodes[node]:
                del G.nodes[node][attr]

    print(f"Remove the following attributes from all nodes: {', '.join(attributes_to_remove)}")
    return G

import networkx as nx
import matplotlib.pyplot as plt
from typing import Any, List, Tuple, Optional

def simulate_failure_with_plot(
    G: nx.DiGraph,
    failed_node: Any,
    threshold: float = 1.0,
    plot: bool = True
) -> Tuple[List[Any], Optional[Tuple[plt.Figure, plt.Axes]]]:
    """
    Simulates a failure cascade in a directed graph and visualizes the result.

    A failure propagates from the initial `failed_node` to its descendants if the
    minimum dependency (edge weight) along the shortest path is greater than or
    equal to the specified threshold.

    Args:
        G (nx.DiGraph): The directed graph to analyze. Edges must have a 'weight' attribute.
        failed_node (Any): The node where the initial failure occurs.
        threshold (float, optional): The minimum dependency weight required for a
                                     failure to propagate. Defaults to 1.0.
        plot (bool, optional): If True, generates and displays a plot of the failure.
                               Defaults to True.

    Returns:
        Tuple[List[Any], Optional[Tuple[plt.Figure, plt.Axes]]]:
        - A list of nodes that failed due to propagation.
        - A tuple containing the matplotlib Figure and Axes objects if plot=True,
          otherwise None.
    """
    if failed_node not in G:
        print(f"Error: Node {failed_node} not in the graph.")
        return [], None

    print(f"Initiating failure at node: {failed_node}")
    # It's good practice to not modify the graph in place unless intended.
    # Here we assume modification is intended by setting the "status" attribute.
    G.nodes[failed_node]["status"] = "failed"

    propagated_failures = []

    # Use BFS to find all reachable nodes (descendants) and check them
    for descendant in nx.descendants(G, failed_node):
        try:
            path = nx.shortest_path(G, source=failed_node, target=descendant)
            # The dependency is the "bottleneck" capacity of the path
            min_dependency = min(G.edges[u, v]["weight"] for u, v in zip(path, path[1:]))

            if min_dependency >= threshold:
                print(f"Propagated failure to: {descendant} (dependency: {min_dependency:.2f} >= {threshold})")
                G.nodes[descendant]["status"] = "failed"
                propagated_failures.append(descendant)
        except (nx.NetworkXNoPath, KeyError) as e:
            print(f"Could not process path to descendant {descendant}: {e}")
            continue

    # --- Plotting Section ---
    if not plot:
        return propagated_failures, None

    all_failed_nodes = [failed_node] + propagated_failures
    failed_subgraph = G.subgraph(all_failed_nodes)

    # Set up the plot
    fig, ax = plt.subplots(figsize=(12, 9))

    # Use a deterministic layout for reproducibility
    pos = nx.spring_layout(G, seed=42)

    # 1. Draw the entire graph in the background for context
    # nx.draw_networkx_nodes(G, pos, node_color='lightgray', node_size=500, ax=ax)
    # nx.draw_networkx_edges(G, pos, edge_color='#cccccc', width=1.0, arrows=True, ax=ax)
    # nx.draw_networkx_labels(G, pos, font_size=10, ax=ax)

    # 2. Highlight the failed subgraph on top
    nx.draw_networkx_nodes(
        G,
        pos,
        nodelist=all_failed_nodes,
        node_color='red',
        node_shape='o', # 'o' is a circle
        node_size=600,
        ax=ax
    )
    nx.draw_networkx_edges(
        failed_subgraph,
        pos,
        edge_color='red',
        width=1.5,
        arrows=True,
        ax=ax
    )
    # Draw labels for failed nodes in white for better contrast
    failed_labels = {node: node for node in all_failed_nodes}
    nx.draw_networkx_labels(G, pos, labels=failed_labels, font_size=6, font_color='white', font_weight='bold', ax=ax)

    ax.set_title(f"Failure Cascade from Node '{failed_node}' (Threshold: {threshold})", fontsize=16)
    plt.tight_layout()
    plt.show()

    return propagated_failures, (fig, ax)

def calculate_asset_score(df: pd.DataFrame) -> pd.DataFrame:
    """
    Calculates the asset score by summing up scores from four specific columns.

    This function takes a pandas DataFrame, checks for the required score columns,
    sums them row-wise, and adds the result to a new 'asset_score' column.

    Args:
        df (pd.DataFrame): The input DataFrame. It must contain the columns:
                           'criticality_score', 'dependency_score',
                           'exposure_score', and 'redundancy_score'.

    Returns:
        pd.DataFrame: The DataFrame with the new 'asset_score' column added.
                      Returns the original DataFrame with an error message printed
                      if any of the required columns are missing.
    """
    # Define the columns required for the calculation
    required_columns = [
        'criticality_score',
        'dependency_score',
        'exposure_score',
        'redundancy_score'
    ]

    # Check if all required columns are present in the DataFrame
    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        print(f"Error: Missing required columns: {', '.join(missing_cols)}")
        return df

    # Sum the specified columns row-wise to create the new 'asset_score'
    df['asset_score'] = df[required_columns].sum(axis=1)

    print("Successfully calculated asset score.")
    return df
