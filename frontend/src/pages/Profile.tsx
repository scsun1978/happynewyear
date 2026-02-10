import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUserStore } from '../store/userStore';

const Profile = () => {
    const navigate = useNavigate();
    const { user, setUser, logout } = useUserStore();

    useEffect(() => {
        api.get('/user/info').then(res => {
            setUser(res.data.user);
        });
    }, [setUser]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-festival-red text-white p-4">
            <div className="flex justify-between items-center mb-8">
                <button onClick={() => navigate('/')} className="text-yellow-200">← 返回首页</button>
                <button onClick={handleLogout} className="text-white/60 hover:text-white">退出登录</button>
            </div>

            <div className="flex flex-col items-center mb-10">
                <div className="w-24 h-24 bg-red-900 border-4 border-yellow-500 rounded-full flex items-center justify-center text-4xl mb-4 overflow-hidden shadow-lg">
                    {user?.avatar ? <img src={user.avatar} alt="avatar" /> : user?.name?.[0]}
                </div>
                <h1 className="text-3xl font-bold text-yellow-300">{user?.name}</h1>
                <p className="text-red-200 text-sm mt-1">{user?.user_id}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-red-900/40 border border-yellow-500/30 p-4 rounded-xl text-center backdrop-blur-sm">
                    <p className="text-yellow-100 text-sm mb-1">总云力值</p>
                    <p className="text-3xl font-bold text-white">{user?.total_score}</p>
                </div>
                <div className="bg-red-900/40 border border-yellow-500/30 p-4 rounded-xl text-center backdrop-blur-sm">
                    <p className="text-yellow-100 text-sm mb-1">剩余抽奖次数</p>
                    <p className="text-3xl font-bold text-yellow-400">{user?.chances}</p>
                </div>
            </div>

            <div className="bg-white/10 rounded-xl p-6 border border-white/5">
                <h2 className="text-lg font-bold mb-4 text-yellow-200 border-l-4 border-yellow-500 pl-3">我的记录</h2>
                <div className="text-center text-white/40 py-8 italic">
                    暂无详细记录
                    <br />
                    <span className="text-xs not-italic mt-2 block">(功能正在开发中...)</span>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-xs text-red-900/40 px-8">
                    神州云服 · 新年快乐
                </p>
            </div>
        </div>
    );
};

export default Profile;
