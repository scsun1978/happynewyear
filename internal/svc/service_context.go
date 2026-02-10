package svc

import (
	"fmt"
	"happynewyear/internal/config"
	"happynewyear/internal/model"
	"log"

	"github.com/go-redis/redis/v8"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type ServiceContext struct {
	Config config.Config
	DB     *gorm.DB
	Redis  *redis.Client
}

func NewServiceContext(c config.Config) *ServiceContext {
	// 1. Init MySQL
	db, err := gorm.Open(mysql.Open(c.Database.DataSource), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	// Auto Migrate (Safe for MVP, but be careful in Prod)
	err = db.AutoMigrate(&model.User{}, &model.Award{}, &model.GameRecord{}, &model.DrawRecord{})
	if err != nil {
		log.Printf("Warning: AutoMigrate failed: %v", err)
	}

	// 2. Init Redis
	rdb := redis.NewClient(&redis.Options{
		Addr: c.Redis.Host,
		// Password: "", // No password for MVP internal network
		DB: 0,
	})

	fmt.Println("Service Context Initialized: DB & Redis Connected")

	return &ServiceContext{
		Config: c,
		DB:     db,
		Redis:  rdb,
	}
}
