import rdflib
from rdflib.namespace import RDFS
import json
import uuid
import os
import sys
import copy

# --- File Paths ---
# Assumes a 'data' directory in the same folder as this script
DATA_DIR = 'data'
TTL_FILE = os.path.join(DATA_DIR, 'iow.ttl')
OUTPUT_JSON = os.path.join(DATA_DIR, 'water_bodies_data.json')

def find_geometries_from_geojson(geo_data):
    """
    Recursively finds all Polygon/MultiPolygon geometries within a 
    parsed GeoJSON object (dict).
    """
    geometries = []
    geo_type = geo_data.get('type', '')

    if geo_type in ['Polygon', 'MultiPolygon']:
        geometries.append(geo_data)
    
    elif geo_type == 'Feature':
        geom = geo_data.get('geometry')
        if geom:
            geometries.extend(find_geometries_from_geojson(geom))
    
    elif geo_type == 'FeatureCollection':
        for feature in geo_data.get('features', []):
            geometries.extend(find_geometries_from_geojson(feature))
    
    elif geo_type == 'GeometryCollection':
         for geom in geo_data.get('geometries', []):
             geometries.extend(find_geometries_from_geojson(geom))
    
    return geometries

def extract_water_bodies(ttl_file_path, output_json_path):
    """
    Extracts water body polygons from a Turtle file and saves them as JSON,
    with coordinates compacted to a single line.
    """
    
    # Define namespaces used in the TTL file
    IES4 = rdflib.Namespace("http://ies.data.gov.uk/ontology/ies4#")
    NDTP = rdflib.Namespace("http://ndtp.co.uk/ontology/")

    # Create a graph and parse the TTL file
    g = rdflib.Graph()
    try:
        print(f"Parsing TTL file: {ttl_file_path}...")
        g.parse(ttl_file_path, format="turtle")
        print("Parsing complete.")
    except Exception as e:
        print(f"Error: Could not parse TTL file '{ttl_file_path}'. {e}", file=sys.stderr)
        return

    # Bind namespaces for the query
    g.bind("ies4", IES4)
    g.bind("ndtp", NDTP)
    g.bind("rdfs", RDFS)

    query = """
    PREFIX ies4: <http://ies.data.gov.uk/ontology/ies4#>
    PREFIX ndtp: <http://ndtp.co.uk/ontology/>
    PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

    SELECT DISTINCT ?name ?geo_json_string
    WHERE {
      ?polygon_obj a ies4:GeoJSON ;
                   ies4:representationValue ?geo_json_string .
      
      ?water_body_entity ies4:isRepresentedAs ?polygon_obj .

      OPTIONAL {
         ?water_body_entity ies4:inLocation ?parent_area .
         ?parent_area ndtp:primaryName ?name_path1 .
      }
      OPTIONAL {
         ?water_body_entity ndtp:primaryName ?name_path2 .
      }
      OPTIONAL {
         ?water_body_entity rdfs:comment ?name_path3 .
      }
      
      BIND(COALESCE(?name_path1, ?name_path2, ?name_path3, "Unnamed Water Body") AS ?name)

      FILTER(
        CONTAINS(LCASE(?geo_json_string), '"polygon"') || 
        CONTAINS(LCASE(?geo_json_string), '"multipolygon"')
      )
    }
    """

    print("Executing SPARQL query...")
    results = g.query(query)
    print(f"Found {len(results)} potential water body entities.")
    
    all_polygons_data = []
    processed_geometries = set() 

    for row in results:
        name = str(row.name)
        geo_json_string = str(row.geo_json_string)

        try:
            geo_data = json.loads(geo_json_string)
            geometries = find_geometries_from_geojson(geo_data)
            
            for geometry in geometries:
                geom_hash = hash(json.dumps(geometry.get('coordinates')))
                
                if geom_hash not in processed_geometries:
                    polygon_entry = {
                        "id": str(uuid.uuid4()),
                        "name": name,
                        "geometry": {
                            "type": geometry.get('type'),
                            "coordinates": geometry.get('coordinates')
                        }
                    }
                    all_polygons_data.append(polygon_entry)
                    processed_geometries.add(geom_hash)

        except Exception as e:
             print(f"Warning: Error processing geometry for '{name}': {e}", file=sys.stderr)

    # --- Custom JSON WRITING LOGIC to compact coordinates ---
    print(f"Writing {len(all_polygons_data)} polygons to {output_json_path} with compact coordinates...")
    try:
        with open(output_json_path, 'w') as f:
            f.write("[\n") # Start the JSON array
            
            for i, entry in enumerate(all_polygons_data):
                coordinates_compact = json.dumps(
                    entry['geometry']['coordinates'], 
                    separators=(',', ':')
                )
                
                entry_copy = copy.deepcopy(entry)
                placeholder = f"__COORDS_PLACEHOLDER_{i}__"
                entry_copy['geometry']['coordinates'] = placeholder
                
                entry_pretty = json.dumps(entry_copy, indent=2)
                
                entry_final = entry_pretty.replace(
                    f"\"{placeholder}\"", 
                    coordinates_compact
                )
                
                f.write(entry_final)
                
                if i < len(all_polygons_data) - 1:
                    f.write(",\n")
            
            f.write("\n]") # End the JSON array
            
        print(f"Successfully extracted {len(all_polygons_data)} polygons to {output_json_path}")
        
    except IOError as e:
        print(f"Error: Could not write to output file '{output_json_path}': {e}", file=sys.stderr)

# --- Main execution ---
if __name__ == "__main__":
    
    # Ensure data directory exists
    os.makedirs(DATA_DIR, exist_ok=True)
    
    if not os.path.exists(TTL_FILE):
        print(f"Error: Input file '{TTL_FILE}' not found.", file=sys.stderr)
        print(f"Please copy 'iow.ttl' into the '{DATA_DIR}' directory and try again.", file=sys.stderr)
    else:
        extract_water_bodies(TTL_FILE, OUTPUT_JSON)