import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '../store/userStore';

declare global {
    interface Window {
        WwLogin: any;
    }
}

const Home = () => {
    const navigate = useNavigate();
    const { user } = useUserStore();

    useEffect(() => {
        // Check if user is already logged in
        if (user) return;

        // Detect Environment
        const isWeChat = /MicroMessenger/i.test(navigator.userAgent);
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isWeChat || isMobile) {
            // Mobile: Do nothing, let user click login or auto-redirect if strictly enforced
            // For now, we provide a button to login via OAuth
        } else {
            // PC: Show QR Code
            // Need to wait for div to mount
            const timer = setTimeout(() => {
                if (window.WwLogin) {
                    window.WwLogin({
                        "id": "wx_reg",
                        "appid": "ww112f4f89390a03cd",
                        "agentid": "1000037",
                        "redirect_uri": encodeURIComponent("https://happynewyear.ilinkedge.cn/login"),
                        "state": "qr_login",
                        "href": "", // Optional custom css
                        "lang": "zh",
                    });
                }
            }, 500);
            return () => clearTimeout(timer);
        }
    }, [user]);

    const handleStartGame = () => {
        if (!user) {
            alert("请先登录 / Please Login First");
            return;
        }
        navigate('/game');
    };

    const handleMobleLogin = () => {
        // Redirect to WeCom OAuth
        const appid = "ww112f4f89390a03cd";
        const redirect_uri = encodeURIComponent("https://happynewyear.ilinkedge.cn/login");
        window.location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${appid}&redirect_uri=${redirect_uri}&response_type=code&scope=snsapi_base&state=STATE#wechat_redirect`;
    };

    const [showRules, setShowRules] = React.useState(false);

    return (
        <div className="flex flex-col items-center min-h-screen bg-festival-red text-festival-gold overflow-hidden relative">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 text-7xl opacity-20 animate-bounce transition-all duration-3000">🏮</div>
            <div className="absolute top-10 right-10 text-7xl opacity-20 animate-pulse transition-all duration-2000">🧨</div>
            <div className="absolute bottom-10 left-10 text-7xl opacity-20 animate-bounce transition-all duration-3000 delay-700">🧧</div>
            <div className="absolute bottom-0 right-0 text-7xl opacity-25 animate-pulse transition-all duration-2000 delay-500">🐎</div>

            <div className="z-10 flex flex-col items-center w-full max-w-md p-6 mt-10">
                {/* Rules Button */}
                <button
                    onClick={() => setShowRules(true)}
                    className="absolute top-4 right-4 text-sm text-yellow-200/80 underline"
                >
                    活动规则
                </button>

                <h1 className="text-3xl font-black mb-2 text-white drop-shadow-md tracking-widest">神州云服</h1>
                <h2 className="text-5xl font-black mb-1 text-yellow-300 drop-shadow-2xl text-center tracking-tighter animate-fade-in">
                    新年快乐
                </h2>
                <div className="text-2xl font-bold bg-yellow-500/20 px-6 py-2 rounded-full border border-yellow-500/30 text-yellow-200 mb-12 shadow-inner">
                    2026 龙马精神 · 马到成功
                </div>

                {user ? (
                    <div className="w-full space-y-6 animate-fade-in-up">
                        <div className="bg-gradient-to-b from-red-900/60 to-red-950/60 p-6 rounded-3xl border-2 border-yellow-500/40 text-center backdrop-blur-md shadow-2xl">
                            <p className="text-white text-xl">欢迎回来, <span className="font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-500">{user.name}</span></p>
                            <div className="flex justify-center space-x-10 mt-6">
                                <div className="p-3 bg-red-500/10 rounded-xl border border-yellow-500/10">
                                    <p className="text-xs text-yellow-200/60 uppercase tracking-tighter">云力值</p>
                                    <p className="text-3xl font-black text-yellow-400 font-mono tracking-tighter">{user.total_score}</p>
                                </div>
                                <div className="p-3 bg-red-500/10 rounded-xl border border-yellow-500/10">
                                    <p className="text-xs text-yellow-200/60 uppercase tracking-tighter">抽奖次数</p>
                                    <p className="text-3xl font-black text-yellow-400 font-mono tracking-tighter">{user.chances}</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleStartGame}
                            className="w-full py-6 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 text-red-950 rounded-2xl text-4xl font-black shadow-[0_0_30px_rgba(234,179,8,0.4)] transform active:scale-95 transition-all hover:scale-[1.05] hover:shadow-[0_0_50px_rgba(234,179,8,0.6)] border-b-8 border-yellow-700 relative overflow-hidden group"
                        >
                            <span className="relative z-10">策马云端 🐎</span>
                            <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                        </button>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => navigate('/rank')}
                                className="col-span-2 py-5 bg-gradient-to-r from-orange-600 to-red-700 rounded-2xl text-yellow-100 font-black shadow-xl flex items-center justify-center text-2xl border-b-4 border-red-900 group"
                            >
                                <span className="mr-3 group-hover:animate-bounce">🏇</span> 一马当先风云榜
                            </button>
                            <button
                                onClick={() => navigate('/draw')}
                                className="py-4 bg-red-800/80 border border-yellow-500/30 rounded-2xl text-yellow-100 font-bold hover:bg-red-700 shadow-lg transition-colors flex flex-col items-center"
                            >
                                <span className="text-2xl mb-1">🎁</span>
                                幸运抽奖
                            </button>
                            <button
                                onClick={() => navigate('/profile')}
                                className="py-4 bg-red-800/80 border border-yellow-500/30 rounded-2xl text-yellow-100 font-bold hover:bg-red-700 shadow-lg transition-colors flex flex-col items-center"
                            >
                                <span className="text-2xl mb-1">📜</span>
                                我的成就
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full flex flex-col items-center bg-white/10 p-6 rounded-xl backdrop-blur-sm">
                        <div id="wx_reg" className="mb-4"></div>

                        {/* Fallback for Mobile / if QR script fails */}
                        <button
                            onClick={handleMobleLogin}
                            className="w-full py-3 bg-green-600 text-white rounded-lg font-bold shadow-lg"
                        >
                            企业微信一键登录
                        </button>
                        <p className="mt-4 text-sm text-yellow-200/80 text-center">
                            请使用企业微信扫码或登录<br /><span className="text-xs opacity-60 italic">恭祝您 2026 马到成功，宏图大展</span>
                        </p>
                    </div>
                )}

                <div className="mt-auto py-8 text-center text-red-900/60 text-[10px] font-mono tracking-widest">
                    © 2026 SHENZHOU CLOUD SERVICES<br />ALL RIGHTS RESERVED
                </div>

                {/* Rules Modal */}
                {showRules && (
                    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
                        <div className="bg-festival-red border-2 border-yellow-500 rounded-2xl p-6 max-w-sm w-full relative shadow-2xl">
                            <button
                                onClick={() => setShowRules(false)}
                                className="absolute top-2 right-2 text-yellow-200 text-2xl"
                            >
                                &times;
                            </button>
                            <h3 className="text-2xl font-bold text-yellow-300 mb-4 text-center">活动规则</h3>
                            <ul className="space-y-3 text-yellow-100/90 text-sm">
                                <li className="flex items-start">
                                    <span className="mr-2">1.</span>
                                    <span>控制福袋 👜 接住下落的红包 🧧，每个红包 +10 分。</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">2.</span>
                                    <span>注意躲避鞭炮 🧨，碰到会扣除 20 分。</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">3.</span>
                                    <span><strong className="text-yellow-300">每 100 分</strong> 可获得 1 次抽奖机会，上不封顶！</span>
                                </li>
                                <li className="flex items-start">
                                    <span className="mr-2">4.</span>
                                    <span>每局游戏限时 60 秒。</span>
                                </li>
                            </ul>
                            <div className="mt-6 text-center">
                                <button
                                    onClick={() => setShowRules(false)}
                                    className="bg-yellow-500 text-red-900 px-6 py-2 rounded-full font-bold"
                                >
                                    我知道了
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Home;
