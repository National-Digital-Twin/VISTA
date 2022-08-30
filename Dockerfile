FROM node:16-alpine as installation 

WORKDIR /app
ARG NPM_TOKEN
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json yarn.lock ./

RUN npm config set @telicent-io:registry=https://npm.pkg.github.com/
RUN npm config set //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
RUN yarn install --frozen-lockfile && yarn cache clean

FROM installation as build
COPY src src
COPY public public
RUN yarn build 


FROM node:16-alpine
WORKDIR /app
RUN mkdir dist node_modules
ARG NPM_TOKEN
RUN npm config set @telicent-io:registry=https://npm.pkg.github.com/
RUN npm config set //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
RUN yarn install --frozen-lockfile --production=true && yarn cache clean
COPY --from=build /app/build ./build
RUN chown -R 1000:1000 /app
USER 1000
ENV PORT ${PORT}
EXPOSE ${PORT}
CMD [ "node", "dist/index.js"]