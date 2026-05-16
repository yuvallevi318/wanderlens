"""
WanderLens – Bedrock Proxy Lambda
"""
import json, os, boto3

# Try cross-region first, fall back to direct if needed
MODEL_ID       = os.environ.get("BEDROCK_MODEL_ID", "us.anthropic.claude-sonnet-4-20250514-v1:0")
FALLBACK_MODEL = "anthropic.claude-3-5-sonnet-20241022-v2:0"
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "*")
bedrock        = boto3.client("bedrock-runtime")

def get_method(event):
    return (event.get("httpMethod") or
            event.get("requestContext", {}).get("http", {}).get("method", "")).upper()

def invoke(model_id, bedrock_body):
    response = bedrock.invoke_model(
        modelId=model_id,
        contentType="application/json",
        accept="application/json",
        body=json.dumps(bedrock_body)
    )
    return json.loads(response["body"].read())

def handler(event, context):
    print("METHOD:", get_method(event))

    if get_method(event) == "OPTIONS":
        return cors_response(200, "")

    raw_body = event.get("body") or "{}"
    if event.get("isBase64Encoded"):
        import base64
        raw_body = base64.b64decode(raw_body).decode("utf-8")

    try:
        body = json.loads(raw_body)
    except Exception as e:
        return cors_response(400, json.dumps({"error": "Invalid JSON: " + str(e)}))

    messages   = body.get("messages")
    max_tokens = int(body.get("max_tokens", 600))

    if not messages:
        return cors_response(400, json.dumps({"error": "messages is required"}))

    bedrock_body = {
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": max_tokens,
        "messages": messages
    }

    # Try primary model, fall back if it fails
    try:
        result = invoke(MODEL_ID, bedrock_body)
        print("OK with primary model")
        return cors_response(200, json.dumps(result))
    except Exception as e1:
        print(f"Primary model failed ({MODEL_ID}): {e1}, trying fallback")
        try:
            result = invoke(FALLBACK_MODEL, bedrock_body)
            print("OK with fallback model")
            return cors_response(200, json.dumps(result))
        except Exception as e2:
            print(f"Fallback also failed: {e2}")
            return cors_response(502, json.dumps({"error": str(e2)}))

def cors_response(status_code, body):
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
            "Access-Control-Allow-Headers": "Content-Type",
            "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        "body": body
    }
