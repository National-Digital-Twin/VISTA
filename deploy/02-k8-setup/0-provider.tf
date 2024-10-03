terraform {
  backend "s3" {
    bucket = "paralog-state"
    key    = var.s3_state_file
    region = "eu-west-2"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

data "aws_eks_cluster" "eks_cluster" {
  name = local.cluster_name
}

provider "kubernetes" {
  host                   = data.aws_eks_cluster.eks_cluster.endpoint
  cluster_ca_certificate = base64decode(data.aws_eks_cluster.eks_cluster.certificate_authority[0].data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", data.aws_eks_cluster.eks_cluster.name]
    command     = "aws"
  }
}

data "aws_eks_cluster" "cluster" {
  name = local.cluster_name
}


variable "environment" {
  description = "Prefix for resource names."
}

variable "s3_state_file" {
  description = "State file name for the env."
}

locals {
  cluster_name = "paralog-${var.environment}"
}

# variable "aws_security_group_vpc_link_id" {
#   description = "VPC Link id from init stage."
# }

variable "aws_subnet_private_eu_west_2a_id" {
  description = "aws_subnet.private-eu-west-2a.id from previous stage output."
}

variable "aws_subnet_private_eu_west_2b_id" {
  description = "aws_subnet.private-eu-west-2b.id from previous stage output."
}

# variable "aws_apigatewayv2_api_main_id" {
#   description = "aws_apigatewayv2_api.main.id from previous stage output."
# }

# variable "aws_apigatewayv2_authorizer_request_authorizer_id" {
#   description = "aws_apigatewayv2_authorizer.request_authorizer.id from previous stage output."
# }
variable "vpc_id" {}
