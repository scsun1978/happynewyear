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
