terraform {
  backend "s3" {
    bucket = var.s3_state_bucket
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

variable "s3_state_bucket" {
  description = "State file name for the env."
}

variable "application" {
  description = "Application Name"
}

locals {
  cluster_name = "${var.application}-${var.environment}"
}
