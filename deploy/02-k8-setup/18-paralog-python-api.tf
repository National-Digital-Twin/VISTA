variable "SERVICE_AWS_ACCESS_KEY_ID" {
  description = "Service user access key."
  sensitive   = true
  type        = string
}

variable "SERVICE_AWS_SECRET_ACCESS_KEY" {
  description = "Service user secret access key."
  sensitive   = true
  type        = string
}

variable "DJANGO_SECRET_KEY" {
  description = "Django secret key."
  sensitive   = true
  type        = string
}

data "aws_ecr_image" "paralog_python_api_image" {
  repository_name = "paralog/${var.environment}-paralog-python-api"
  image_tag       = "latest"
}

# resource "kubernetes_manifest" "paralog_python_api_deployment" {
#   manifest = yamldecode(templatefile(
#     "./18-paralog-python-api-deployment.yaml", {
#       DJANGO_SECRET_KEY     = var.DJANGO_SECRET_KEY,
#       DB_HOSTNAME           = aws_db_instance.postgresql.address,
#       AWS_ACCESS_KEY_ID     = var.SERVICE_AWS_ACCESS_KEY_ID,
#       AWS_SECRET_ACCESS_KEY = var.SERVICE_AWS_SECRET_ACCESS_KEY,
#       AWS_DEFAULT_REGION    = "eu-west-2",
#       ENVIRONMENT           = var.environment,
#       NAME                  = "${var.environment}-paralog-python-api",
#       CONTAINER_PORT        = 8000,
#       IMAGE_DIGEST          = data.aws_ecr_image.paralog_python_api_image.image_digest,
#       repository_name       = data.aws_ecr_image.paralog_python_api_image.repository_name,
#       image_tag             = data.aws_ecr_image.paralog_python_api_image.image_tag,
#   }))
#   depends_on = [kubernetes_namespace.paralog]
# }

resource "kubernetes_deployment" "paralog_python_api_deployment" {
  metadata {
    name      = "${var.environment}-paralog-python-api"
    namespace = kubernetes_namespace.paralog.metadata[0].name
  }

  spec {
    replicas = 1

    selector {
      match_labels = {
        "io.kompose.service" = "${var.environment}-paralog-python-api"
      }
    }

    template {
      metadata {
        name      = "${var.environment}-paralog-python-api"
        namespace = kubernetes_namespace.paralog.metadata[0].name
        labels = {
          "io.kompose.service" = "${var.environment}-paralog-python-api"
        }
      }
      spec {
        container {
          name  = "${var.environment}-paralog-python-api"
          image = "503561419905.dkr.ecr.eu-west-2.amazonaws.com/${data.aws_ecr_image.paralog_python_api_image.repository_name}:${data.aws_ecr_image.paralog_python_api_image.image_tag}"

          image_pull_policy = "Always"

          port {
            container_port = 8000
          }

          env {
            name  = "IMAGE_DIGEST"
            value = data.aws_ecr_image.paralog_python_api_image.image_digest
          }

          env {
            name  = "DJANGO_SECRET_KEY"
            value = var.DJANGO_SECRET_KEY
          }

          env {
            name  = "DB_HOSTNAME"
            value = aws_db_instance.postgresql.address
          }

          env {
            name  = "ENVIRONMENT"
            value = "production"
          }

          env {
            name  = "AWS_DEFAULT_REGION"
            value = "eu-west-2"
          }

          env {
            name  = "AWS_ACCESS_KEY_ID"
            value = var.SERVICE_AWS_ACCESS_KEY_ID
          }

          env {
            name  = "AWS_SECRET_ACCESS_KEY"
            value = var.SERVICE_AWS_SECRET_ACCESS_KEY
          }
        }

        restart_policy = "Always"
      }
    }
  }
}

# resource "kubernetes_manifest" "paralog_python_api_job" {
#   manifest = yamldecode(templatefile(
#     "./18-paralog-python-api-job.yaml", {
#       DJANGO_SECRET_KEY     = var.DJANGO_SECRET_KEY
#       DB_HOSTNAME           = aws_db_instance.postgresql.address,
#       AWS_ACCESS_KEY_ID     = var.SERVICE_AWS_ACCESS_KEY_ID,
#       AWS_SECRET_ACCESS_KEY = var.SERVICE_AWS_SECRET_ACCESS_KEY,
#       AWS_DEFAULT_REGION    = "eu-west-2",
#       ENVIRONMENT           = "production",
#       NAME                  = "${var.environment}-paralog-python-api-job"
#       IMAGE_DIGEST          = data.aws_ecr_image.paralog_python_api_image.image_digest
#       repository_name       = data.aws_ecr_image.paralog_python_api_image.repository_name,
#       image_tag             = data.aws_ecr_image.paralog_python_api_image.image_tag,
#       POSTGRES_PASSWORD     = var.POSTGRES_PASSWORD,
#   }))
#   depends_on = [kubernetes_deployment.paralog_python_api_deployment]
# }

