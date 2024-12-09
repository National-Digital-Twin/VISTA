data "aws_ecr_image" "frontend_image" {
  repository_name = "paralog/${var.environment}-frontend"
  image_tag       = "01"
}

resource "kubernetes_manifest" "frontend_deployment" {
  manifest = yamldecode(templatefile(
    "./19-frontend-deployment.yaml", {
      ENVIRONMENT     = var.environment,
      IMAGE_DIGEST    = data.aws_ecr_image.frontend_image.image_digest
      repository_name = data.aws_ecr_image.frontend_image.repository_name
      image_tag       = data.aws_ecr_image.frontend_image.image_tag,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

resource "kubernetes_manifest" "frontend_service" {
  manifest = yamldecode(templatefile("./19-frontend-service.yaml", {
    ENVIRONMENT = var.environment,
  }))
  depends_on = [kubernetes_namespace.paralog]
}

data "aws_lb" "frontend_lb" {
  tags = {
    "kubernetes.io/service-name" = "paralog/${var.environment}-frontend"
  }
  depends_on = [kubernetes_manifest.frontend_deployment, kubernetes_manifest.frontend_service]
}

data "aws_lb_listener" "frontend_lb_listner" {
  load_balancer_arn = data.aws_lb.frontend_lb.arn
  port              = 80
  depends_on        = [data.aws_lb.frontend_lb]
}

resource "aws_apigatewayv2_integration" "web" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.frontend_lb_listner.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
}


resource "aws_apigatewayv2_route" "frontend" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.web.id}"
}
