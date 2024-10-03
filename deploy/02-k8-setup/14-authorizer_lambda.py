import os
import logging


def lambda_handler(event, context):
    response = {
        "isAuthorized": False,
        "context": {
            "stringKey": "value",
            "numberKey": 1,
            "booleanKey": True,
            "arrayKey": ["value1", "value2"],
            "mapKey": {"value1": "value2"},
        },
    }

    try:
        if (
            event["headers"]["authorization"]
            == f"Bearer {os.environ['AUTHORIZATION_TOKEN']}"
        ):
            response = {
                "isAuthorized": True,
                "context": {
                    "stringKey": "value",
                    "numberKey": 1,
                    "booleanKey": True,
                    "arrayKey": ["value1", "value2"],
                    "mapKey": {"value1": "value2"},
                },
            }
            logging.info("Authorization accepted")
            return response
        else:
            logging.error("Authorization denied")
            return response
    except BaseException:
        logging.error("Authorization denied")
        return response
