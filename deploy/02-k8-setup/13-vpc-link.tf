resource "aws_security_group" "vpc_link" {
  name   = "${var.environment}-vpc-link"
  vpc_id = var.vpc_id

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
    var.aws_subnet_private_eu_west_2a_id,
    var.aws_subnet_private_eu_west_2b_id
  ]
}
