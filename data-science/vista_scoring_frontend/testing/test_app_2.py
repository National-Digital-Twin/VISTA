import pandas as pd
import networkx as nx
import folium
import random
from flask import Flask, render_template_string

# Initialize the Flask application
app = Flask(__name__)

# --- Configuration ---
# You can adjust these parameters to change the network generation
CSV_FILE_PATH = 'asset_data.csv'
NUMBER_OF_RANDOM_EDGES = 50 # How many random connections to create

# --- HTML Template ---
# We embed the HTML template directly in the Python file for simplicity.
# This avoids needing a separate 'templates' folder.
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <title>Asset Network Map</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        html, body {
            height: 100%;
            margin: 0;
            padding: 0;
            font-family: sans-serif;
        }
        #map {
            width: 100%;
            height: 100%;
        }
        .info-panel {
            position: absolute;
            top: 10px;
            left: 50px;
            z-index: 1000;
            background: white;
            padding: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            max-width: 350px;
        }
        h1 {
            margin-top: 0;
            font-size: 1.5em;
        }
        p {
            font-size: 0.9em;
            line-height: 1.4;
            margin-bottom: 0;
        }
    </style>
</head>
<body>
    <div class="info-panel">
        <h1>Infrastructure Asset Network</h1>
        <p>This map displays assets as nodes and random connections as edges. The color of a node indicates its criticality score (Red = High, Orange = Medium, Green = Low).</p>
    </div>
    {{ map_html|safe }}
</body>
</html>
"""

def create_network_map():
    """
    Reads asset data, creates a network graph, and generates a Folium map.
    """
    # 1. Read the CSV data using pandas
    try:
        df = pd.read_csv(CSV_FILE_PATH)
    except FileNotFoundError:
        return "<h2>Error</h2><p>Could not find the file 'asset_data.csv'. Please make sure it's in the same directory as the application.</p>"

    # Drop rows with missing lat/long data to prevent errors
    df.dropna(subset=['lat', 'long'], inplace=True)

    # 2. Create a NetworkX graph
    G = nx.Graph()

    # 3. Add nodes to the graph from the DataFrame
    for _, row in df.iterrows():
        G.add_node(
            row['Asset_ID'],
            pos=(row['lat'], row['long']),
            asset_type=row['Asset_Type'],
            name=row['Asset_Name'],
            criticality=row['criticality_score']
        )

    # 4. Create random edges (connections) between nodes
    nodes = list(G.nodes())
    if len(nodes) > 1:
        for _ in range(NUMBER_OF_RANDOM_EDGES):
            # Choose two different random nodes
            u, v = random.sample(nodes, 2)
            
            # Add an edge if one doesn't already exist
            if not G.has_edge(u, v):
                # Use the sum of criticality scores as the edge weight
                weight = G.nodes[u]['criticality'] + G.nodes[v]['criticality']
                G.add_edge(u, v, weight=weight)

    # 5. Create the Folium Map
    # Calculate the center of the map
    avg_lat = df['lat'].mean()
    avg_long = df['long'].mean()
    
    m = folium.Map(location=[avg_lat, avg_long], zoom_start=12, tiles="CartoDB positron")

    # Helper function to determine node color based on criticality
    def get_color(criticality):
        if criticality >= 3:
            return 'red'
        elif criticality == 2:
            return 'orange'
        else:
            return 'green'

    # 6. Add nodes to the map
    for node, data in G.nodes(data=True):
        lat, lon = data['pos']
        popup_html = f"""
            <b>Asset ID:</b> {node}<br>
            <b>Name:</b> {data['name']}<br>
            <b>Type:</b> {data['asset_type']}<br>
            <b>Criticality:</b> {data['criticality']}
        """
        folium.CircleMarker(
            location=(lat, lon),
            radius=6,
            color=get_color(data['criticality']),
            fill=True,
            fill_color=get_color(data['criticality']),
            fill_opacity=0.8,
            popup=folium.Popup(popup_html, max_width=300)
        ).add_to(m)

    # 7. Add edges to the map
    for u, v in G.edges():
        pos_u = G.nodes[u]['pos']
        pos_v = G.nodes[v]['pos']
        
        folium.PolyLine(
            locations=[pos_u, pos_v],
            color='gray',
            weight=2.5,
            opacity=0.6
        ).add_to(m)

    # Return the HTML representation of the map
    return m._repr_html_()


@app.route('/')
def index():
    """
    Main route that renders the map page.
    """
    map_html = create_network_map()
    return render_template_string(HTML_TEMPLATE, map_html=map_html)


# --- Main execution ---
if __name__ == '__main__':
    # To run this app:
    # 1. Make sure you have the required libraries:
    #    pip install flask pandas networkx folium
    # 2. Place 'asset_data.csv' in the same directory as this script.
    # 3. Run the script from your terminal: python your_script_name.py
    # 4. Open your web browser and go to http://127.0.0.1:5000
    app.run(debug=True)
