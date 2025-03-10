resource "aws_iam_role" "eks-cluster" {
  name = "${var.environment}-eks-cluster-paralog"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "eks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
POLICY
}

resource "aws_iam_role_policy_attachment" "amazon-eks-cluster-policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks-cluster.name
}

resource "aws_eks_cluster" "cluster" {
  name     = local.cluster_name
  version  = var.cluster_version
  role_arn = aws_iam_role.eks-cluster.arn

  vpc_config {
    subnet_ids = [
      aws_subnet.private-eu-west-2a.id,
      aws_subnet.private-eu-west-2b.id,
      aws_subnet.public-eu-west-2a.id,
      aws_subnet.public-eu-west-2b.id
    ]
  }

  access_config {
    authentication_mode = "API_AND_CONFIG_MAP"
    bootstrap_cluster_creator_admin_permissions = true
  }

  depends_on = [aws_iam_role_policy_attachment.amazon-eks-cluster-policy]
}

output "cluster_id" {
  value = aws_eks_cluster.cluster.cluster_id
}


output "cluster_endpoint" {
  value = aws_eks_cluster.cluster.endpoint
}
