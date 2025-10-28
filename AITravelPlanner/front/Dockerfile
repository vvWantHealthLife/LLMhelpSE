# Build stage (parameterized base image)
ARG BASE_NODE_IMAGE=node:18-alpine
ARG BASE_NGINX_IMAGE=nginx:alpine
FROM ${BASE_NODE_IMAGE} AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Runtime stage (parameterized base image)
FROM ${BASE_NGINX_IMAGE}
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost || exit 1
ENTRYPOINT ["nginx"]
CMD ["-g", "daemon off;"]