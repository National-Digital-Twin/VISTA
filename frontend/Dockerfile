FROM node:22-alpine AS builder

# Set the working directory in the container
WORKDIR /app

ARG MAP_TILER_TOKEN
ARG NPM_TOKEN

RUN echo "registry=https://registry.npmjs.org/" > .npmrc && \
    echo "@national-digital-twin:registry=https://npm.pkg.github.com/" >> .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc

RUN npm cache clean --force

COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
RUN rm -f .npmrc

ENV VITE_ONTOLOGY_SERVICE_URL="/transparent-proxy"
ENV VITE_VISTA_API_URL="/vista"

ENV VITE_MAP_TILER_TOKEN=$MAP_TILER_TOKEN

COPY . .
RUN npm run build

# Start a new stage from scratch
FROM nginxinc/nginx-unprivileged:1.29-alpine3.22 AS runner

# Copy the built files from the builder stage to the runner stage
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
