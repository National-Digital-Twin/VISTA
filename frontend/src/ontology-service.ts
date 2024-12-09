import { OntologyService } from "@telicent-oss/ontologyservice";
import config from "@/config/app-config";

export default new OntologyService(config.services.ontology, "/ontology");