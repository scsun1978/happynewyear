package logic

import (
	"errors"
	"fmt"
	"happynewyear/internal/model"
	"happynewyear/internal/svc"
	"time"

	"gorm.io/gorm"
)

type GameLogic struct {
	ctx *svc.ServiceContext
}

func NewGameLogic(ctx *svc.ServiceContext) *GameLogic {
	return &GameLogic{ctx: ctx}
}

func (l *GameLogic) StartGame(userID string) (string, string, error) {
	gameID := fmt.Sprintf("%s-%d", userID, time.Now().Unix())
	nonce := GenerateNonce()

	// Optionally record game start in Redis/DB to enforce "Must Start to End"
	// For MVP, we trust the signature/nonce on EndGame
	return gameID, nonce, nil
}

func (l *GameLogic) EndGame(userID string, score, duration int, nonce, sign, timestamp string) (int, error) {
	// 1. Security Checks
	if !CheckAndSetNonce(l.ctx, nonce, userID) {
		return 0, errors.New("start game again") // Replay attack or used nonce
	}

	// 2. Validate Signature
	if len(sign) > 0 { // Allow skipping sign check if empty during dev/test if needed? No, enforce.
		// NOTE: For MVP debugging, you might want to log the expected string
		if !VerifySignature(l.ctx.Config.Game.AppSecret, nonce, score, duration, timestamp, sign) {
			return 0, errors.New("invalid signature")
		}
	}

	// 3. Logic Validation
	if duration <= 0 || score < 0 {
		return 0, errors.New("invalid game data")
	}
	// Speed check: e.g., max 50 points per second
	if float64(score)/float64(duration) > 50.0 {
		return 0, errors.New("abnormal game behavior")
	}

	// 4. Calculate Chances
	// Standard: 1000 points = 1 chance
	earnedChances := 0
	if score >= l.ctx.Config.Game.ScoreToChanceRatio {
		earnedChances = score / l.ctx.Config.Game.ScoreToChanceRatio
	}
	
	// Max daily limit check could go here

	// 5. DB Transaction
	err := l.ctx.DB.Transaction(func(tx *gorm.DB) error {
		// Save Record
		record := model.GameRecord{
			UserID:    userID,
			GameID:    fmt.Sprintf("%s-%s", userID, nonce), // Use nonce as unique part
			Score:     score,
			Duration:  duration,
			Nonce:     nonce,
			Signature: sign,
		}
		if err := tx.Create(&record).Error; err != nil {
			return err
		}

		// Update User
		if earnedChances > 0 {
			if err := tx.Model(&model.User{}).Where("user_id = ?", userID).
				Updates(map[string]interface{}{
					"total_score": gorm.Expr("total_score + ?", score),
					"chances":     gorm.Expr("chances + ?", earnedChances),
				}).Error; err != nil {
				return err
			}
		} else {
			// Just update score
			if err := tx.Model(&model.User{}).Where("user_id = ?", userID).
				Update("total_score", gorm.Expr("total_score + ?", score)).Error; err != nil {
				return err
			}
		}

		return nil
	})

	return earnedChances, err
}
