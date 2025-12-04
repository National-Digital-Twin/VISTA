sonarqube-up:
	docker run -d -p 9000:9000 -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true --name sonarqube sonarqube:25.1.0.102122-community

run-sonar-scan:
	docker run \
		--rm \
		--network="host" \
		-v ${PWD}/${REPOSITORY}:/usr/src \
		-e SONAR_HOST_URL="http://localhost:9000" \
		-e SONAR_SCANNER_OPTS="-Dsonar.projectKey=${SONAR_PROJECT_KEY} -Dsonar.sources="${SOURCE_CODE_DIR}" -Dsonar.tests=/usr/src/${TEST_DIR}" \
		-e SONAR_TOKEN="${SONAR_TOKEN}" \
		sonarsource/sonar-scanner-cli

vista-resources-up:
	docker compose -f frontend/dev/docker-compose.yaml up -d

vista-resources-down:
	docker compose -f frontend/dev/docker-compose.yaml down

run-frontend:
	yarn --cwd "frontend/" start --host

run-backend:
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py runserver

run-backend-migrations:
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py makemigrations
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py migrate

populate-data:
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py loaddata asset_categories.json
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py loaddata asset_subcategories.json
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py loaddata data_sources.json
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py loaddata asset_types.json
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py loaddata exposure_layer_types.json
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py loaddata scenarios.json
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py refresh_data
	cd backend && direnv exec . poetry run python vista-python-api/src/manage.py refresh_dependency_data

lint-backend:
	cd backend && direnv exec . poetry run ruff format .
	cd backend && direnv exec . poetry run ruff check . --fix
	cd backend && direnv exec . poetry run bandit -r -q . -lll

lint-frontend:
	cd frontend && npx prettier --check "src/**/*.{js,ts,tsx}" --write
	cd frontend && npx sort-package-json --check
