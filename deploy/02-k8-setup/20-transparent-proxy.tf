variable "ADMIRALTY_API_KEY" {
  description = "Admiralty api key."
  sensitive   = true
  type        = string
}


variable "REALTIME_TRAINS_API_KEY" {
  description = "Trains API key."
  sensitive   = true
  type        = string
}

variable "OS_API_KEY" {
  description = "OS vector API key."
  sensitive   = true
  type        = string
}

data "aws_ecr_image" "paralog_transparent_proxy_image" {
  repository_name = "paralog/${var.environment}-transparent-proxy"
  image_tag       = "latest"
}

resource "kubernetes_manifest" "paralog_transparent_proxy_deployment" {
  manifest = yamldecode(templatefile(
    "./20-transparent-proxy-deployment.yaml", {
      ADMIRALTY_API_KEY       = var.ADMIRALTY_API_KEY,
      REALTIME_TRAINS_API_KEY = var.REALTIME_TRAINS_API_KEY,
      OS_API_KEY              = var.OS_API_KEY
      IMAGE_DIGEST            = data.aws_ecr_image.paralog_transparent_proxy_image.image_digest,
      repository_name         = data.aws_ecr_image.paralog_transparent_proxy_image.repository_name,
      image_tag               = data.aws_ecr_image.paralog_transparent_proxy_image.image_tag,
      ENVIRONMENT             = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

resource "kubernetes_manifest" "paralog_transparent_proxy_service" {
  manifest = yamldecode(templatefile(
    "./20-transparent-proxy-service.yaml", {
      ENVIRONMENT = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

data "aws_lb" "paralog_transparent_proxy_lb" {
  tags = {
    "kubernetes.io/service-name" = "paralog/${var.environment}-transparent-proxy"
  }
  depends_on = [kubernetes_manifest.paralog_transparent_proxy_service]
}

data "aws_lb_listener" "paralog_transparent_proxy_lb_listener" {
  load_balancer_arn = data.aws_lb.paralog_transparent_proxy_lb.arn
  port              = 5013
  depends_on        = [kubernetes_manifest.paralog_transparent_proxy_service]
}

resource "aws_apigatewayv2_integration" "paralog_transparent_proxy_admiralty_tidal_integration" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.paralog_transparent_proxy_lb_listener.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/admiralty-tidal-foundation/$request.path.proxy"
  }
}

resource "aws_apigatewayv2_route" "paralog_transparent_proxy_admiralty_tidal" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /transparent-proxy/admiralty-tidal-foundation/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.paralog_transparent_proxy_admiralty_tidal_integration.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.request_authorizer.id
}

resource "aws_apigatewayv2_integration" "paralog_transparent_proxy_realtime_trains_integration" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.paralog_transparent_proxy_lb_listener.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/realtime-trains/$request.path.proxy"
  }
  depends_on = [kubernetes_manifest.paralog_transparent_proxy_service]
}

resource "aws_apigatewayv2_route" "paralog_transparent_proxy_realtime_trains" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /transparent-proxy/realtime-trains/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.paralog_transparent_proxy_realtime_trains_integration.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.request_authorizer.id
}

resource "aws_apigatewayv2_integration" "paralog_transparent_proxy_ordinance_survey_integration" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.paralog_transparent_proxy_lb_listener.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/os/$request.path.proxy"
  }
}

resource "aws_apigatewayv2_route" "paralog_transparent_proxy_ordinance_survey" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /transparent-proxy/os/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.paralog_transparent_proxy_ordinance_survey_integration.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.request_authorizer.id
}
