from flask import Flask, render_template, jsonify
import networkx as nx
import random

app = Flask(__name__)

# Create a graph with 10 nodes on the Isle of Wight
G = nx.Graph()
for i in range(10):
    lat = random.uniform(50.65, 50.75)
    lon = random.uniform(-1.55, -1.15)
    G.add_node(i, lat=lat, lon=lon)

# Add some random edges
for i in range(15):  # ~15 random edges
    u, v = random.sample(range(10), 2)
    G.add_edge(u, v)

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/graph")
def graph():
    nodes = [
        {"id": n, "lat": d["lat"], "lon": d["lon"]}
        for n, d in G.nodes(data=True)
    ]
    edges = [{"from": u, "to": v} for u, v in G.edges()]
    return jsonify({"nodes": nodes, "edges": edges})

if __name__ == "__main__":
    app.run(debug=True)
