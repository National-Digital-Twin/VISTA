# RDS Security Group

variable "POSTGRES_PASSWORD" {
  description = "Database password."
  sensitive   = true
  type        = string
}

data "aws_vpc" "vpc" {
  id = var.vpc_id
}

resource "aws_security_group" "rds_sg" {
  vpc_id = var.vpc_id

  ingress {
    from_port   = 5432
    to_port     = 5432
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.vpc.cidr_block]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.environment}-paralog-rds-sg"
  }
}

resource "aws_db_subnet_group" "paralog_db_subnet_group" {
  name       = "${var.environment}-main"
  subnet_ids = [var.aws_subnet_private_eu_west_2a_id, var.aws_subnet_private_eu_west_2b_id]

  tags = {
    Name = "Paralog DB subnet group"
  }
}

# PostgreSQL RDS Instance
resource "aws_db_instance" "postgresql" {
  allocated_storage                   = 20
  iam_database_authentication_enabled = true
  engine                              = "postgres"
  identifier                          = "${var.environment}-paralog"
  instance_class                      = "db.t3.micro"
  db_name                             = "paralog"
  username                            = "paralog"             # Replace with your desired username
  password                            = var.POSTGRES_PASSWORD # Replace with your secret password (use sensitive variables)
  skip_final_snapshot                 = true
  vpc_security_group_ids              = [aws_security_group.rds_sg.id]
  db_subnet_group_name                = aws_db_subnet_group.paralog_db_subnet_group.name

  tags = {
    Name = "${var.environment}-paralog-postgresql-rds"
  }
}

output "rds_endpoint" {
  value = aws_db_instance.postgresql.endpoint
}
