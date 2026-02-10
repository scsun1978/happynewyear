package main

import (
	"flag"
	"fmt"
	"happynewyear/internal/config"
	"happynewyear/internal/handler"
	"happynewyear/internal/svc"
	"log"

	"github.com/gin-gonic/gin"
)

var configFile = flag.String("f", "deploy/config/config.yaml", "the config file")

func main() {
	flag.Parse()

	// 1. Load Config
	c, err := config.Load(*configFile)
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// 2. Init Service Context
	ctx := svc.NewServiceContext(c)

	// 3. Setup Router
	r := gin.Default()
	
	// Register Routes
	handler.RegisterHandlers(r, ctx)

	// 4. Start Server
	addr := fmt.Sprintf("%s:%d", c.Host, c.Port)
	fmt.Printf("Starting server at %s...\n", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
