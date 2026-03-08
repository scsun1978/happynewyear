#!/bin/bash
set -e

REPO_DIR="/root/happynewyear"
cd $REPO_DIR

echo "Updating internal/logic/admin.go..."
cat <<'EOF' > internal/logic/admin.go
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
	err := l.ctx.DB.Order("id desc").Find(&records).Error
	if err != nil {
		return nil, err
	}

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
	tables := []string{"draw_records", "game_records"}
	for _, table := range tables {
		if err := l.ctx.DB.Exec("TRUNCATE TABLE " + table).Error; err != nil {
			return err
		}
	}
	if err := l.ctx.DB.Model(&model.User{}).Where("1 = 1").Updates(map[string]interface{}{
		"total_score": 0,
		"chances":     0,
	}).Error; err != nil {
		return err
	}
	if err := l.ctx.DB.Exec("UPDATE awards SET remaining = total, version = 0").Error; err != nil {
		return err
	}
	return nil
}
EOF

echo "Updating internal/handler/admin_handler.go..."
cat <<'EOF' > internal/handler/admin_handler.go
package handler

import (
	"happynewyear/internal/logic"
	"happynewyear/internal/svc"
	"net/http"

	"github.com/gin-gonic/gin"
)

func NewAdminUsersHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := c.GetHeader("X-Admin-Secret")
		l := logic.NewAdminLogic(ctx)
		if !l.CheckAuth(secret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin secret"})
			return
		}
		users, err := l.GetAllUsers()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": users})
	}
}

func NewAdminDrawsHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := c.GetHeader("X-Admin-Secret")
		l := logic.NewAdminLogic(ctx)
		if !l.CheckAuth(secret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin secret"})
			return
		}
		records, err := l.GetDrawRecords()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": records})
	}
}

func NewAdminAwardsHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := c.GetHeader("X-Admin-Secret")
		l := logic.NewAdminLogic(ctx)
		if !l.CheckAuth(secret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin secret"})
			return
		}
		awards, err := l.GetAllAwards()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"data": awards})
	}
}

