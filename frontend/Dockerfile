FROM node:23-alpine AS builder

# Set the working directory in the container
WORKDIR /app

ARG MAP_TILER_TOKEN
ARG NPM_TOKEN

RUN echo "registry=https://registry.yarnpkg.com/" > .npmrc && \
    echo "@national-digital-twin:registry=https://npm.pkg.github.com/" >> .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc

RUN yarn cache clean

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile --ignore-scripts
RUN rm -f .npmrc

ENV VITE_ONTOLOGY_SERVICE_URL="/transparent-proxy"
ENV VITE_VISTA_API_URL="/vista"

ENV VITE_MAP_TILER_TOKEN=$MAP_TILER_TOKEN

COPY . .
RUN yarn build

# Start a new stage from scratch
FROM nginx:1.27.4 AS runner

# Copy the built files from the builder stage to the runner stage
COPY --from=builder /app/dist /usr/share/nginx/html
