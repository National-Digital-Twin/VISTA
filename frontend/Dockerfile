FROM node:23-alpine AS builder

# Set the working directory in the container
WORKDIR /app

ARG MAP_TILER_TOKEN
ARG ORDNANCE_SURVEY_API_KEY
ARG MET_OFFICE_GLOBAL_SPOT_API_KEY
ARG NPM_TOKEN

RUN echo "registry=https://registry.yarnpkg.com/" > .npmrc && \
    echo "@national-digital-twin:registry=https://npm.pkg.github.com/" >> .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc

RUN yarn cache clean

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
RUN rm -f .npmrc

ENV VITE_ONTOLOGY_SERVICE_URL="/ontology"
ENV VITE_PARALOG_API_URL="/paralog"

ENV VITE_MAP_TILER_TOKEN=$MAP_TILER_TOKEN
ENV VITE_ORDNANCE_SURVEY_API_KEY=$ORDNANCE_SURVEY_API_KEY
ENV VITE_AUTH_TEST_URL="/ndtp-python/ping/"
ENV VITE_MET_OFFICE_GLOBAL_SPOT_API_KEY=$MET_OFFICE_GLOBAL_SPOT_API_KEY

COPY . .
RUN yarn build

# Start a new stage from scratch
FROM nginx:1.27-alpine as runner

# Copy the built files from the builder stage to the runner stage
COPY --from=builder /app/dist /usr/share/nginx/html
