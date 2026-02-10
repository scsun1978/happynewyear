import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUserStore } from '../store/userStore';

const Draw = () => {
    const navigate = useNavigate();
    const { user, setUser } = useUserStore();
    const [isDrawing, setIsDrawing] = useState(false);
    const [prize, setPrize] = useState<{ name: string, type: number, value: number, image_url: string } | null>(null);

    useEffect(() => {
        api.get('/user/info').then(res => {
            setUser(res.data.user);
        });
    }, [setUser, prize]); // Refresh info when prize changes (收下好运)

    const handleDraw = async () => {
        if (!user || user.chances <= 0) {
            alert("抽奖次数不足！请先去玩游戏获取次数。");
            return;
        }

        setIsDrawing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));

            const res = await api.post('/draw');
            if (res.data.code === 0) {
                setPrize(res.data.data);
                // The backend already deducted chance, we just need to locally sync if not re-fetching immediately
                // But re-fetching via useEffect dependency on 'prize' is cleaner.
            } else {
                alert(res.data.msg);
            }
        } catch (err) {
            console.error(err);
            alert('抽奖失败，请重试');
        } finally {
            setIsDrawing(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-festival-red text-white p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 text-9xl opacity-10 pointer-events-none">🏮</div>
            <div className="absolute bottom-0 right-0 text-9xl opacity-10 pointer-events-none">🧨</div>

            <button
                onClick={() => navigate('/')}
                className="absolute top-4 left-4 text-yellow-200 hover:text-white z-10"
            >
                ← 返回首页
            </button>

            <h1 className="text-4xl font-bold mb-8 text-festival-gold drop-shadow-md">幸运大抽奖</h1>

            <div className={`w-64 h-64 bg-red-900 rounded-full flex items-center justify-center mb-8 border-4 border-yellow-500 shadow-[0_0_30px_rgba(250,213,119,0.3)] relative overflow-hidden transition-all duration-500 ${isDrawing ? 'scale-110 shadow-[0_0_50px_rgba(250,213,119,0.6)]' : ''}`}>
                {isDrawing ? (
                    <div className="text-8xl animate-spin">⚙️</div>
                ) : (
                    <div className="text-8xl animate-bounce">🎁</div>
                )}
            </div>

            <div className="text-center mb-8">
                <p className="text-yellow-200 mb-1">当前剩余次数</p>
                <p className="text-5xl font-bold font-mono">{user?.chances || 0}</p>
            </div>

            <div className="space-y-4 w-full max-w-xs z-10">
                <button
                    onClick={handleDraw}
                    disabled={isDrawing || (user?.chances || 0) <= 0}
                    className={`w-full py-4 rounded-xl text-xl font-bold transition shadow-lg transform active:scale-95
                        ${isDrawing || (user?.chances || 0) <= 0
                            ? 'bg-gray-600 cursor-not-allowed text-gray-400'
                            : 'bg-gradient-to-b from-yellow-300 to-yellow-500 text-red-900 hover:from-yellow-200 hover:to-yellow-400'
                        }`}
                >
                    {isDrawing ? '正在开奖...' : '立即抽奖'}
                </button>

                <button
                    onClick={() => navigate('/game')}
                    className="w-full py-3 bg-red-800 hover:bg-red-700 border border-yellow-500/30 rounded-xl text-yellow-100"
                >
                    去玩游戏赚次数
                </button>
            </div>

            {/* Result Modal */}
            {prize && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
                    <div className="bg-festival-red p-8 rounded-2xl border-4 border-yellow-500 text-center max-w-sm w-full animate-pop-in shadow-2xl relative">
                        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 text-6xl">
                            🎉
                        </div>
                        <h2 className="text-3xl font-bold text-yellow-300 mb-6 mt-4">恭喜中奖!</h2>

                        <div className="bg-red-900/50 p-6 rounded-xl mb-6 border border-yellow-500/20">
                            <p className="text-2xl font-bold text-white mb-2">{prize.name}</p>
                            {prize.type === 4 && prize.value > 0 && (
                                <p className="text-yellow-400 font-mono text-xl mb-2">+{prize.value} 积分</p>
                            )}
                            <p className="text-sm text-yellow-200/60 lowercase text-capitalize">
                                {prize.type === 4 ? "积分已直接存入您的总账户！" : "请联系行政领取您的奖品"}
                            </p>
                        </div>

                        <button
                            onClick={() => setPrize(null)}
                            className="bg-yellow-500 text-red-900 px-8 py-3 rounded-full font-bold text-lg hover:bg-yellow-400 shadow-lg"
                        >
                            收下好运
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Draw;
