
resource "kubernetes_namespace" "paralog" {
  metadata {
    name = "paralog"
  }
}
