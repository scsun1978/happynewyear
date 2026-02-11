package logic

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"happynewyear/internal/model"
	"happynewyear/internal/svc"
	"math/rand"
	"time"

	"gorm.io/gorm"
)

type DrawLogic struct {
	ctx *svc.ServiceContext
}

func NewDrawLogic(ctx *svc.ServiceContext) *DrawLogic {
	return &DrawLogic{ctx: ctx}
}

func (l *DrawLogic) Draw(userID string) (*model.Award, error) {
	var wonAward model.Award

	err := l.ctx.DB.Transaction(func(tx *gorm.DB) error {
		// 1. Deduct Chance
		// Use raw SQL for atomic update and check
		res := tx.Model(&model.User{}).
			Where("user_id = ? AND chances > 0", userID).
			Update("chances", gorm.Expr("chances - 1"))
		
		if res.Error != nil {
			return res.Error
		}
		if res.RowsAffected == 0 {
			return errors.New("no chances remaining")
		}

		// 2. Select Prize
		// Fetch available prizes
		var candidates []model.Award
		if err := tx.Where("remaining > 0").Find(&candidates).Error; err != nil {
			return err
		}

		// Filter: One Vacation Reward Card per person
		var wonCard bool
		tx.Model(&model.DrawRecord{}).
			Where("user_id = ? AND award_name = ?", userID, "休假奖励卡").
			Select("count(*) > 0").
			Scan(&wonCard)

		if wonCard {
			var filtered []model.Award
			for _, a := range candidates {
				if a.Name != "休假奖励卡" {
					filtered = append(filtered, a)
				}
			}
			candidates = filtered
		}

		selected := l.selectAward(candidates)
		if selected == nil {
			// Fallback to Sunshine (Type=3 or 4) if configured, or error
			// Assume ID 999 or find a type=3
			tx.Where("type >= 3").First(&selected)
		}
		
		if selected == nil {
			return errors.New("inventory system error")
		}

		// 3. Deduct Inventory (Optimistic Lock)
		// For High Concurrency: UPDATE awards SET remaining=remaining-1 WHERE id=? AND remaining>0
		invRes := tx.Model(&model.Award{}).
			Where("id = ? AND remaining > 0", selected.ID).
			Update("remaining", gorm.Expr("remaining - 1"))
		
		if invRes.RowsAffected == 0 {
			// Collision! Retry or fallback.
			// For MVP simplicity: Fallback to Sunshine
			var sunshine model.Award
			if err := tx.Where("type >= 3").First(&sunshine).Error; err == nil {
				selected = &sunshine
				// Sunshine usually has unlimited (or huge) stock, but we should decr it too
				tx.Model(&sunshine).Update("remaining", gorm.Expr("remaining - 1"))
			} else {
				return errors.New("prize collision and no fallback")
			}
		}

		wonAward = *selected

		// 3.5. If Point-based Award (Type=4), credit User Total Score
		if wonAward.Type == 4 && wonAward.Value > 0 {
			if err := tx.Model(&model.User{}).
				Where("user_id = ?", userID).
				Update("total_score", gorm.Expr("total_score + ?", wonAward.Value)).Error; err != nil {
				return err
			}
		}

		// 4. Audit Log (Chain Hash)
		// Get last hash
		var lastRecord model.DrawRecord
		tx.Order("id desc").First(&lastRecord)
		
		prevHash := lastRecord.FinalHash
		if prevHash == "" {
			prevHash = "GENESIS_HASH_2026"
		}

		dataStr := fmt.Sprintf("%s%d%d", userID, wonAward.ID, time.Now().UnixNano())
		dataHash := sha256Sum(dataStr)
		finalHash := sha256Sum(dataHash + prevHash)

		record := model.DrawRecord{
			UserID:    userID,
			AwardID:   wonAward.ID,
			AwardName: wonAward.Name,
			PrevHash:  prevHash,
			DataHash:  dataHash,
			FinalHash: finalHash,
		}
		
		if err := tx.Create(&record).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	return &wonAward, nil
}

func (l *DrawLogic) selectAward(candidates []model.Award) *model.Award {
	if len(candidates) == 0 {
		return nil
	}
	
	totalWeight := 0
	for _, a := range candidates {
		totalWeight += a.Probability
	}

	if totalWeight <= 0 {
		return &candidates[0]
	}

	r := rand.Intn(totalWeight)
	acc := 0
	for _, a := range candidates {
		acc += a.Probability
		if r < acc {
			return &a
		}
	}
	return &candidates[len(candidates)-1]
}

func sha256Sum(s string) string {
	h := sha256.Sum256([]byte(s))
	return hex.EncodeToString(h[:])
}
