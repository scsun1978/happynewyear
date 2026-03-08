package main

import (
	"fmt"
	"log"
	"os"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

type Award struct {
	ID   int    `gorm:"primaryKey"`
	Name string `gorm:"column:name"`
}

func main() {
	dsn := os.Getenv("DB_DATASOURCE")
	if dsn == "" {
		log.Fatal("DB_DATASOURCE env var not set")
	}

	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	var awards []Award
	if err := db.Table("awards").Find(&awards).Error; err != nil {
		log.Fatalf("Failed to fetch awards: %v", err)
	}

	fmt.Println("ID | Name (Raw) | Name (Hex)")
	fmt.Println("---|------------|-----------")
	for _, a := range awards {
		fmt.Printf("%d | %s | %x\n", a.ID, a.Name, a.Name)
	}
}
