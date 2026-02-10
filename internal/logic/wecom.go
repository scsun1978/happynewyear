package logic

import (
	"encoding/json"
	"fmt"
	"happynewyear/internal/config"
	"net/http"
)

type WeComClient struct {
	CorpID  string
	Secret  string
	AgentID int
}

func NewWeComClient(cfg config.Config) *WeComClient {
	return &WeComClient{
		CorpID:  cfg.WeCom.CorpID,
		Secret:  cfg.WeCom.Secret,
		AgentID: cfg.WeCom.AgentID,
	}
}

// WeCom Response Structs
type AccessTokenResp struct {
	ErrCode     int    `json:"errcode"`
	ErrMsg      string `json:"errmsg"`
	AccessToken string `json:"access_token"`
	ExpiresIn   int    `json:"expires_in"`
}

type UserInfoResp struct {
	ErrCode int    `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
	UserID  string `json:"UserId"`
	OpenID  string `json:"OpenId"` // Non-internal users
}

// GetUserID uses the code to get the UserID
func (c *WeComClient) GetUserID(code string) (string, error) {
	// Mock implementation for Dev request if code="mock"
	if code == "mock" {
		return "mock_user_001", nil
	}

	token, err := c.getAccessToken()
	if err != nil {
		return "", err
	}

	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/user/getuserinfo?access_token=%s&code=%s", token, code)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result UserInfoResp
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.ErrCode != 0 {
		return "", fmt.Errorf("wecom error: %d %s", result.ErrCode, result.ErrMsg)
	}

	if result.UserID != "" {
		return result.UserID, nil
	}
	// External contacts use OpenId
	return result.OpenID, nil
}

// TODO: Cache AccessToken (use Redis in production)
func (c *WeComClient) getAccessToken() (string, error) {
	url := fmt.Sprintf("https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=%s&corpsecret=%s", c.CorpID, c.Secret)
	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var result AccessTokenResp
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	if result.ErrCode != 0 {
		return "", fmt.Errorf("token error: %d %s", result.ErrCode, result.ErrMsg)
	}

	return result.AccessToken, nil
}
