resource "aws_ecr_repository" "paralog-telicent-smart-cache-ontology" {
  name                 = "paralog/telicent-smart-cache-ontology"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = true
  }

}


resource "aws_ecr_repository" "paralog-smart-cached-graph" {
  name                 = "paralog/smart-cached-graph"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = true
  }

}

resource "aws_ecr_repository" "paralog-transparent-proxy" {
  name                 = "paralog/${var.environment}-transparent-proxy"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = true
  }

}

resource "aws_ecr_repository" "paralog-frontend" {
  name                 = "paralog/${var.environment}-frontend"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = true
  }

}


/*resource "aws_ecr_repository" "paralog-api" {
  name                 = "paralog/${var.environment}-paralog-python-api"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = true
  }

}*/

resource "aws_ecr_repository" "paralog-telicent-smart-cache-paralog-api" {
  name                 = "paralog/telicent-smart-cache-paralog-api"
  image_tag_mutability = "IMMUTABLE"

  encryption_configuration {
    encryption_type = "AES256"
  }
  image_scanning_configuration {
    scan_on_push = true
  }

}





