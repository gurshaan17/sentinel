# sentinel

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

To run the log worker (Pub/Sub consumer):

```bash
bun run src/worker.ts
```

# Remove old containers and images
docker-compose -f docker-compose.test.yml down

docker-compose -f docker-compose.test.yml build --no-cache

docker-compose -f docker-compose.test.yml up -d

docker logs -f sentinel

This project was created using `bun init` in bun v1.1.30. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
