package handler

import (
	"happynewyear/internal/logic"
	"happynewyear/internal/svc"
	"net/http"

	"github.com/gin-gonic/gin"
)

type GameEndRequest struct {
	Score     int    `json:"score"`
	Duration  int    `json:"duration"`
	Nonce     string `json:"nonce"`
	Signature string `json:"signature"`
	Timestamp string `json:"timestamp"`
}

func NewGameStartHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")

		l := logic.NewGameLogic(ctx)
		gameID, nonce, err := l.StartGame(userID)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"game_id": gameID,
			"nonce":   nonce,
		})
	}
}

func NewGameEndHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")
		
		var req GameEndRequest
		if err := c.ShouldBindJSON(&req); err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "invalid request body"})
			return
		}

		l := logic.NewGameLogic(ctx)
		// For MVP, passing timestamp from body. In prod, prefer header X-Timestamp for signature.
		earned, err := l.EndGame(userID, req.Score, req.Duration, req.Nonce, req.Signature, req.Timestamp)
		if err != nil {
			// differentiate errors? e.g. 409 for replay
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 0,
			"msg": "success",
			"data": gin.H{
				"earned_chances": earned,
			},
		})
	}
}
