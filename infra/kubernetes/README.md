# Base de Kubernetes

Esta pasta contém manifests iniciais para a aplicação.

## Arquivos

- `namespace.yaml`: namespace dedicado da POC
- `configmap.yaml`: variáveis não sensíveis
- `secret.example.yaml`: exemplo de `DATABASE_URL`
- `deployment-app.yaml`: deployment da aplicação
- `service-app.yaml`: service HTTP interno
- `ingress.yaml`: exposição HTTP externa

## Aplicação

1. Gere e publique a imagem do `docker/app/Dockerfile`.
2. Ajuste `secret.example.yaml` para `secret.yaml` com a `DATABASE_URL` do Neon ou de outro PostgreSQL.
3. Aplique os manifests:

```bash
kubectl apply -f infra/kubernetes/namespace.yaml
kubectl apply -f infra/kubernetes/configmap.yaml
kubectl apply -f infra/kubernetes/secret.yaml
kubectl apply -f infra/kubernetes/deployment-app.yaml
kubectl apply -f infra/kubernetes/service-app.yaml
kubectl apply -f infra/kubernetes/ingress.yaml
```

## Evolução recomendada

- Extrair os manifests para `kustomize` ou `helm`
- Separar `Deployment`, `Job` de migration e `CronJob` se houver rotinas futuras
- Substituir `secret.yaml` por External Secrets, Sealed Secrets ou integração com secret manager
- Adicionar HPA, PodDisruptionBudget e NetworkPolicy
- Trocar a imagem `latest` por tags versionadas do pipeline

