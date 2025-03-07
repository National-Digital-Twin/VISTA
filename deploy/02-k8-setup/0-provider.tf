terraform {
  backend "s3" {
    bucket = var.s3_state_bucket
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

data "terraform_remote_state" "init" {
  backend = "s3"

  config = {
    bucket = var.s3_state_bucket
    key    = "init/demo-terraform.tfstate"
    region = "eu-west-2"
  }
}



provider "aws" {
  region = "eu-west-2"
}

data "aws_eks_cluster" "eks_cluster" {
  name = local.cluster_name
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
  cluster_name = "${var.application}-${var.environment}"
}

# variable "aws_security_group_vpc_link_id" {
#   description = "VPC Link id from init stage."
# }



# variable "aws_apigatewayv2_api_main_id" {
#   description = "aws_apigatewayv2_api.main.id from previous stage output."
# }

# variable "aws_apigatewayv2_authorizer_request_authorizer_id" {
#   description = "aws_apigatewayv2_authorizer.request_authorizer.id from previous stage output."
# }

variable "s3_state_bucket" {
  description = "State file name for the env."
}

variable "application" {
  description = "Application Name"
}