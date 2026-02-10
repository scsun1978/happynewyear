package handler

import (
	"happynewyear/internal/middleware"
	"happynewyear/internal/svc"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterHandlers(r *gin.Engine, ctx *svc.ServiceContext) {
	// Health Check
	r.GET("/ping", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "pong"})
	})

	// Serve Static Files (Frontend)
	// Serve Static Files (Frontend)
	r.Static("/assets", "./static/assets")
	r.StaticFile("/favicon.ico", "./static/favicon.ico")
	r.StaticFile("/WW_verify_W6vPcrIQ7z3a1jAb.txt", "./static/WW_verify_W6vPcrIQ7z3a1jAb.txt")

	// API Group
	api := r.Group("/api")
	{
		// User/Auth (Public Login)
		api.GET("/user/login", NewLoginHandler(ctx))
		api.GET("/rank", NewRankHandler(ctx))

		// Admin Routes
		admin := api.Group("/admin")
		{
			admin.GET("/users", NewAdminListUsersHandler(ctx))
		}

		// Protected Routes
		protected := api.Group("/", middleware.AuthMiddleware(ctx.Config))
		{
			// User Info
			protected.GET("/user/info", NewUserInfoHandler(ctx))

			// Game
			protected.POST("/game/start", NewGameStartHandler(ctx))
			protected.POST("/game/end", NewGameEndHandler(ctx))

			// Draw
			protected.POST("/draw", NewDrawHandler(ctx))
		}
	}

	// SPA Fallback (Must be last)
	r.NoRoute(func(c *gin.Context) {
		c.File("./static/index.html")
	})
}
