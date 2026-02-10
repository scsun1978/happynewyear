package logic

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"happynewyear/internal/svc"
	"time"
)

// VerifySignature checks the client's request signature
// Sign = SHA256(Nonce + Score + Time + Secret) - Simplified for MVP
// In a real app, sort all params.
func VerifySignature(secret, nonce string, score, duration int, timestamp string, sign string) bool {
	// Construct payload: nonce=...&score=...&time=...&timestamp=...&secret=...
	// To simplify for MVP: SHA256(nonce + score + duration + timestamp + secret)
	raw := fmt.Sprintf("%s%d%d%s%s", nonce, score, duration, timestamp, secret)
	hash := sha256.Sum256([]byte(raw))
	calculated := hex.EncodeToString(hash[:])
	return calculated == sign
}

// CheckAndSetNonce ensures nonce is unique within a time window
func CheckAndSetNonce(ctx *svc.ServiceContext, nonce string, userID string) bool {
	key := fmt.Sprintf("nonce:%s:%s", userID, nonce)
	// SetNX: Set if Not Exists
	// 5-minute expiration
	success, err := ctx.Redis.SetNX(ctx.Redis.Context(), key, "1", 5*time.Minute).Result()
	if err != nil {
		return false
	}
	return success
}

// GenerateNonce creates a random string
func GenerateNonce() string {
	return fmt.Sprintf("%d", time.Now().UnixNano()) // Simple nonce for MVP
}
