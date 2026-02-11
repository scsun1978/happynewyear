FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM golang:1.23-alpine AS backend-builder
WORKDIR /app
COPY go.mod go.sum ./
ENV GOPROXY=https://goproxy.cn,direct
RUN go mod download
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o happynewyear cmd/api/main.go

# Final Stage
FROM alpine:latest
WORKDIR /app
RUN apk --no-cache add ca-certificates tzdata
COPY --from=backend-builder /app/happynewyear .
# Copy pre-built static assets from the frontend-builder stage
COPY --from=frontend-builder /app/frontend/dist ./static
# Create assets dir just in case
RUN mkdir -p static/assets

EXPOSE 8080
CMD ["./happynewyear"]
