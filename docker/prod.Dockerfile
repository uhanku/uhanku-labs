FROM node:22-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

EXPOSE 3000

CMD ["npm", "run", "start", "--", "--hostname", "0.0.0.0"]