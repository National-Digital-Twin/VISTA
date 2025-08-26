import pandas as pd
import networkx as nx
from flask import Flask, jsonify, render_template

# Initialize the Flask application
app = Flask(__name__)

# --- Graph Creation Logic ---

# 1. Read the asset and dependency data from the provided CSV files
try:
    assets_df = pd.read_csv("asset_data.csv")
    dependencies_df = pd.read_csv("dependencies.csv")
except FileNotFoundError as e:
    print(f"Error: {e}. Make sure asset_data.csv and dependencies.csv are in the same directory.")
    exit()


# 2. Create a new directed graph object
G = nx.DiGraph()

# 3. Add nodes to the graph from the assets DataFrame
# Each row in asset_data.csv corresponds to a node.
# The 'Asset_ID' is used as the unique identifier for each node.
# All other columns in that row are added as attributes to the node.
for index, row in assets_df.iterrows():
    node_id = row['Asset_ID']
    # Convert the row to a dictionary to hold all attribute data
    attributes = row.to_dict()
    G.add_node(node_id, **attributes)

# 4. Add directed edges (connections) to the graph from the dependencies DataFrame
for index, row in dependencies_df.iterrows():
    source_node = row['from_asset']
    target_node = row['to_asset']
    dependency_score = row['dependency_score']

    # Check that both the source and target nodes exist before creating a connection
    if G.has_node(source_node) and G.has_node(target_node):
        # Add the directed edge (arrow) from the source to the target
        # The dependency_score is added as an attribute for this specific edge
        G.add_edge(source_node, target_node, dependency_score=dependency_score)
        
        # As requested, also add the dependency_score as an attribute to the source node
        # This will overwrite if the node has multiple dependencies; the last one will be stored.
        nx.set_node_attributes(G, {source_node: {'dependency_score': dependency_score}})


# --- Flask Routes ---

@app.route("/")
def index():
    """
    This route renders the main HTML page for the frontend.
    """
    return render_template("index.html")

@app.route("/api/graph")
def get_graph_data():
    """
    This API endpoint serves the complete graph data in a JSON format
    that is easy for frontend JavaScript libraries to consume.
    """
    # Convert the graph's nodes and edges into a list of dictionaries
    nodes = [{'id': n, **G.nodes[n]} for n in G.nodes()]
    edges = [{'source': u, 'target': v, **G.edges[u, v]} for u, v in G.edges()]
    
    return jsonify({"nodes": nodes, "edges": edges})

# --- Run the Application ---

if __name__ == "__main__":
    # This starts the Flask development server
    app.run(debug=True)
