variable "AUTHORIZATION_TOKEN" {
  description = "Bearer Authorizer Token"
  type        = string
  sensitive   = true
}

resource "aws_iam_role" "lambda_role" {
  name = "${var.environment}-lambda_role"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Create the Lambda function code archive
data "archive_file" "lambda_zip_auth" {
  type        = "zip"
  source_file = "./14-authorizer_lambda.py"
  output_path = "./authorizer_lambda.zip"
}

resource "aws_lambda_function" "paralog_api_authorizer" {
  function_name = "${var.environment}-paralog_api_authorizer"
  role          = aws_iam_role.lambda_role.arn
  handler       = "14-authorizer_lambda.lambda_handler"
  runtime       = "python3.8"
  timeout       = 60

  filename         = data.archive_file.lambda_zip_auth.output_path
  source_code_hash = filebase64sha256(data.archive_file.lambda_zip_auth.output_path)
  environment {
    variables = {
      AUTHORIZATION_TOKEN = var.AUTHORIZATION_TOKEN
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_caller_identity" "current" {}

# Grant API Gateway permissions to invoke the Lambda authorizer
resource "aws_lambda_permission" "api_gateway_invoke" {
  function_name = aws_lambda_function.paralog_api_authorizer.function_name
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "arn:aws:execute-api:eu-west-2:${data.aws_caller_identity.current.account_id}:${aws_apigatewayv2_api.main.id}/*/*"
}

resource "aws_apigatewayv2_authorizer" "request_authorizer" {
  api_id                            = aws_apigatewayv2_api.main.id
  authorizer_type                   = "REQUEST"
  identity_sources                  = ["$request.header.Authorization"]
  name                              = "${var.environment}-lambda-authorizer"
  authorizer_uri                    = aws_lambda_function.paralog_api_authorizer.invoke_arn
  authorizer_payload_format_version = "2.0"
  enable_simple_responses           = true
  authorizer_result_ttl_in_seconds  = 0
}

output "aws_apigatewayv2_authorizer_request_authorizer_id" {
  value = aws_apigatewayv2_authorizer.request_authorizer.id
}
