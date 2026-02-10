import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { soundManager } from '../utils/SoundManager';

// Game Constants
const CANVAS_WIDTH = 360;
const CANVAS_HEIGHT = 600;
const PLAYER_WIDTH = 60;
const PLAYER_HEIGHT = 60;
const ITEM_SIZE = 40;
const GAME_DURATION = 60; // seconds

interface GameState {
    isPlaying: boolean;
    score: number;
    timeLeft: number;
    gameOver: boolean;
    result?: {
        earned_chances: number;
    };
}

const Game = () => {
    const navigate = useNavigate();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameState, setGameState] = useState<GameState>({
        isPlaying: false,
        score: 0,
        timeLeft: GAME_DURATION,
        gameOver: false,
    });

    // Game Logic Refs
    const stateRef = useRef({
        playerX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
        items: [] as { x: number, y: number, type: 'good' | 'bad', level: number, speed: number }[],
        effects: [] as { x: number, y: number, text: string, life: number }[], // Floating text
        score: 0,
        timeLeft: GAME_DURATION,
        isPlaying: false,
        lastSpawn: 0,
        nonce: '',
        gameId: '',
        startTime: 0,
    });

    const requestRef = useRef<number>(0);

    const startGame = async () => {
        try {
            const res = await api.post('/game/start');
            const { game_id, nonce } = res.data;

            stateRef.current = {
                playerX: CANVAS_WIDTH / 2 - PLAYER_WIDTH / 2,
                items: [],
                effects: [],
                score: 0,
                timeLeft: GAME_DURATION,
                isPlaying: true,
                lastSpawn: 0,
                nonce,
                gameId: game_id,
                startTime: Date.now(),
            };

            setGameState({
                isPlaying: true,
                score: 0,
                timeLeft: GAME_DURATION,
                gameOver: false,
            });

            requestRef.current = requestAnimationFrame(gameLoop);
        } catch (err) {
            console.error(err);
            alert('开始游戏失败，请重试');
        }
    };

    const endGame = async () => {
        if (!stateRef.current.isPlaying) return;
        stateRef.current.isPlaying = false;
        cancelAnimationFrame(requestRef.current!);

        soundManager.playWin();

        const duration = Math.floor((Date.now() - stateRef.current.startTime) / 1000);
        if (duration < 1) return;

        try {
            const payload = {
                score: stateRef.current.score,
                duration: duration,
                nonce: stateRef.current.nonce,
                signature: "",
                timestamp: Date.now().toString(),
            };

            const res = await api.post('/game/end', payload);
            setGameState(prev => ({
                ...prev,
                isPlaying: false,
                gameOver: true,
                score: stateRef.current.score,
                result: res.data.data
            }));
        } catch (err) {
            console.error(err);
            alert('提交成绩失败');
            navigate('/');
        }
    };

    const gameLoop = (timestamp: number) => {
        if (!stateRef.current.isPlaying) return;

        const ctx = canvasRef.current?.getContext('2d');
        if (!ctx) return;

        const now = Date.now();
        const elapsed = Math.floor((now - stateRef.current.startTime) / 1000);
        const remaining = GAME_DURATION - elapsed;

        if (remaining <= 0) {
            endGame();
            return;
        }

        if (remaining !== stateRef.current.timeLeft) {
            stateRef.current.timeLeft = remaining;
            setGameState(prev => ({ ...prev, timeLeft: remaining }));
        }

        if (timestamp - stateRef.current.lastSpawn > 400) { // Spawn faster
            const typeProb = Math.random();
            const levelProb = Math.random();
            let type: 'good' | 'bad' = typeProb > 0.3 ? 'good' : 'bad';
            let level = 1;

            if (type === 'good') {
                if (levelProb > 0.9) level = 3; // 10%
                else if (levelProb > 0.7) level = 2; // 20%
                else level = 1; // 70%
            } else {
                if (levelProb > 0.7) level = 2; // 30%
                else level = 1; // 70%
            }

            // Difficulty scaling: speed increases as time passes
            const speedFactor = 1 + (elapsed / GAME_DURATION) * 0.8;
            const baseSpeed = 4 + Math.random() * 3;

            stateRef.current.items.push({
                x: Math.random() * (CANVAS_WIDTH - ITEM_SIZE),
                y: -ITEM_SIZE,
                type,
                level,
                speed: baseSpeed * speedFactor,
            });
            stateRef.current.lastSpawn = timestamp;
        }

        stateRef.current.items.forEach(item => {
            item.y += item.speed;
        });

        // Collision Check
        stateRef.current.items = stateRef.current.items.filter(item => {
            if (
                item.x < stateRef.current.playerX + PLAYER_WIDTH &&
                item.x + ITEM_SIZE > stateRef.current.playerX &&
                item.y < CANVAS_HEIGHT - 10 &&
                item.y + ITEM_SIZE > CANVAS_HEIGHT - 10 - PLAYER_HEIGHT
            ) {
                if (item.type === 'good') {
                    let pts = 10;
                    if (item.level === 2) pts = 20;
                    if (item.level === 3) pts = 50;

                    stateRef.current.score += pts;
                    soundManager.playCatch();
                    stateRef.current.effects.push({
                        x: item.x, y: item.y, text: `+${pts}`, life: 25
                    });
                } else {
                    let penalty = 10;
                    if (item.level === 2) penalty = 30;

                    stateRef.current.score = Math.max(0, stateRef.current.score - penalty);
                    soundManager.playBoom();
                    stateRef.current.effects.push({
                        x: item.x, y: item.y, text: `-${penalty}`, life: 25
                    });
                }
                setGameState(prev => ({ ...prev, score: stateRef.current.score }));
                return false;
            }
            return item.y < CANVAS_HEIGHT;
        });

        // Clear Canvas
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Background Gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
        gradient.addColorStop(0, '#1a0505');
        gradient.addColorStop(1, '#2c0b0b');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw Player (Bag Emoji or Bag shape)
        ctx.font = `${PLAYER_SIZE}px serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.fillText('👜', stateRef.current.playerX + PLAYER_WIDTH / 2, CANVAS_HEIGHT - 10 - PLAYER_HEIGHT / 2);


        // Draw Items
        stateRef.current.items.forEach(item => {
            ctx.font = `${ITEM_SIZE}px serif`;
            let emoji = '🧧';
            if (item.type === 'good') {
                if (item.level === 2) emoji = '💰';
                if (item.level === 3) emoji = '💎';
            } else {
                if (item.level === 1) emoji = '🧨';
                if (item.level === 2) emoji = '💣';
            }
            ctx.fillText(emoji, item.x + ITEM_SIZE / 2, item.y + ITEM_SIZE / 2);
        });

        // Draw Effects
        ctx.font = 'bold 20px Arial';
        stateRef.current.effects = stateRef.current.effects.filter(effect => {
            effect.life--;
            effect.y -= 1; // Float up

            ctx.fillStyle = effect.text.startsWith('+') ? '#FFD700' : '#FF0000';
            ctx.fillText(effect.text, effect.x + ITEM_SIZE / 2, effect.y);

            return effect.life > 0;
        });

        requestRef.current = requestAnimationFrame(gameLoop);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        const touchX = e.touches[0].clientX;
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const x = touchX - rect.left - PLAYER_WIDTH / 2;
            stateRef.current.playerX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, x));
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
            const x = e.clientX - rect.left - PLAYER_WIDTH / 2;
            stateRef.current.playerX = Math.max(0, Math.min(CANVAS_WIDTH - PLAYER_WIDTH, x));
        }
    };

    return (
        <div className="flex flex-col items-center min-h-screen bg-festival-red text-white p-4">
            <div className="w-full max-w-md flex justify-between mb-4">
                <span className="text-xl font-bold">云力值: {gameState.score}</span>
                <span className="text-xl font-mono text-festival-gold">{gameState.timeLeft}s</span>
            </div>

            <div className="relative border-4 border-yellow-600 rounded-lg overflow-hidden shadow-2xl">
                {!gameState.isPlaying && !gameState.gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10">
                        <div className="text-6xl mb-4 animate-bounce">🧧</div>
                        <button
                            onClick={startGame}
                            className="bg-festival-gold text-red-900 px-8 py-4 rounded-full text-2xl font-black animate-pulse shadow-lg"
                        >
                            开始挑战
                        </button>
                        <p className="mt-4 text-gray-300">左右移动接住红包</p>
                    </div>
                )}

                {gameState.gameOver && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-20">
                        <h2 className="text-3xl font-bold mb-4 text-festival-gold">挑战结束</h2>
                        <p className="text-xl mb-2">最终云力值: {gameState.score}</p>
                        <p className="text-lg text-yellow-400 mb-8 border border-yellow-500/50 p-2 rounded bg-yellow-500/10">
                            获得抽奖次数: +{gameState.result?.earned_chances || 0}
                        </p>
                        <div className="space-x-4">
                            <button
                                onClick={startGame}
                                className="bg-festival-gold text-red-900 px-6 py-2 rounded-lg font-bold"
                            >
                                再玩一次
                            </button>
                            <button
                                onClick={() => navigate('/draw')}
                                className="bg-red-600 border border-yellow-500 text-white px-6 py-2 rounded-lg font-bold"
                            >
                                去抽奖
                            </button>
                        </div>
                    </div>
                )}

                <canvas
                    ref={canvasRef}
                    width={CANVAS_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="bg-gray-900 touch-none cursor-pointer"
                    onTouchMove={handleTouchMove}
                    onMouseMove={handleMouseMove}
                />
            </div>
        </div>
    );
};

// Helper constant
const PLAYER_SIZE = 50;

export default Game;
