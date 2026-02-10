package main

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"sort"
	"strconv"
	"strings"
	"time"
)

const (
	BaseURL     = "http://localhost:8080"
	AppSecret   = "HappyNewYear2024Secret!@#" // Must match config.yaml
	UserToken   = "" // Will be fetched or hardcoded for testing
)

// Helper to calculate signature
func calcSignature(params map[string]string, secret string) string {
	keys := make([]string, 0, len(params))
	for k := range params {
		if k == "signature" {
			continue
		}
		keys = append(keys, k)
	}
	sort.Strings(keys)

	var builder strings.Builder
	for _, k := range keys {
		builder.WriteString(k)
		builder.WriteString("=")
		builder.WriteString(params[k])
		builder.WriteString("&")
	}
	builder.WriteString("secret=")
	builder.WriteString(secret)

	h := sha256.New()
	h.Write([]byte(builder.String()))
	return hex.EncodeToString(h.Sum(nil))
}

func main() {
	// 1. Login to get Token (Mock)
	token, err := login()
	if err != nil {
		fmt.Printf("❌ Login Failed: %v\n", err)
		return
	}
	fmt.Printf("✅ Login Success. Token: %s...\n", token[:20])

	// 2. Test Valid Game End
	nonce := fmt.Sprintf("%d", time.Now().UnixNano())
	payload := map[string]string{
		"score":     "100",
		"duration":  "60",
		"nonce":     nonce,
		"timestamp": fmt.Sprintf("%d", time.Now().Unix()),
	}
	
	// Server expects logic: signature = SHA256(sort(params) + secret)
	// Actually, looking at `internal/logic/security.go`, it verifies request header?
	// Let's check `game.go`:
	// It validates `req.Signature` against `Security.Sign(params, secret)`
	
	sign := calcSignature(payload, AppSecret)
	payload["signature"] = sign

	fmt.Println("\n--- Test 1: Valid Request ---")
	sendRequest(token, payload)

	// 3. Test Replay Attack (Same Nonce)
	fmt.Println("\n--- Test 2: Replay Attack (Same Nonce) ---")
	sendRequest(token, payload)

	// 4. Test Tampering (Modify Score, Keep Signature)
	fmt.Println("\n--- Test 3: Tampering Attack (Modify Score) ---")
	payloadTampered := map[string]string{
		"score":     "9999", // Changed
		"duration":  "60",
		"nonce":     fmt.Sprintf("%d", time.Now().UnixNano()), // New nonce to pass nonce check
		"timestamp": fmt.Sprintf("%d", time.Now().Unix()),
		"signature": sign, // Old signature
	}
	sendRequest(token, payloadTampered)
}

func login() (string, error) {
	resp, err := http.Get(BaseURL + "/api/user/login?code=mock")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return "", fmt.Errorf("status %d", resp.StatusCode)
	}

	var res struct {
		Code int `json:"code"`
		Data struct {
			Token string `json:"token"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&res); err != nil {
		return "", err
	}
	return res.Data.Token, nil
}

func sendRequest(token string, data map[string]string) {
	// Game End expects JSON body
	// But `security.go` VerifySignature might expect map[string]string?
	// `GameEndReq` struct has `Signature` field.
	// Let's send as JSON.
	
	// Convert map map[string]string to appropriate types for JSON if needed
	// Our API expects: Score int64, Duration int, etc.
	// But `calcSignature` uses strings.
	
	jsonPayload := make(map[string]interface{})
	for k, v := range data {
		if k == "score" {
			i, _ := strconv.Atoi(v)
			jsonPayload[k] = i
		} else if k == "duration" {
			i, _ := strconv.Atoi(v)
			jsonPayload[k] = i
		} else {
			jsonPayload[k] = v
		}
	}

	body, _ := json.Marshal(jsonPayload)
	req, _ := http.NewRequest("POST", BaseURL+"/api/game/end", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("❌ Request Failed: %v\n", err)
		return
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Printf("Status: %d | Body: %s\n", resp.StatusCode, string(respBody))
}
