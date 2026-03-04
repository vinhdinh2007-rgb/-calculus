FROM node:20-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci && npm cache clean --force

COPY . .
ARG VITE_INSFORGE_BASE_URL
ARG VITE_INSFORGE_ANON_KEY
ENV VITE_INSFORGE_BASE_URL=$VITE_INSFORGE_BASE_URL
ENV VITE_INSFORGE_ANON_KEY=$VITE_INSFORGE_ANON_KEY
RUN npm run build

FROM nginx:1.29-alpine AS runtime

# Run Nginx as a non-root user for security
RUN chown -R nginx:nginx /usr/share/nginx/html /var/cache/nginx /var/log/nginx /etc/nginx/conf.d
RUN touch /var/run/nginx.pid && chown -R nginx:nginx /var/run/nginx.pid

# Switch to standard unprivileged user
USER nginx

# Copy custom configuration and compiled static assets
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget -q -O - http://localhost:8080/ || exit 1
