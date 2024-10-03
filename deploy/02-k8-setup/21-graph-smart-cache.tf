data "aws_ecr_image" "graph_smart_cache_image" {
  repository_name = "paralog/smart-cached-graph"
  image_tag       = "latest"
}

resource "kubernetes_manifest" "graph_smart_cache_deployment" {
  manifest = yamldecode(templatefile(
    "./21-graph-smart-cache-deployment.yaml", {
      IMAGE_DIGEST = data.aws_ecr_image.graph_smart_cache_image.image_digest
      ENVIRONMENT  = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

resource "kubernetes_manifest" "graph_smart_cache_service" {
  manifest = yamldecode(templatefile("./21-graph-smart-cache-service.yaml", {
    ENVIRONMENT = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

data "aws_lb" "graph_smart_cache_lb" {
  tags = {
    "kubernetes.io/service-name" = "paralog/${var.environment}-graph-smart-cache"
  }
  depends_on = [kubernetes_manifest.graph_smart_cache_deployment, kubernetes_manifest.graph_smart_cache_service]
}

data "aws_lb_listener" "graph_smart_cache_lb_listner" {
  load_balancer_arn = data.aws_lb.graph_smart_cache_lb.arn
  port              = 3030
}

resource "aws_apigatewayv2_integration" "graph_smart_cache" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.graph_smart_cache_lb_listner.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/$request.path.proxy"
  }
}


resource "aws_apigatewayv2_route" "graph_smart_cache" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /ontology/{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.graph_smart_cache.id}"
  # This is an un-authenticated servie.
}
