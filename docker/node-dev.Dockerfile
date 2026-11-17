# Imagen de desarrollo compartida por frontend y backend.
# El código se monta desde el host; node_modules vive en un volumen de Docker
# para no instalar nada en el servidor.
FROM node:22.20.0-bookworm-slim

RUN mkdir -p /app/node_modules && chown -R node:node /app
USER node
WORKDIR /app
