
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useState, useEffect } from 'react';
import { Heart, Zap, Trophy, MapPin, Diamond, Rocket, ArrowUpCircle, Shield, Activity, PlusCircle, Play, Pause, ChevronLeft, ChevronRight, Home, Reply, ShoppingCart, FlaskConical, Magnet, Wallet, Gift, Package, X } from 'lucide-react';
import { useStore } from '../../store';
import { GameStatus, GEMINI_COLORS, ShopItem, RUN_SPEED_BASE } from '../../types';
import { audio } from '../System/Audio';

const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'SHIELD',
        name: '能量护盾',
        description: '抵挡一次伤害，持续5秒。',
        cost: 150,
        icon: Shield
    },
    {
        id: 'POTION',
        name: '得分药水',
        description: '5秒内获得双倍积分。',
        cost: 500,
        icon: FlaskConical
    },
    {
        id: 'MAGNET',
        name: '强力磁铁',
        description: '4秒内吸附周围道具。',
        cost: 500,
        icon: Magnet
    },
    {
        id: 'ROCKET',
        name: '超级火箭',
        description: '乘坐火箭飞行4秒，无视障碍。',
        cost: 1000,
        icon: Rocket
    }
];

const RechargeScreen: React.FC = () => {
    const { closeRecharge, redeemKey } = useStore();
    const [shake, setShake] = useState(false);
    const [flash, setFlash] = useState(false);
    const [message, setMessage] = useState<string | null>(null);

    // Individual input states
    const [keys, setKeys] = useState<{ [key: string]: string }>({
        pack: '',
        life: '',
        super: ''
    });

    const handleRedeem = (type: string, key: string) => {
        if (!key) return;
        
        const result = redeemKey(key);
        
        if (result.success) {
            audio.playSuccess();
            setMessage(result.message);
            setKeys(prev => ({ ...prev, [type]: '' })); // Clear input
            setTimeout(() => setMessage(null), 3000);
        } else {
            audio.playError();
            setShake(true);
            setFlash(true);
            setMessage(result.message);
            setTimeout(() => {
                setShake(false);
                setFlash(false);
                setMessage(null);
            }, 500);
        }
    };

    return (
        <div className={`absolute inset-0 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto flex items-center justify-center transition-colors duration-100 ${flash ? 'bg-red-900/80' : 'bg-black/90'}`}>
             <div className={`relative bg-gray-900 border border-gray-700 p-6 rounded-2xl shadow-2xl max-w-4xl w-full mx-4 flex flex-col md:flex-row gap-6 ${shake ? 'animate-translate-x-2' : ''}`}>
                 <button onClick={closeRecharge} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
                 
                 {/* Left Panel: Info & QR */}
                 <div className="flex-1 flex flex-col items-center text-center">
                     <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4 font-cyber tracking-widest">充值中心</h2>
                     <div className="bg-gray-800/50 p-4 rounded-lg mb-4 text-sm text-gray-300 leading-relaxed text-left border border-gray-700">
                         <p className="mb-2">还在为生命值太少导致容错率太低而烦恼吗？还在为道具太少过不了关而苦恼吗？没关系，这个入口就是专门为你量身定制，不要999，不要888，只要0.1/0.3/0.6即可获得小宋提供的强大道具，还在等什么，赶快行动起来吧</p>
                         <p className="text-yellow-400 font-bold">使用方法：小宋收到钱后会给你发一个key，在对应的商品下输入key即可获得道具<br/>PS：你也可以瞎猜key</p>
                     </div>
                     <div className="bg-white p-2 rounded-lg mb-2">
                        {/* Placeholder QR Code - Using a generic QR API to simulate the look */}
                        <img src="components/UI/e84973f764b0360c0c85e01d438fbfdf.jpg" alt="收款码" className="w-32 h-32 md:w-40 md:h-40" />
                     </div>
                     <p className="text-xs text-gray-500">支持微信支付</p>
                 </div>

                 {/* Right Panel: Products */}
                 <div className="flex-1 flex flex-col gap-4 justify-center">
                     {message && <div className={`text-center font-bold mb-2 ${message.includes('成功') ? 'text-green-400' : 'text-red-500'}`}>{message}</div>}

                     {/* Item 1: Item Pack */}
                     <div className="bg-gray-800 p-3 rounded-lg flex flex-col gap-2 border border-gray-700 hover:border-cyan-500 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className="bg-cyan-900/50 p-2 rounded-full"><Package className="text-cyan-400 w-6 h-6" /></div>
                             <div className="flex-1">
                                 <h3 className="font-bold text-lg">道具大礼包 <span className="text-yellow-400 text-sm ml-2">¥0.1</span></h3>
                                 <p className="text-xs text-gray-400">所有道具数量 +1 (可叠加)</p>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="输入key"
                                className="flex-1 bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm focus:border-cyan-500 outline-none"
                                value={keys.pack}
                                onChange={(e) => setKeys({...keys, pack: e.target.value})}
                             />
                             <button onClick={() => handleRedeem('pack', keys.pack)} className="bg-cyan-600 hover:bg-cyan-500 px-3 py-1 rounded text-sm font-bold">兑换</button>
                         </div>
                     </div>

                     {/* Item 2: Life Pack */}
                     <div className="bg-gray-800 p-3 rounded-lg flex flex-col gap-2 border border-gray-700 hover:border-pink-500 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className="bg-pink-900/50 p-2 rounded-full"><Heart className="text-pink-500 w-6 h-6 fill-pink-500" /></div>
                             <div className="flex-1">
                                 <h3 className="font-bold text-lg">生命值大礼包 <span className="text-yellow-400 text-sm ml-2">¥0.3</span></h3>
                                 <p className="text-xs text-gray-400">生命上限永久 +1 (可叠加)</p>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="输入key"
                                className="flex-1 bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm focus:border-pink-500 outline-none"
                                value={keys.life}
                                onChange={(e) => setKeys({...keys, life: e.target.value})}
                             />
                             <button onClick={() => handleRedeem('life', keys.life)} className="bg-pink-600 hover:bg-pink-500 px-3 py-1 rounded text-sm font-bold">兑换</button>
                         </div>
                     </div>

                     {/* Item 3: Super Gift */}
                     <div className="bg-gray-800 p-3 rounded-lg flex flex-col gap-2 border border-gray-700 hover:border-purple-500 transition-colors">
                         <div className="flex items-center gap-3">
                             <div className="bg-purple-900/50 p-2 rounded-full"><Gift className="text-purple-400 w-6 h-6" /></div>
                             <div className="flex-1">
                                 <h3 className="font-bold text-lg">超级大礼包 <span className="text-yellow-400 text-sm ml-2">¥0.6</span></h3>
                                 <p className="text-xs text-gray-400">道具+2 & 生命+2 (可叠加)</p>
                             </div>
                         </div>
                         <div className="flex gap-2">
                             <input 
                                type="text" 
                                placeholder="输入key"
                                className="flex-1 bg-black/30 border border-gray-600 rounded px-2 py-1 text-sm focus:border-purple-500 outline-none"
                                value={keys.super}
                                onChange={(e) => setKeys({...keys, super: e.target.value})}
                             />
                             <button onClick={() => handleRedeem('super', keys.super)} className="bg-purple-600 hover:bg-purple-500 px-3 py-1 rounded text-sm font-bold">兑换</button>
                         </div>
                     </div>

                     {/* Explicit Return Button */}
                     <button onClick={closeRecharge} className="mt-2 w-full py-3 bg-transparent border border-gray-500 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg font-bold flex items-center justify-center transition-all group">
                        <Reply className="mr-2 w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 返回主菜单
                     </button>
                 </div>
             </div>
        </div>
    );
};

