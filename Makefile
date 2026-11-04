.PHONY: setup dev agent db-up db-migrate db-seed seed-demo lint typecheck test ci

setup: ## install everything
	pnpm install
	cd apps/agent && uv sync --all-extras

db-up: ## start Postgres + MinIO (docker)
	docker compose up -d postgres minio

db-migrate:
	pnpm db:migrate

db-seed:
	pnpm db:seed

seed-demo:
	pnpm seed:demo

dev: ## run the web app
	pnpm dev

agent: ## run the voice agent worker in dev mode
	cd apps/agent && uv run agent dev

lint:
	pnpm lint && cd apps/agent && uv run ruff check . && uv run ruff format --check .

typecheck:
	pnpm typecheck && cd apps/agent && uv run mypy src

test:
	pnpm test && cd apps/agent && uv run pytest -q

ci: lint typecheck test
