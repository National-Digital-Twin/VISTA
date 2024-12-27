import { OntologyService } from "@national-digital-twin/ontologyservice";
import config from "@/config/app-config";

export default new OntologyService(config.services.ontology, "ontology");