const ShopScreen: React.FC = () => {
    const { score, buyItem, closeShop } = useStore();

    return (
        <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
             <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                 <h2 className="text-3xl md:text-4xl font-black text-cyan-400 mb-2 font-cyber tracking-widest text-center">赛博商店</h2>
                 <div className="flex items-center text-yellow-400 mb-6 md:mb-8">
                     <span className="text-base md:text-lg mr-2">积分:</span>
                     <span className="text-xl md:text-2xl font-bold">{score.toLocaleString()}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 max-w-5xl w-full mb-8">
                     {SHOP_ITEMS.map(item => {
                         const Icon = item.icon;
                         const canAfford = score >= item.cost;
                         return (
                             <div key={item.id} className="bg-gray-900/80 border border-gray-700 p-4 md:p-6 rounded-xl flex flex-col items-center text-center hover:border-cyan-500 transition-colors">
                                 <div className="bg-gray-800 p-3 md:p-4 rounded-full mb-3 md:mb-4">
                                     <Icon className="w-6 h-6 md:w-8 md:h-8 text-cyan-400" />
                                 </div>
                                 <h3 className="text-lg md:text-xl font-bold mb-2">{item.name}</h3>
                                 <p className="text-gray-400 text-xs md:text-sm mb-4 h-10 md:h-12 flex items-center justify-center">{item.description}</p>
                                 <button 
                                    onClick={() => buyItem(item.id, item.cost)}
                                    disabled={!canAfford}
                                    className={`px-4 md:px-6 py-2 rounded font-bold w-full text-sm md:text-base ${canAfford ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:brightness-110' : 'bg-gray-700 cursor-not-allowed opacity-50'}`}
                                 >
                                     {item.cost}
                                 </button>
                             </div>
                         );
                     })}
                 </div>

                 <button 
                    onClick={closeShop}
                    className="flex items-center px-8 md:px-10 py-3 md:py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(255,0,255,0.4)]"
                 >
                     继续游戏 <Play className="ml-2 w-5 h-5" fill="white" />
                 </button>
             </div>
        </div>
    );
};

