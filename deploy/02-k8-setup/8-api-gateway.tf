resource "aws_apigatewayv2_api" "main" {
  name          = "${var.environment}-main"
  protocol_type = "HTTP"
}

resource "aws_apigatewayv2_stage" "dev" {
    api_id = aws_apiga  tewayv2_api.main.id

  name        = "${var.environment}-dev"
  auto_deploy = true

}

output "aws_apigatewayv2_api_main_id" {
  value = aws_apigatewayv2_api.main.id
}
