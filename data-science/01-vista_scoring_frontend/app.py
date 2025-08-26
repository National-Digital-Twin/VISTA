import os
import pandas as pd
import networkx as nx
from flask import Flask, jsonify, render_template, request
from utils import (
    load_assets_to_graph,
    add_dependencies_to_graph,
    compute_dependency_score,
    compute_redundancy_score,
    compute_asset_score,
    simulate_failure,
    add_attribute_from_df
)

app = Flask(__name__)

# --- Global Variables & Initial Graph Loading ---
ASSET_FILE = '01-failure-of-national-electricity-transmission-network.csv'
DEPENDENCY_FILE = '01-dependency-mapping.csv'

# Load initial data and create the graph
G = load_assets_to_graph(ASSET_FILE)
G = add_dependencies_to_graph(G, DEPENDENCY_FILE)
G = compute_dependency_score(G)

# --- Flask Routes ---
@app.route('/')
def index():
    """Renders the main HTML page."""
    return render_template('index.html')

@app.route('/api/graph')
def get_graph_data():
    """Serves the initial graph data to the frontend."""
    nodes = [{'id': n, **d} for n, d in G.nodes(data=True)]
    edges = [{'source': u, 'target': v, **d} for u, v, d in G.edges(data=True)]
    return jsonify({'nodes': nodes, 'edges': edges})

@app.route('/api/simulate_failure', methods=['POST'])
def run_failure_simulation():
    """Runs the failure simulation on a selected node."""
    data = request.get_json()
    node_id = data.get('node_id')
    
    if not node_id or not G.has_node(node_id):
        return jsonify({'error': 'Invalid node ID provided'}), 400

    # Create a copy of the graph for simulation to avoid altering the original
    sim_graph = G.copy()
    
    # Simulate the failure
    failed_nodes_propagated = simulate_failure(sim_graph, node_id, threshold=1)
    
    # The total list of failed nodes includes the initially failed one
    all_failed_nodes = [node_id] + failed_nodes_propagated
    
    return jsonify({'failed_nodes': all_failed_nodes})

if __name__ == '__main__':
    app.run(debug=True)