export const HUD: React.FC = () => {
  const { score, lives, maxLives, collectedLetters, status, level, restartGame, startGame, gemsCollected, distance, activeEffects, speed, pauseGame, resumeGame, quitToMenu, openShop, inventory, useItem, openRecharge } = useStore();
  const target = ['G', 'E', 'M', 'I', 'N', 'I'];

  const containerClass = "absolute inset-0 pointer-events-none flex flex-col justify-between p-4 md:p-8 z-50";

  // Dispatch helpers
  const dispatch = (eventName: string) => {
    window.dispatchEvent(new Event(eventName));
  };

  if (status === GameStatus.RECHARGE) {
      return <RechargeScreen />;
  }

  if (status === GameStatus.PAUSED) {
      return (
          <div className="absolute inset-0 bg-black/60 z-[100] text-white pointer-events-auto backdrop-blur-md flex items-center justify-center">
               <div className="flex flex-col items-center p-8 bg-gray-900/90 border border-cyan-500/50 rounded-2xl shadow-[0_0_50px_rgba(0,255,255,0.15)] max-w-sm w-full mx-4">
                   <h2 className="text-3xl font-black text-white mb-8 font-cyber tracking-wider">已暂停</h2>
                   <button onClick={resumeGame} className="w-full mb-4 flex items-center justify-center px-6 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-lg font-bold text-lg hover:brightness-110 transition-all"><Play className="mr-2 w-5 h-5 fill-white" /> 继续游戏</button>
                   <button onClick={quitToMenu} className="w-full flex items-center justify-center px-6 py-4 bg-gray-800 border border-gray-700 rounded-lg font-bold text-lg text-gray-300 hover:bg-gray-700 transition-all"><Home className="mr-2 w-5 h-5" /> 主菜单</button>
               </div>
          </div>
      );
  }

  if (status === GameStatus.SHOP) {
      return <ShopScreen />;
  }

  if (status === GameStatus.MENU) {
      return (
          <div className="absolute inset-0 flex items-center justify-center z-[100] bg-black/80 backdrop-blur-sm p-4 pointer-events-auto">
              <div className="relative w-full max-w-md rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,255,255,0.2)] border border-white/10 animate-in zoom-in-95 duration-500">
                <div className="relative w-full bg-gray-900">
                     <img src="https://www.gstatic.com/aistudio/starter-apps/gemini_runner/gemini_runner.png" alt="Gemini Runner Cover" className="w-full h-auto block" />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#050011] via-black/30 to-transparent"></div>
                     {/* Recharge Button */}
                     <button onClick={openRecharge} className="absolute top-4 right-4 bg-yellow-500/20 hover:bg-yellow-500/40 border border-yellow-500 text-yellow-400 p-2 rounded-full backdrop-blur-md transition-all z-20" title="充值中心">
                         <Wallet className="w-6 h-6" />
                     </button>
                     <div className="absolute inset-0 flex flex-col justify-end items-center p-6 pb-8 text-center z-10">
                        <button onClick={() => { audio.init(); startGame(); }} className="w-full group relative px-6 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white font-black text-xl rounded-xl hover:bg-white/20 transition-all shadow-[0_0_20px_rgba(0,255,255,0.2)] hover:shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:border-cyan-400 overflow-hidden">
                            <span className="relative z-10 tracking-widest flex items-center justify-center">开始任务 <Play className="ml-2 w-5 h-5 fill-white" /></span>
                        </button>
                        <p className="text-cyan-400/60 text-[10px] md:text-xs font-mono mt-3 tracking-wider">[ 点击或使用方向键 ]</p>
                     </div>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.GAME_OVER) {
      return (
          <div className="absolute inset-0 bg-black/90 z-[100] text-white pointer-events-auto backdrop-blur-sm overflow-y-auto">
              <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <h1 className="text-4xl md:text-6xl font-black text-white mb-6 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] font-cyber text-center">游戏结束</h1>
                <div className="grid grid-cols-1 gap-3 md:gap-4 text-center mb-8 w-full max-w-md">
                    <div className="bg-gray-900/80 p-3 md:p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                        <div className="flex items-center text-yellow-400 text-sm md:text-base"><Trophy className="mr-2 w-4 h-4 md:w-5 md:h-5"/> 关卡</div>
                        <div className="text-xl md:text-2xl font-bold font-mono">{level} / 3</div>
                    </div>
                     <div className="bg-gray-800/50 p-3 md:p-4 rounded-lg flex items-center justify-between mt-2">
                        <div className="flex items-center text-white text-sm md:text-base">得分</div>
                        <div className="text-2xl md:text-3xl font-bold font-cyber text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">{score.toLocaleString()}</div>
                    </div>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-md">
                    <button onClick={() => { audio.init(); restartGame(); }} className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_20px_rgba(0,255,255,0.4)] flex items-center justify-center"><Reply className="mr-2" /> 再次挑战</button>
                    <button onClick={quitToMenu} className="w-full px-8 py-3 bg-gray-800 border border-gray-600 text-gray-300 font-bold text-base rounded hover:bg-gray-700 transition-all flex items-center justify-center"><Home className="mr-2 w-4 h-4" /> 主菜单</button>
                </div>
              </div>
          </div>
      );
  }

  if (status === GameStatus.VICTORY) {
    return (
        <div className="absolute inset-0 bg-gradient-to-b from-purple-900/90 to-black/95 z-[100] text-white pointer-events-auto backdrop-blur-md overflow-y-auto">
            <div className="flex flex-col items-center justify-center min-h-full py-8 px-4">
                <Rocket className="w-16 h-16 md:w-24 md:h-24 text-yellow-400 mb-4 animate-bounce drop-shadow-[0_0_15px_rgba(255,215,0,0.6)]" />
                <h1 className="text-3xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-500 to-pink-500 mb-2 font-cyber text-center">任务完成</h1>
                <div className="bg-black/60 p-6 rounded-xl border border-yellow-500/30 shadow-[0_0_15px_rgba(255,215,0,0.1)] mb-8">
                    <div className="text-xs md:text-sm text-gray-400 mb-1 tracking-wider text-center">最终得分</div>
                    <div className="text-3xl md:text-4xl font-bold font-cyber text-yellow-400">{score.toLocaleString()}</div>
                </div>
                <div className="flex flex-col gap-3 w-full max-w-md">
                     <button onClick={() => { audio.init(); restartGame(); }} className="w-full px-8 py-5 bg-white text-black font-black text-lg md:text-xl rounded hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)] tracking-widest">重新开始</button>
                    <button onClick={quitToMenu} className="w-full px-8 py-3 bg-transparent border border-white/20 text-white/70 font-bold text-base rounded hover:bg-white/10 transition-all flex items-center justify-center"><Home className="mr-2 w-4 h-4" /> 主菜单</button>
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className={containerClass}>
        {/* Top Left: Pause & Score */}
        <div className="absolute top-4 left-4 flex flex-col items-start pointer-events-auto z-50">
            <button onClick={pauseGame} className="mb-2 p-2 bg-gray-900/50 backdrop-blur-md rounded-full border border-white/10 hover:border-cyan-400 transition-colors">
                <Pause className="w-6 h-6 text-cyan-400" />
            </button>
            <div className="text-3xl md:text-5xl font-bold text-cyan-400 drop-shadow-[0_0_10px_#00ffff] font-cyber">{score.toLocaleString()}</div>
        </div>
        
        {/* Top Right: Lives & Shop */}
        <div className="absolute top-4 right-4 flex flex-col items-end space-y-2 pointer-events-auto z-50">
             <div className="flex space-x-1 md:space-x-2 mb-2">
                {[...Array(maxLives)].map((_, i) => (
                    <Heart key={i} className={`w-6 h-6 md:w-8 md:h-8 ${i < lives ? 'text-pink-500 fill-pink-500' : 'text-gray-800 fill-gray-800'} drop-shadow-[0_0_5px_#ff0054]`} />
                ))}
            </div>
            <button onClick={openShop} className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full border-2 border-yellow-300 shadow-[0_0_15px_rgba(255,215,0,0.5)] hover:scale-110 transition-transform">
                <ShoppingCart className="w-6 h-6 text-white" />
            </button>
        </div>

        {/* Level Indicator */}
        <div className="absolute top-5 left-1/2 transform -translate-x-1/2 text-sm md:text-lg text-purple-300 font-bold tracking-wider font-mono bg-black/50 px-3 py-1 rounded-full border border-purple-500/30 backdrop-blur-sm z-50">
            关卡 {level} <span className="text-gray-500 text-xs md:text-sm">/ 3</span>
        </div>

        {/* Gemini Status */}
        <div className="absolute top-20 md:top-24 left-1/2 transform -translate-x-1/2 flex space-x-2 md:space-x-3 z-40">
            {target.map((char, idx) => {
                const isCollected = collectedLetters.includes(idx);
                const color = GEMINI_COLORS[idx];
                return (
                    <div key={idx} style={{ borderColor: isCollected ? color : 'rgba(55, 65, 81, 1)', color: isCollected ? 'rgba(0, 0, 0, 0.8)' : 'rgba(55, 65, 81, 1)', boxShadow: isCollected ? `0 0 20px ${color}` : 'none', backgroundColor: isCollected ? color : 'rgba(0, 0, 0, 0.9)' }} className="w-8 h-10 md:w-10 md:h-12 flex items-center justify-center border-2 font-black text-lg md:text-xl font-cyber rounded-lg transition-all duration-300">
                        {char}
                    </div>
                );
            })}
        </div>

        {/* Bottom Left: Move Controls */}
        <div className="absolute bottom-6 left-6 flex space-x-4 pointer-events-auto">
             <button onClick={(e) => { e.stopPropagation(); dispatch('move-left'); }} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:bg-cyan-500/40 active:border-cyan-400 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                 <ChevronLeft className="w-8 h-8 text-white" />
             </button>
             <button onClick={(e) => { e.stopPropagation(); dispatch('move-right'); }} className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md border border-white/20 active:bg-cyan-500/40 active:border-cyan-400 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(0,0,0,0.5)]">
                 <ChevronRight className="w-8 h-8 text-white" />
             </button>
        </div>

        {/* Bottom Right: Items & Jump */}
        <div className="absolute bottom-6 right-6 flex flex-row items-end space-x-4 pointer-events-auto">
             {/* Item Stack */}
             <div className="flex flex-col space-y-3 mb-2">
                 {/* Magnet */}
                 <button onClick={() => useItem('MAGNET')} disabled={inventory.magnet === 0 || activeEffects.magnet} className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all ${activeEffects.magnet ? 'bg-purple-500 border-purple-300 animate-pulse' : inventory.magnet > 0 ? 'bg-purple-500/20 border-purple-500 hover:bg-purple-500/40' : 'bg-gray-800 border-gray-600 opacity-50'}`}>
                     <Magnet className="w-5 h-5 text-purple-400" />
                     <span className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-600">{inventory.magnet}</span>
                 </button>

                 {/* Potion */}
                 <button onClick={() => useItem('POTION')} disabled={inventory.potion === 0 || activeEffects.potion} className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all ${activeEffects.potion ? 'bg-green-500 border-green-300 animate-pulse' : inventory.potion > 0 ? 'bg-green-500/20 border-green-500 hover:bg-green-500/40' : 'bg-gray-800 border-gray-600 opacity-50'}`}>
                     <FlaskConical className="w-5 h-5 text-green-400" />
                     <span className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-600">{inventory.potion}</span>
                 </button>
                 
                 {/* Rocket */}
                 <button onClick={() => useItem('ROCKET')} disabled={inventory.rocket === 0 || activeEffects.rocket} className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all ${activeEffects.rocket ? 'bg-red-500 border-red-300 animate-pulse' : inventory.rocket > 0 ? 'bg-red-500/20 border-red-500 hover:bg-red-500/40' : 'bg-gray-800 border-gray-600 opacity-50'}`}>
                     <Rocket className="w-5 h-5 text-red-400" />
                     <span className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-600">{inventory.rocket}</span>
                 </button>

                 {/* Shield */}
                 <button onClick={() => useItem('SHIELD')} disabled={inventory.shield === 0 || activeEffects.shield} className={`relative w-12 h-12 rounded-full border flex items-center justify-center transition-all ${activeEffects.shield ? 'bg-yellow-500 border-yellow-300 animate-pulse' : inventory.shield > 0 ? 'bg-yellow-500/20 border-yellow-500 hover:bg-yellow-500/40' : 'bg-gray-800 border-gray-600 opacity-50'}`}>
                     <Shield className="w-5 h-5 text-yellow-400" />
                     <span className="absolute -bottom-1 -right-1 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-600">{inventory.shield}</span>
                 </button>
             </div>

             {/* Jump Button */}
             <button onClick={(e) => { e.stopPropagation(); dispatch('player-jump'); }} className="w-20 h-20 rounded-full bg-cyan-600/30 backdrop-blur-md border-2 border-cyan-400/50 active:bg-cyan-500/60 active:scale-95 flex items-center justify-center transition-all shadow-[0_0_20px_rgba(0,255,255,0.3)]">
                 <ArrowUpCircle className="w-10 h-10 text-cyan-100" />
             </button>
        </div>
    </div>
  );
};
