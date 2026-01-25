# sentinel

To install dependencies:

```bash
bun install
```

To run:

```bash
bun run index.ts
```

# Remove old containers and images
docker-compose -f docker-compose.test.yml down

# Rebuild
docker-compose -f docker-compose.test.yml build --no-cache

# Start
docker-compose -f docker-compose.test.yml up -d

# Check logs
docker logs -f sentinel

This project was created using `bun init` in bun v1.1.30. [Bun](https://bun.sh) is a fast all-in-one JavaScript runtime.
