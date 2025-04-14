FROM node:23.7.0-alpine3.21

RUN corepack enable && corepack prepare pnpm@10.8.1 --activate

ENV NODE_ENV development
ENV VITE_STAGE development

WORKDIR /app

COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

EXPOSE 80

CMD ["pnpm", "vite", "dev", "--host", "0.0.0.0", "--port", "80"]
