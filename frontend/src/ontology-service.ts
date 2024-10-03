import OntologyService from "@coefficientsystems/ontologyservice";
import config from "@/config/app-config";

export default new OntologyService(config.services.ontology, "/ontology");
