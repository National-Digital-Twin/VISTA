FROM ghcr.io/national-digital-twin/secure-agent-graph:0.90.0
USER fuseki

COPY --chown=fuseki --chmod=755 ./config/config.ttl /fuseki/config
COPY --chown=fuseki --chmod=755 ./config/attribute-store.ttl /fuseki/config
COPY --chown=fuseki --chmod=755 ./data/iow.ttl /fuseki/data/iow.ttl
COPY --chown=fuseki --chmod=755 ./data/ontology.ttl /fuseki/data/ontology.ttl
COPY --chown=fuseki --chmod=755 ./kafka/consumer.properties /fuseki/kafka/consumer.properties
