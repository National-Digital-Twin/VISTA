
resource "aws_subnet" "private-eu-west-2a" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.0.0/19"
  availability_zone = "eu-west-2a"

  tags = {
    "Name"                                        = "${var.environment}-private-eu-west-2a"
    "kubernetes.io/role/internal-elb"             = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
    "karpenter.sh/discovery" = local.cluster_name
  }
}

resource "aws_subnet" "private-eu-west-2b" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.32.0/19"
  availability_zone = "eu-west-2b"

  tags = {
    "Name"                                        = "${var.environment}-private-eu-west-2b"
    "kubernetes.io/role/internal-elb"             = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
    "karpenter.sh/discovery" = local.cluster_name
  }
}

resource "aws_subnet" "public-eu-west-2a" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.64.0/19"
  availability_zone       = "eu-west-2a"
  map_public_ip_on_launch = true

  tags = {
    "Name"                                        = "${var.environment}-public-eu-west-2a"
    "kubernetes.io/role/elb"                      = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
  }
}

resource "aws_subnet" "public-eu-west-2b" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = "10.0.96.0/19"
  availability_zone       = "eu-west-2b"
  map_public_ip_on_launch = true

  tags = {
    "Name"                                        = "${var.environment}-public-eu-west-2b"
    "kubernetes.io/role/elb"                      = "1"
    "kubernetes.io/cluster/${local.cluster_name}" = "owned"
  }
}

output "aws_subnet_private_eu_west_2a_id" {
  value = aws_subnet.private-eu-west-2a.id
}

output "aws_subnet_private_eu_west_2b_id" {
  value = aws_subnet.private-eu-west-2b.id
}
