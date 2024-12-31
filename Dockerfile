FROM oven/bun:latest AS base
WORKDIR /usr/app

FROM base AS install
RUN mkdir -p /temp
COPY package.json bun.lockb /temp/
RUN cd /temp && bun install --frozen-lockfile --production

FROM base AS prerelease
COPY --from=install /temp/node_modules node_modules
COPY . .
RUN bun build src/index.ts --target=bun --outdir=dist

FROM base AS release
COPY --from=prerelease /usr/app/dist .

USER bun
EXPOSE 3000/tcp
ENTRYPOINT [ "bun", "run", "-b", "index.js" ]
