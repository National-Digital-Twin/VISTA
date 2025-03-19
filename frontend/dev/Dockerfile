FROM ghcr.io/national-digital-twin/secure-agent-graph:0.90.0

COPY --chown=fuseki ./config/config.ttl /fuseki/config
COPY --chown=fuseki ./config/attribute-store.ttl /fuseki/config
COPY --chown=fuseki ./data/iow.ttl /fuseki/data/iow.ttl
COPY --chown=fuseki ./data/ontology.ttl /fuseki/data/ontology.ttl
COPY --chown=fuseki ./kafka/consumer.properties /fuseki/kafka/consumer.properties
COPY --chown=fuseki ./upload_data.sh /fuseki/upload_data.sh
