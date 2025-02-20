data "aws_ecr_image" "smart_cache_paralog_api_image" {
  repository_name = "paralog/telicent-smart-cache-paralog-api"
  image_tag       = "1.1.7"
}

resource "kubernetes_manifest" "smart_cache_paralog_api_deployment" {
  manifest = yamldecode(templatefile(
    "./17-smart-cache-paralog-api-deployment.yaml", {
      IMAGE_DIGEST    = data.aws_ecr_image.smart_cache_paralog_api_image.image_digest,
      repository_name = data.aws_ecr_image.smart_cache_paralog_api_image.repository_name,
      image_tag       = data.aws_ecr_image.smart_cache_paralog_api_image.image_tag,
      ENVIRONMENT     = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

resource "kubernetes_manifest" "smart_cache_paralog_api_service" {
  manifest = yamldecode(templatefile(
    "./17-smart-cache-paralog-api-service.yaml", {
      ENVIRONMENT = var.environment
  }))
  depends_on = [kubernetes_namespace.paralog]
}

data "aws_lb" "smart_cache_paralog_api_lb" {
  tags = {
    "kubernetes.io/service-name" = "paralog/${var.environment}-smart-cache-paralog-api"
  }
  depends_on = [kubernetes_manifest.smart_cache_paralog_api_deployment, kubernetes_manifest.smart_cache_paralog_api_service]
}

data "aws_lb_listener" "smart_cache_paralog_api_lb_listner" {
  load_balancer_arn = data.aws_lb.smart_cache_paralog_api_lb.arn
  port              = 4001
}

resource "aws_apigatewayv2_integration" "smart_cache_paralog_api" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.smart_cache_paralog_api_lb_listner.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/$request.path.proxy"
  }
}

resource "aws_apigatewayv2_route" "smart_cache_paralog_api" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /paralog/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.smart_cache_paralog_api.id}"
}
