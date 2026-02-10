import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useUserStore } from '../store/userStore';
import LevelBadge from '../components/LevelBadge';

interface RankItem {
    rank: number;
    user_id: string;
    name: string;
    avatar: string;
    total_score: number;
    level: number;
}

const Rank = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();
    const [ranks, setRanks] = useState<RankItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRanks = async () => {
            try {
                const res = await api.get('/rank');
                setRanks(res.data.data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchRanks();
    }, []);

    const myRankItem = ranks.find(r => r.user_id === user?.user_id);

    return (
        <div className="flex flex-col items-center min-h-screen bg-festival-red text-white p-4 pb-24">
            <div className="w-full max-w-md">
                <div className="flex items-center mb-8">
                    <button onClick={() => navigate('/')} className="text-yellow-300 text-2xl mr-4">←</button>
                    <h1 className="text-3xl font-bold text-yellow-300 drop-shadow-md">新年云端榜</h1>
                </div>

                {loading ? (
                    <div className="flex justify-center p-20">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
                    </div>
                ) : (
                    <div className="bg-red-800/40 rounded-3xl overflow-hidden border border-yellow-500/20 shadow-2xl backdrop-blur-md">
                        <table className="w-full text-left">
                            <thead className="bg-red-900/60 text-yellow-500/80 text-xs uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">排名</th>
                                    <th className="px-4 py-3">大侠</th>
                                    <th className="px-4 py-3 text-right">云力值</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-yellow-500/10">
                                {ranks.map((item) => (
                                    <tr key={item.user_id} className={`${item.user_id === user?.user_id ? 'bg-yellow-500/20' : ''}`}>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center">
                                                {item.rank <= 3 ? (
                                                    <span className="text-2xl">{['🥇', '🥈', '🥉'][item.rank - 1]}</span>
                                                ) : (
                                                    <span className="w-6 text-center font-mono text-gray-400">{item.rank}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex items-center">
                                                <div className="mr-3 relative">
                                                    <img src={item.avatar || 'https://via.placeholder.com/40'} alt="" className="w-10 h-10 rounded-full border border-yellow-500/50" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm">{item.name}</div>
                                                    <LevelBadge level={item.level} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <span className="font-mono font-bold text-yellow-300">{item.total_score.toLocaleString()}</span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Sticky bottom self info */}
            {user && (
                <div className="fixed bottom-0 left-0 right-0 bg-red-900/90 border-t border-yellow-500/50 p-4 backdrop-blur-md z-40">
                    <div className="max-w-md mx-auto flex justify-between items-center">
                        <div className="flex items-center">
                            <div className="text-xs text-gray-400 mr-2">我的排名:</div>
                            <div className="text-xl font-bold text-yellow-300">{myRankItem ? myRankItem.rank : '未上榜'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-400">当前得分:</div>
                            <div className="text-xl font-bold">{user.total_score}</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Rank;
