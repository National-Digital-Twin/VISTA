resource "aws_security_group" "vpc_link" {
  name   = "${var.environment}-vpc-link"
  vpc_id = data.terraform_remote_state.init.outputs.vpc-id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

output "aws_security_group_vpc_link_id" {
  value = aws_security_group.vpc_link.id
}

resource "aws_apigatewayv2_vpc_link" "paralog_vpc_link" {
  name               = "${var.environment}_paralog_vpc_link"
  security_group_ids = [aws_security_group.vpc_link.id]
  subnet_ids = [
    data.terraform_remote_state.init.outputs.public-private-subnet-2a_id,
    data.terraform_remote_state.init.outputs.public-private-subnet-2b_id
  ]
}
