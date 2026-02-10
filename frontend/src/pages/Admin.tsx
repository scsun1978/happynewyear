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

const Admin = () => {
    const [secret, setSecret] = useState('');
    const [isAuthed, setIsAuthed] = useState(false);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await api.get('/admin/users', {
                headers: { 'X-Admin-Secret': secret }
            });
            setUsers(res.data.data || []);
            setIsAuthed(true);
        } catch (err: any) {
            alert(err.response?.data?.error || '登录失败');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        if (users.length === 0) return;

        const headers = ['ID', 'WeComID', '姓名', '总得分', '抽奖次数', '等级', '注册时间'];
        const csvRows = [headers.join(',')];

        users.forEach(u => {
            const row = [
                u.id,
                u.user_id,
                u.name,
                u.score,
                u.chances,
                u.level,
                u.created_at
            ];
            csvRows.push(row.join(','));
        });

        const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for Excel Chinese support
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `happynewyear_users_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
                        <p className="text-gray-500">共计 {users.length} 名参与者</p>
                    </div>
                    <button
                        onClick={handleExport}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center"
                    >
                        <span className="mr-2">📊</span> 导出 CSV 数据
                    </button>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                </div>
            </div>
        </div>
    );
};

export default Admin;
