# build stage
FROM node:lts-alpine as build-stage
ARG BUILD_MODE
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run $BUILD_MODE

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
# custom nginx conf to work with vue router in HTML5 history mode
COPY nginx-vue.conf /etc/nginx/conf.d/default.conf
COPY entrypoint.sh /usr/share/nginx/
RUN chmod +x /usr/share/nginx/entrypoint.sh
ENTRYPOINT [ "/usr/share/nginx/entrypoint.sh" ]
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
