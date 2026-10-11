FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY index.js ./
# Without X402_PRIVATE_KEY only the free tool apercu_entreprise works.
ENTRYPOINT ["node", "index.js"]
