FROM node:20-alpine AS builder

# Set the working directory in the container
WORKDIR /app

ARG MAP_TILER_TOKEN
# ARG ORDNANCE_SURVEY_API_KEY
ARG MET_OFFICE_GLOBAL_SPOT_API_KEY
# ARG CANNY_APP_ID
# ARG CANNY_BOARD_TOKEN
ARG NPM_TOKEN

ARG YARN_REGISTRY_URL="https://registry.yarnpkg.com/"
ARG GITHUB_REGISTRY_URL="https://npm.pkg.github.com/"

RUN echo "registry=${YARN_REGISTRY_URL}" > .npmrc && \
    echo "@national-digital-twin:registry=${GITHUB_REGISTRY_URL}" >> .npmrc && \
    echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc

# remove
# RUN echo "registry=https://registry.yarnpkg.com/" > .npmrc && \
#     echo "@national-digital-twin:registry=https://npm.pkg.github.com/" >> .npmrc && \
#     echo "//npm.pkg.github.com/:_authToken=${NPM_TOKEN}" >> .npmrc

RUN yarn cache clean

COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
RUN rm -f .npmrc

ENV VITE_ONTOLOGY_SERVICE_URL="/ontology"
ENV VITE_PARALOG_API_URL="/paralog"

ENV VITE_MAP_TILER_TOKEN=$MAP_TILER_TOKEN
# ENV VITE_ORDNANCE_SURVEY_API_KEY=$ORDNANCE_SURVEY_API_KEY
# ENV VITE_AUTH_TEST_URL="/ndtp-python/ping/"
ENV VITE_MET_OFFICE_GLOBAL_SPOT_API_KEY=$MET_OFFICE_GLOBAL_SPOT_API_KEY
# ENV VITE_CANNY_APP_ID=$CANNY_APP_ID
# ENV VITE_CANNY_BOARD_TOKEN=$CANNY_BOARD_TOKEN

COPY . .
RUN yarn build

# Start a new stage from scratch
FROM nginx as runner

# Copy the built files from the builder stage to the runner stage
COPY --from=builder /app/dist /usr/share/nginx/html
