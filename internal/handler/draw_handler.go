package handler

import (
	"happynewyear/internal/logic"
	"happynewyear/internal/svc"
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewDrawHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		userID := c.GetString("user_id")

		l := logic.NewDrawLogic(ctx)
		award, err := l.Draw(userID)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{
				"code": -1,
				"msg": err.Error(), // e.g. "no chances"
			})
			return
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 0,
			"msg": "success",
			"data": gin.H{
				"name":      award.Name,
				"type":      award.Type,
				"value":     award.Value,
				"image_url": award.ImageURL,
			},
		})
	}
}
