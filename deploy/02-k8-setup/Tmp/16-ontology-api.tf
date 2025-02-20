data "aws_ecr_image" "ontology_api_image" {
  repository_name = "paralog/telicent-smart-cache-ontology"
  image_tag       = "0.0.5-rc1"
}


resource "kubernetes_manifest" "ontology_api_deployment" {
  manifest = yamldecode(templatefile(
    "./16-ontology-api-deployment.yaml", {
      IMAGE_DIGEST = data.aws_ecr_image.ontology_api_image.image_digest,
      ENVIRONMENT  = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

resource "kubernetes_manifest" "ontology_api_service" {
  manifest = yamldecode(templatefile(
    "./16-ontology-api-service.yaml", {
      ENVIRONMENT = var.environment
  }))
  depends_on = [kubernetes_namespace.paralog]
}

data "aws_lb" "ontology_api_lb" {
  tags = {
    "kubernetes.io/service-name" = "paralog/${var.environment}-ontology-api"
  }
  depends_on = [kubernetes_manifest.ontology_api_deployment, kubernetes_manifest.ontology_api_service]
}

data "aws_lb_listener" "ontology_api_lb_listner" {
  load_balancer_arn = data.aws_lb.ontology_api_lb.arn
  port              = 5007
}


data "aws_lb_listener" "smart_cache_listener" {
  load_balancer_arn = data.aws_lb.ontology_api_lb.arn
  port              = 5007
}



resource "aws_apigatewayv2_integration" "ontology_api" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.ontology_api_lb_listner.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/$request.path.proxy"
  }
}

resource "aws_apigatewayv2_route" "ontology_api" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /ontology-service/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.ontology_api.id}"
}
