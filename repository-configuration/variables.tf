variable "token" {
  description = "GitHub personal access token."
  type        = string
  sensitive   = true
}

variable "organisation" {
  description = "The GitHub organisation name."
  type        = string
  default     = "National-Digital-Twin"
}

variable "repository_description" {
  description = "GitHub repository description."
  type        = string
  default     = "Paralog is a geospatial visualisation tool for exploring and analysing data through a map interface. Originally developed by Telicent, it has been significantly expanded and developed by Coefficient. Paralog supports the visualisation of spatial relationships and enables data-driven decision-making across various sectors."
}