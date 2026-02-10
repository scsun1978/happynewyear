FROM golang:1.23-alpine AS builder

WORKDIR /app

# Install dependencies
COPY go.mod go.sum ./
ENV GOPROXY=https://goproxy.cn,direct
RUN go mod download

# Copy source code
COPY . .

# Tidy dependencies (fix version mismatch)
RUN go mod tidy

# Build binary
RUN CGO_ENABLED=0 GOOS=linux go build -o happynewyear cmd/api/main.go

# Final Stage
FROM alpine:latest

WORKDIR /app

# Install runtime dependencies (certificates, timezone)
RUN apk --no-cache add ca-certificates tzdata

# Copy binary from builder
COPY --from=builder /app/happynewyear .

# Create static directory (will be mounted)
RUN mkdir -p static/assets

# Expose port
EXPOSE 8080

# Run
CMD ["./happynewyear"]