resource "kubernetes_job" "paralog_python_api_job" {
  metadata {
    name      = "${var.environment}-paralog-python-api-job"
    namespace = "paralog"
  }
  timeouts {
    create = "1h"
    update = "1h"
    delete = "20m"
  }

  spec {
    template {
      metadata {
        labels = {
          job-name = "${var.environment}-paralog-python-api-job"
        }
      }

      spec {
        container {
          name  = "${var.environment}-paralog-python-api-job"
          image = "503561419905.dkr.ecr.eu-west-2.amazonaws.com/${data.aws_ecr_image.paralog_python_api_image.repository_name}:${data.aws_ecr_image.paralog_python_api_image.image_tag}"
          command = ["./entrypoint.sh"]

          env {
            name  = "IMAGE_DIGEST"
            value = data.aws_ecr_image.paralog_python_api_image.image_digest
          }

          env {
            name  = "DJANGO_SECRET_KEY"
            value = var.DJANGO_SECRET_KEY
          }

          env {
            name  = "DB_HOSTNAME"
            value = aws_db_instance.postgresql.address
          }

          env {
            name  = "POSTGRES_PASSWORD"
            value = var.POSTGRES_PASSWORD
          }

          env {
            name  = "ENVIRONMENT"
            value = var.environment
          }

          env {
            name  = "AWS_DEFAULT_REGION"
            value = "eu-west-2"
          }

          env {
            name  = "AWS_ACCESS_KEY_ID"
            value = var.SERVICE_AWS_ACCESS_KEY_ID
          }

          env {
            name  = "AWS_SECRET_ACCESS_KEY"
            value = var.SERVICE_AWS_SECRET_ACCESS_KEY
          }
        }

        restart_policy = "Never"
      }
    }

    ttl_seconds_after_finished = 10
    backoff_limit              = 4
  }

  depends_on = [kubernetes_deployment.paralog_python_api_deployment]
}

resource "kubernetes_manifest" "paralog_python_api_service" {
  manifest = yamldecode(templatefile(
    "./18-paralog-python-api-service.yaml", {
      DJANGO_SECRET_KEY     = var.DJANGO_SECRET_KEY
      DB_HOSTNAME           = aws_db_instance.postgresql.address,
      AWS_ACCESS_KEY_ID     = var.SERVICE_AWS_ACCESS_KEY_ID,
      AWS_SECRET_ACCESS_KEY = var.SERVICE_AWS_SECRET_ACCESS_KEY,
      AWS_DEFAULT_REGION    = "eu-west-2",
      ENVIRONMENT           = var.environment,
      NAME                  = "${var.environment}-paralog-python-api-job"
      IMAGE_DIGEST          = data.aws_ecr_image.paralog_python_api_image.image_digest
  }))
  depends_on = [kubernetes_namespace.paralog]
}

resource "aws_iam_role" "paralog_eks_rds_access_role" {
  name = "${var.environment}-paralog-eks-rds-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Principal = {
          Federated = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:oidc-provider/${data.aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer}"
        },
        Action = "sts:AssumeRoleWithWebIdentity",
        Condition = {
          StringEquals = {
            "${data.aws_eks_cluster.eks_cluster.identity[0].oidc[0].issuer}:sub" = "system:serviceaccount:default:app-service-account"
          }
        }
      }
    ]
  })
}


resource "aws_iam_role_policy" "eks_rds_access_policy" {
  name = "${var.environment}-eks-rds-access-policy"
  role = aws_iam_role.paralog_eks_rds_access_role.id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "rds:DescribeDBInstances",
          "rds:Connect"
        ],
        Resource = "*"
      }
    ]
  })
}


resource "aws_iam_instance_profile" "eks_rds_access_instance_profile" {
  name = "${var.environment}-eks-rds-access-instance-profile"
  role = aws_iam_role.paralog_eks_rds_access_role.name
}

resource "kubernetes_service_account" "paralog_app_service_account" {
  metadata {
    name      = "${var.environment}-app-service-account"
    namespace = "paralog"
    annotations = {
      "eks.amazonaws.com/role-arn" = aws_iam_role.paralog_eks_rds_access_role.arn
    }
  }
}

data "aws_lb" "paralog_python_api_lb" {
  tags = {
    "kubernetes.io/service-name" = "paralog/${var.environment}-paralog-python-api"
  }
  depends_on = [kubernetes_manifest.paralog_python_api_service, kubernetes_deployment.paralog_python_api_deployment]
}

data "aws_lb_listener" "paralog_python_api_lb_listner" {
  load_balancer_arn = data.aws_lb.paralog_python_api_lb.arn
  port              = 8000
}


resource "aws_apigatewayv2_integration" "paralog_python_api" {
  api_id = aws_apigatewayv2_api.main.id

  integration_uri    = data.aws_lb_listener.paralog_python_api_lb_listner.arn
  integration_type   = "HTTP_PROXY"
  integration_method = "ANY"
  connection_type    = "VPC_LINK"
  connection_id      = aws_apigatewayv2_vpc_link.paralog_vpc_link.id
  request_parameters = {
    "overwrite:path" = "/$request.path.proxy"
  }
}

resource "aws_apigatewayv2_route" "paralog_python_api" {
  api_id             = aws_apigatewayv2_api.main.id
  route_key          = "ANY /coefficient-python/{proxy+}"
  target             = "integrations/${aws_apigatewayv2_integration.paralog_python_api.id}"
  authorization_type = "CUSTOM"
  authorizer_id      = aws_apigatewayv2_authorizer.request_authorizer.id
}
