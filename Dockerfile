FROM node:16-alpine as installation 

WORKDIR /app
ARG NPM_TOKEN
ENV cachedate=140924
ENV PATH /app/node_modules/.bin:$PATH
COPY package.json yarn.lock ./

RUN npm config set @telicent-io:registry=https://npm.pkg.github.com/
RUN npm config set //npm.pkg.github.com/:_authToken=${NPM_TOKEN}
RUN yarn install --frozen-lockfile --production && yarn cache clean

FROM installation as build
ADD src src
ADD public public
COPY craco.config.js .
RUN GENERATE_SOURCE=false yarn build 
WORKDIR /app/build
COPY ./env.sh .
COPY env.default .env

FROM nginx:stable-alpine

COPY --from=build /app/build /usr/share/nginx/html/paralog
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
WORKDIR /usr/share/nginx/html/paralog
COPY set-env.sh .
RUN apk add --no-cache bash
RUN chmod +x set-env.sh
EXPOSE 80

ENTRYPOINT [ "./set-env.sh" ]
CMD [ "nginx", "-g", "daemon off;" ]