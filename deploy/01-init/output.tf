output "vpc-id" {
  value = aws_vpc.main.id
}

output "public-private-subnet-2a_id" {
  value = aws_subnet.private-eu-west-2a.id
}

output "public-private-subnet-2b_id" {
  value = aws_subnet.private-eu-west-2b.id
}