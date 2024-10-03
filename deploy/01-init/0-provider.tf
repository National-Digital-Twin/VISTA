terraform {
  backend "s3" {
    bucket = "paralog-state"
    key    = var.s3_state_file
    region = "eu-west-2"
  }
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "5.68.0"
    }
  }
}

provider "aws" {
  region = "eu-west-2"
}

variable "cluster_version" {
  default = "1.30"
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
