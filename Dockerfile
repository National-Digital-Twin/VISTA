FROM node:16-alpine as installation 

WORKDIR /app
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

FROM installation as build
COPY src src
COPY .babelrc .babelrc
RUN yarn build 


FROM node:16-alpine
WORKDIR /app
RUN mkdir dist node_modules
COPY package.json yarn.lock wait-for.sh ./
RUN yarn install --frozen-lockfile --production=true && yarn cache clean
COPY --from=build /app/dist ./dist
RUN chown -R 1000:1000 /app
USER 1000
ENV PORT ${PORT}
EXPOSE ${PORT}
CMD [ "node", "dist/index.js"]