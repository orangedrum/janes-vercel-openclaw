.PHONY: contract test lint typecheck build verify audit-verifier-surface

contract:
	node scripts/check-verifier-contract.mjs

test:
	node scripts/test.mjs

lint:
	npm run lint

typecheck:
	npm run typecheck

build:
	npm run build

verify:
	node scripts/verify.mjs

audit-verifier-surface:
	node scripts/audit-verifier-surface.mjs
