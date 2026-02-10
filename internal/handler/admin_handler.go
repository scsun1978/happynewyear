package handler

import (
	"happynewyear/internal/logic"
	"happynewyear/internal/svc"
	"net/http"

	"github.com/gin-gonic/gin"
)

// RankHandler
func NewRankHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		l := logic.NewRankLogic(ctx)
		list, err := l.GetRankList()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": list})
	}
}

// AdminListUsersHandler
func NewAdminListUsersHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Simple Auth Check
		secret := c.GetHeader("X-Admin-Secret")
		l := logic.NewAdminLogic(ctx)
		if !l.CheckAuth(secret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin secret"})
			return
		}

		list, err := l.GetAllUsers()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		c.JSON(http.StatusOK, gin.H{"data": list})
	}
}
