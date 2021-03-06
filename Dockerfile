# build environment
FROM node:13.12.0-alpine as build
WORKDIR /srv/app
ENV PATH /node_modules/.bin:$PATH
COPY package.json ./
# RUN npm ci --silent
RUN npm install --silent
RUN npm install react-scripts@3.4.1 -g --silent
COPY . ./
RUN npm run build


# production environment
FROM nginx:stable-alpine
COPY --from=build /srv/app /usr/share/nginx/html
# new
COPY docker/nginx/nginx.conf /etc/nginx/conf.d/default.conf
# EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]