func NewAdminResetDataHandler(ctx *svc.ServiceContext) gin.HandlerFunc {
	return func(c *gin.Context) {
		secret := c.GetHeader("X-Admin-Secret")
		l := logic.NewAdminLogic(ctx)
		if !l.CheckAuth(secret) {
			c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid admin secret"})
			return
		}
		if err := l.ResetData(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		c.JSON(http.StatusOK, gin.H{"message": "success"})
	}
}
EOF

echo "Updating internal/handler/routes.go..."
cat <<'EOF' > internal/handler/routes.go
package handler

import (
	"happynewyear/internal/svc"
	"net/http"

	"github.com/gin-gonic/gin"
)

func RegisterHandlers(r *gin.Engine, ctx *svc.ServiceContext) {
	r.GET("/health", func(c *gin.Context) {
		c.String(http.StatusOK, "ok")
	})

	api := r.Group("/api")
	{
		api.GET("/login", NewLoginHandler(ctx))
		api.GET("/user/info", NewUserInfoHandler(ctx))
		api.POST("/game/score", NewGameScoreHandler(ctx))
		api.GET("/game/awards", NewAwardsHandler(ctx))
		api.POST("/game/draw", NewDrawHandler(ctx))
		api.GET("/rank", NewRankHandler(ctx))

		admin := api.Group("/admin")
		{
			admin.GET("/users", NewAdminUsersHandler(ctx))
			admin.GET("/draws", NewAdminDrawsHandler(ctx))
			admin.GET("/awards", NewAdminAwardsHandler(ctx))
			admin.POST("/reset", NewAdminResetDataHandler(ctx))
		}
	}
}
EOF

echo "Updating frontend/src/pages/Admin.tsx..."
cat <<'EOF' > frontend/src/pages/Admin.tsx
import { useState } from 'react';
import api from '../services/api';
import LevelBadge from '../components/LevelBadge';

interface AdminUser {
    id: number;
    user_id: string;
    name: string;
    score: number;
    chances: number;
    level: number;
    created_at: string;
}

interface AdminDrawRecord {
    id: number;
    user_id: string;
    name: string;
    award_name: string;
    created_at: string;
    data_hash: string;
}

const Admin = () => {
    const [secret, setSecret] = useState('');
    const [isAuthed, setIsAuthed] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [draws, setDraws] = useState<AdminDrawRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'users' | 'draws'>('users');

    const handleLogin = async (e: any) => {
        e.preventDefault();
        setLoading(true);
        try {
            const [userRes, drawRes] = await Promise.all([
                api.get('/admin/users', { headers: { 'X-Admin-Secret': secret } }),
                api.get('/admin/draws', { headers: { 'X-Admin-Secret': secret } })
            ]);
            setUsers(userRes.data.data || []);
            setDraws(drawRes.data.data || []);
            setIsAuthed(true);
        } catch (err: any) {
            alert(err.response?.data?.error || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    const handleExportUsers = () => {
        if (users.length === 0) return;
        const headers = ['ID', 'WeComID', '姓名', '总得分', '抽奖次数', '等级', '注册时间'];
        const csvRows = [headers.join(',')];
        users.forEach((u: AdminUser) => {
            csvRows.push([u.id, u.user_id, u.name, u.score, u.chances, u.level, u.created_at].join(','));
        });
        downloadCSV(csvRows.join('\n'), `happynewyear_users_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handleExportDraws = () => {
        if (draws.length === 0) return;
        const headers = ['ID', 'WeComID', '姓名', '奖品', '时间', '审计哈希'];
        const csvRows = [headers.join(',')];
        draws.forEach((d: AdminDrawRecord) => {
            csvRows.push([d.id, d.user_id, d.name, d.award_name, d.created_at, d.data_hash].join(','));
        });
        downloadCSV(csvRows.join('\n'), `happynewyear_draws_${new Date().toISOString().slice(0, 10)}.csv`);
    };

    const handleResetData = async () => {
        if (!window.confirm('警告：此操作将清除所有用户分数、抽奖机会和中奖记录。此操作不可逆，确定要继续吗？')) {
            return;
        }

        setLoading(true);
        try {
            await api.post('/admin/reset', {}, { headers: { 'X-Admin-Secret': secret } });
            alert('数据已成功重置！');
            const [userRes, drawRes] = await Promise.all([
                api.get('/admin/users', { headers: { 'X-Admin-Secret': secret } }),
                api.get('/admin/draws', { headers: { 'X-Admin-Secret': secret } })
            ]);
            setUsers(userRes.data.data || []);
            setDraws(drawRes.data.data || []);
        } catch (err: any) {
            alert(err.response?.data?.error || '重置失败');
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthed) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white p-4">
                <form onSubmit={handleLogin} className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-sm">
                    <h2 className="text-2xl font-bold mb-6 text-center">管理后台登录</h2>
                    <input
                        type="password"
                        value={secret}
                        onChange={(e) => setSecret(e.target.value)}
                        placeholder="请输入管理员密钥"
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 mb-4 focus:ring-2 focus:ring-blue-500 outline-none"
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 py-3 rounded-lg font-bold transition-colors"
                    >
                        {loading ? '验证中...' : '登录'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-800">游戏数据中心</h1>
                        <div className="flex gap-4 mt-4">
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`pb-2 px-1 font-bold transition-all ${activeTab === 'users' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-400'}`}
                            >
                                参与人员 ({users.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('draws')}
                                className={`pb-2 px-1 font-bold transition-all ${activeTab === 'draws' ? 'text-blue-600 border-b-4 border-blue-600' : 'text-gray-400'}`}
                            >
                                抽奖记录 ({draws.length})
                            </button>
                        </div>
                    </div>
                    {activeTab === 'users' ? (
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetData}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center text-sm"
                            >
                                <span className="mr-2">🧹</span> 重置数据
                            </button>
                            <button
                                onClick={handleExportUsers}
                                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center"
                            >
                                <span className="mr-2">📊</span> 导出人员数据
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <button
                                onClick={handleResetData}
                                disabled={loading}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold shadow-md transition-all flex items-center text-sm"
                            >
                                <span className="mr-2">🧹</span> 重置数据
                            </button>
                            <button
                                onClick={handleExportDraws}
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center"
                            >
                                <span className="mr-2">📝</span> 导出抽奖记录
                            </button>
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    {activeTab === 'users' ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">统计</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">等级</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {users.map(u => (
                                        <tr key={u.user_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold">{u.name}</div>
                                                <div className="text-xs text-gray-400 font-mono tracking-tighter">{u.user_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex gap-4">
                                                    <div>
                                                        <div className="text-[10px] text-gray-400">总分</div>
                                                        <div className="font-mono font-bold text-blue-600">{u.score}</div>
                                                    </div>
                                                    <div>
                                                        <div className="text-[10px] text-gray-400">剩余次数</div>
                                                        <div className="font-mono font-bold text-purple-600">{u.chances}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <LevelBadge level={u.level} />
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-400 whitespace-nowrap">
                                                {u.created_at}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">用户</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">奖品内容</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">时间</th>
                                        <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">审计 Hash</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {draws.map((d, idx) => (
                                        <tr key={`${d.user_id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold">{d.name || '未知用户'}</div>
                                                <div className="text-xs text-gray-400 font-mono tracking-tighter">{d.user_id}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className={`px-3 py-1 rounded-full text-sm font-bold inline-block ${d.award_name.includes('大奖') ? 'bg-red-100 text-red-600' :
                                                    d.award_name.includes('奖励') ? 'bg-orange-100 text-orange-600' :
                                                        d.award_name.includes('积分') ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {d.award_name}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {d.created_at}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-[10px] font-mono text-gray-300 break-all max-w-[120px]">
                                                    {d.data_hash}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const downloadCSV = (content: string, filename: string) => {
    const csvContent = "\uFEFF" + content;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export default Admin;
EOF

echo "Starting build..."
docker build --no-cache -t happynewyear-app .
echo "Restarting containers..."
docker-compose up -d
echo "Done!"
