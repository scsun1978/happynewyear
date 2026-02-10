package model

import "time"

// User maps to the `users` table
type User struct {
	ID         int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID     string    `gorm:"uniqueIndex;type:varchar(64);not null" json:"user_id"`
	Name       string    `gorm:"type:varchar(64);not null;default:''" json:"name"`
	Department string    `gorm:"type:varchar(255);not null;default:''" json:"department"`
	Avatar     string    `gorm:"type:varchar(512);not null;default:''" json:"avatar"`
	Chances    int       `gorm:"not null;default:0" json:"chances"`
	TotalScore int64     `gorm:"not null;default:0" json:"total_score"`
	CreatedAt  time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt  time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// Award maps to the `awards` table
type Award struct {
	ID          int       `gorm:"primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"type:varchar(64);not null" json:"name"`
	Type        int       `gorm:"not null" json:"type"` // 1=Grand, 2=Regular, 3=Sunshine
	TotalCount  int       `gorm:"not null" json:"total_count"`
	Remaining   int       `gorm:"not null" json:"remaining"`
	Probability int       `gorm:"not null;default:0" json:"probability"` // Weight / 10000
	Value       int       `gorm:"not null;default:0" json:"value"`       // Point value for type=4
	ImageURL    string    `gorm:"type:varchar(255);default:''" json:"image_url"`
	Version     int       `gorm:"not null;default:0" json:"version"` // Optimistic Lock
	CreatedAt   time.Time `gorm:"autoCreateTime" json:"created_at"`
	UpdatedAt   time.Time `gorm:"autoUpdateTime" json:"updated_at"`
}

// GameRecord maps to the `game_records` table
type GameRecord struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	GameID    string    `gorm:"uniqueIndex;type:varchar(64);not null" json:"game_id"`
	Score     int       `gorm:"not null" json:"score"`
	Duration  int       `gorm:"not null" json:"duration"`
	Nonce     string    `gorm:"uniqueIndex;type:varchar(64);not null" json:"nonce"`
	Signature string    `gorm:"type:varchar(128);not null" json:"signature"`
	ClientIP  string    `gorm:"type:varchar(45);not null;default:''" json:"client_ip"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}

// DrawRecord maps to the `draw_records` table (Audit Chain)
type DrawRecord struct {
	ID        int64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    string    `gorm:"index;type:varchar(64);not null" json:"user_id"`
	AwardID   int       `gorm:"not null" json:"award_id"`
	AwardName string    `gorm:"type:varchar(64);not null" json:"award_name"`
	PrevHash  string    `gorm:"type:varchar(64);not null;default:''" json:"prev_hash"`
	DataHash  string    `gorm:"type:varchar(64);not null" json:"data_hash"`
	FinalHash string    `gorm:"type:varchar(64);not null" json:"final_hash"`
	CreatedAt time.Time `gorm:"autoCreateTime" json:"created_at"`
}
