package logic

import (
	"happynewyear/internal/model"
	"happynewyear/internal/svc"
)

type AdminLogic struct {
	ctx *svc.ServiceContext
}

func NewAdminLogic(ctx *svc.ServiceContext) *AdminLogic {
	return &AdminLogic{ctx: ctx}
}

// CheckAuth verifies the admin secret
func (l *AdminLogic) CheckAuth(secret string) bool {
	return secret == l.ctx.Config.Game.AdminPassword
}

type AdminUserItem struct {
	ID         int64  `json:"id"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	Score      int64  `json:"score"`
	Chances    int    `json:"chances"`
	Level      int    `json:"level"`
	CreatedAt  string `json:"created_at"`
}

func (l *AdminLogic) GetAllUsers() ([]AdminUserItem, error) {
	var users []model.User
	err := l.ctx.DB.Order("total_score desc").Find(&users).Error
	if err != nil {
		return nil, err
	}

	var result []AdminUserItem
	for _, u := range users {
		result = append(result, AdminUserItem{
			ID:        u.ID,
			UserID:    u.UserID,
			Name:      u.Name,
			Score:     u.TotalScore,
			Chances:   u.Chances,
			Level:     CalculateLevel(u.TotalScore),
			CreatedAt: u.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, nil
}

type AdminDrawRecord struct {
	ID        int64  `json:"id"`
	UserID    string `json:"user_id"`
	Name      string `json:"name"`
	AwardName string `json:"award_name"`
	CreatedAt string `json:"created_at"`
	DataHash  string `json:"data_hash"`
}

func (l *AdminLogic) GetDrawRecords() ([]AdminDrawRecord, error) {
	var records []model.DrawRecord
	// Join with users table to get real names
	err := l.ctx.DB.Order("id desc").Find(&records).Error
	if err != nil {
		return nil, err
	}

	// Fetch user names for mapping
	var users []model.User
	l.ctx.DB.Find(&users)
	nameMap := make(map[string]string)
	for _, u := range users {
		nameMap[u.UserID] = u.Name
	}

	var result []AdminDrawRecord
	for _, r := range records {
		result = append(result, AdminDrawRecord{
			ID:        r.ID,
			UserID:    r.UserID,
			Name:      nameMap[r.UserID],
			AwardName: r.AwardName,
			DataHash:  r.DataHash,
			CreatedAt: r.CreatedAt.Format("2006-01-02 15:04:05"),
		})
	}
	return result, nil
}
func (l *AdminLogic) GetAllAwards() ([]model.Award, error) {
	var awards []model.Award
	err := l.ctx.DB.Order("id asc").Find(&awards).Error
	return awards, err
}

func (l *AdminLogic) ResetData() error {
	// Destination tables for truncation
	tables := []string{"draw_records", "game_records"}

	for _, table := range tables {
		if err := l.ctx.DB.Exec("TRUNCATE TABLE " + table).Error; err != nil {
			return err
		}
	}

	// Reset Users
	if err := l.ctx.DB.Model(&model.User{}).Where("1 = 1").Updates(map[string]interface{}{
		"total_score": 0,
		"chances":     0,
	}).Error; err != nil {
		return err
	}

	// Reset Awards inventory
	// Using a raw query to reset remaining to total to avoid GORM batch update complexities
	if err := l.ctx.DB.Exec("UPDATE awards SET remaining = total, version = 0").Error; err != nil {
		return err
	}

	return nil
}
