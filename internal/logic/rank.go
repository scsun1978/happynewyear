package logic

import (
	"happynewyear/internal/model"
	"happynewyear/internal/svc"
)

type RankLogic struct {
	ctx *svc.ServiceContext
}

func NewRankLogic(ctx *svc.ServiceContext) *RankLogic {
	return &RankLogic{ctx: ctx}
}

type RankItem struct {
	Rank       int    `json:"rank"`
	UserID     string `json:"user_id"`
	Name       string `json:"name"`
	Avatar     string `json:"avatar"`
	TotalScore int64  `json:"total_score"`
	Level      int    `json:"level"`
}

func (l *RankLogic) GetRankList() ([]RankItem, error) {
	// For MVP, just query DB directly. For high traffic, use Redis ZSET.
	var users []model.User
	// Get Top 50
	err := l.ctx.DB.Order("total_score desc").Limit(50).Find(&users).Error
	if err != nil {
		return nil, err
	}

	var rankList []RankItem
	for i, u := range users {
		rankList = append(rankList, RankItem{
			Rank:       i + 1,
			UserID:     u.UserID,
			Name:       u.Name,
			Avatar:     u.Avatar,
			TotalScore: u.TotalScore,
			Level:      CalculateLevel(u.TotalScore),
		})
	}

	return rankList, nil
}

func CalculateLevel(score int64) int {
	if score >= 10000 {
		return 4 // Supreme
	} else if score >= 5000 {
		return 3 // Gold
	} else if score >= 1000 {
		return 2 // Silver
	} else {
		return 1 // Bronze
	}
}
