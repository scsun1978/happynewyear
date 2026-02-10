package logic

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"testing"
)

// Helper for test (since draw.go's sha256Sum is private but we are in same package, let's redefine similar helper or use it if available)
// Actually we are in package logic, so we can access `sha256Sum` from draw.go directly!
// But just in case, let's redefine helper for this test file to be independent.
func sha256SumTest(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}

// Re-using TestVerifySignature with correct signature calculation
func TestVerifySignature(t *testing.T) {
	secret := "test_secret_123"
	nonce := "123456"
	score := 100
	duration := 60
	timestamp := "1700000000"

	// 1. Calculate valid signature
	// logic: SHA256(nonce + score + duration + timestamp + secret)
	raw := fmt.Sprintf("%s%d%d%s%s", nonce, score, duration, timestamp, secret)
	validSign := sha256SumTest(raw)

	// Note: VerifySignature uses logic.VerifySignature implementation
	// We need to ensure we are testing the actual function in security.go

	if !VerifySignature(secret, nonce, score, duration, timestamp, validSign) {
		t.Errorf("VerifySignature failed for valid signature")
	}

	// 2. Test Tampered Score
	if VerifySignature(secret, nonce, 999, duration, timestamp, validSign) { // Correct logic should detect tamper
		// Wait, VerifySignature re-calculates based on INPUT arguments.
		// If validSign matches Hash(nonce, 999, duration, timestamp, secret), then it PASSES.
		// BUT validSign was calculated with score=100.
		// So checking score=999 against validSign(from 100) should return FALSE.
		t.Errorf("VerifySignature passed for tampered score (it should fail)")
	} else {
		// Passed test (it failed verification, which is good)
	}

	// 3. Test Tampered Timestamp
	if VerifySignature(secret, nonce, score, duration, "1700000001", validSign) {
		t.Errorf("VerifySignature passed for tampered timestamp")
	}

	// 4. Test Wrong Secret
	if VerifySignature("wrong_secret", nonce, score, duration, timestamp, validSign) {
		t.Errorf("VerifySignature passed for wrong secret")
	}
}

// TestAuditHash tests the chain hash integrity logic
func TestAuditHash(t *testing.T) {
	// Replicate logic from draw.go
	prevHash := "GENESIS_HASH"
	dataHash := "DATA_HASH_123"
	
	expectedInput := dataHash + prevHash
	// Since sha256Sum is private in draw.go, we can access it because we are in package logic
	expectedOutput := sha256Sum(expectedInput)
	
	if expectedOutput == "" {
		t.Error("sha256Sum returned empty string")
	}
	
	// verify determinism
	val1 := sha256Sum("test")
	val2 := sha256Sum("test")
	if val1 != val2 {
		t.Error("sha256Sum is not deterministic")
	}
}
