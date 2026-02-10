package logic

import (
	"happynewyear/internal/model"
	"happynewyear/internal/svc"
	"time"
)

type UserLogic struct {
	ctx *svc.ServiceContext
}

func NewUserLogic(ctx *svc.ServiceContext) *UserLogic {
	return &UserLogic{ctx: ctx}
}

// Login handles the WeCom OAuth callback
func (l *UserLogic) Login(code string) (string, *model.User, error) {
	// 1. Get UserId from WeCom
	client := NewWeComClient(l.ctx.Config)
	userID, err := client.GetUserID(code)
	if err != nil {
		return "", nil, err
	}

	// 2. Find or Create User in DB
	var user model.User
	result := l.ctx.DB.Where("user_id = ?", userID).First(&user)
	if result.Error != nil {
		// New User
		// TODO: In a real app, we might want to fetch name/avatar from WeCom here
		user = model.User{
			UserID:  userID,
			Name:    userID, // Placeholder
			Chances: 0,
		}
		if err := l.ctx.DB.Create(&user).Error; err != nil {
			return "", nil, err
		}
	}

	// 3. Generate JWT
	token, err := GenerateToken(l.ctx.Config.Game.AppSecret, user.UserID, user.Name, 24*time.Hour)
	if err != nil {
		return "", nil, err
	}

	return token, &user, nil
}

// GetUserInfo fetches user details
func (l *UserLogic) GetUserInfo(userID string) (*model.User, error) {
	var user model.User
	err := l.ctx.DB.Where("user_id = ?", userID).First(&user).Error
	return &user, err
}
