1. Run the `parse_ttl_data.py` to generate the json coodinates for the iow exposure layers. This creates `water_bodies_data.json` file (already done)
2. To start the api, run `python manage.py runserver` from the root directory (django_water_api)
3. To test the api, open terminal and run `curl -s http://127.0.0.1:8000/api/exposurelayers/ | jq`. or use Postman GET request to `http://127.0.0.1:8000/api/exposurelayers/` or run the `api_test.py`. Any option should return the json output from the `water_bodies_data.json` file.
