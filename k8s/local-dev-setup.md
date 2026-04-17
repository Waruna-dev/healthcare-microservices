# Local Dev Ingress Setup (Minikube)

## 1. Build images

```powershell
docker compose build
```

## 2. Start Minikube

```powershell
minikube start --driver=docker
```

## 3. Enable Ingress

```powershell
minikube addons enable ingress
kubectl wait --namespace ingress-nginx --for=condition=ready pod --selector=app.kubernetes.io/component=controller --timeout=180s
```

## 4. Load locally built images into Minikube

```powershell
minikube image load healthcare-microservices-api-gateway:latest
minikube image load healthcare-microservices-admin-service:latest
minikube image load healthcare-microservices-patient-service:latest
minikube image load healthcare-microservices-doctor-service:latest
minikube image load healthcare-microservices-appointment-service:latest
minikube image load healthcare-microservices-payment-service:latest
minikube image load healthcare-microservices-notification-service:latest
minikube image load healthcare-microservices-telemedicine-service:latest
minikube image load healthcare-microservices-frontend:latest
```

## 5. Apply Kubernetes manifests

Before apply, update placeholder values in `k8s/secrets-template.yaml` (`replace_me`, db URLs, API keys).

```powershell
kubectl apply -f k8s/secrets-template.yaml
kubectl apply -f k8s/patient.yaml
kubectl apply -f k8s/doctor.yaml
kubectl apply -f k8s/admin.yaml
kubectl apply -f k8s/appointment.yaml
kubectl apply -f k8s/payment.yaml
kubectl apply -f k8s/notification.yaml
kubectl apply -f k8s/telemedicine.yaml
kubectl apply -f k8s/api-gateway.yaml
kubectl apply -f k8s/frontend.yaml
kubectl apply -f k8s/ingress.yaml
```

## 6. Map healthcare.local

Run tunnel in a separate terminal (keep it running):

```powershell
minikube tunnel
```

Add this fixed mapping to `C:\Windows\System32\drivers\etc\hosts` (as Administrator):

```text
127.0.0.1 healthcare.local
```

## 7. Test

```powershell
kubectl get ingress
kubectl get pods
```

Open:

```text
http://healthcare.local
http://healthcare.local/api/health
```
