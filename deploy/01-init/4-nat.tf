resource "aws_eip" "nat" {
  tags = {
    Name = "${var.environment}-nat"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public-eu-west-2a.id

  tags = {
    Name = "${var.environment}-nat"
  }

  depends_on = [aws_internet_gateway.igw]
}
