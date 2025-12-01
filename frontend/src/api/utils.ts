import config from '@/config/app-config';

const createParalogEndpoint = (path: string) => `${config.api.url}/${path}`;
// e.g /asset/parts
const createOntologyServiceEndpoint = (path: string) => `${config.services.ontology}/${path}`;
const createNdtpPythonEndpoint = (path: string) => `${config.services.ndtpPythonBaseUrl}/${path}`;

const fetchOptions = {
    headers: {
        'Content-Type': 'application/json',
    },
};

export { createParalogEndpoint, createOntologyServiceEndpoint, createNdtpPythonEndpoint, fetchOptions };
