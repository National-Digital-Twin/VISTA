terraform {
  backend "s3" {
    bucket = var.s3_state_bucket
    key    = var.s3_state_file
    region = "eu-west-2"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.81.0"
    }
    kubectl = {
      source  = "alekc/kubectl"
      version = ">= 2.0.0"
    }
  }
}

provider "kubernetes" {
  host                   = aws_eks_cluster.cluster.endpoint
  cluster_ca_certificate = base64decode(aws_eks_cluster.cluster.certificate_authority[0].data)
  exec {
    api_version = "client.authentication.k8s.io/v1beta1"
    args        = ["eks", "get-token", "--cluster-name", aws_eks_cluster.cluster.name]
    command     = "aws"
  }
}

provider "helm" {
  kubernetes {
    host                   = aws_eks_cluster.cluster.endpoint
    cluster_ca_certificate = base64decode(aws_eks_cluster.cluster.certificate_authority[0].data)
    exec {
      api_version = "client.authentication.k8s.io/v1beta1"
      args        = ["eks", "get-token", "--cluster-name", aws_eks_cluster.cluster.id]
      command     = "aws"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

variable "cluster_version" {
  default = "1.31"
}

variable "environment" {

  description = "Prefix for resource names."
}

variable "s3_state_file" {
  description = "State file name for the env."
}

variable "s3_state_bucket" {
  description = "State file name for the env."
}

variable "application" {
  description = "Application Name"
}

locals {
  cluster_name = "${var.application}-${var.environment}"
}
