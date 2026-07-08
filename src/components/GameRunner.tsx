import React, { useState, useEffect, useRef } from 'react';
import { PlayerStats } from '../types';
import { SKINS, ACCESSORIES, AURAS } from '../data/shopItems';
import { 
  Heart, Coins, Trophy, Zap, RefreshCw, ShoppingCart, Play, AlertTriangle, 
  ArrowLeft, ArrowRight, ChevronUp, Sparkles, Shield, ListTodo, Users, CheckCircle2,
  Minimize2, Maximize2, RotateCw, Gamepad2, BookOpen
} from 'lucide-react';
import { playSound } from '../utils/audio';
import { AdBanner } from './AdBanner';

interface GameRunnerProps {
  gameId: 'jumper' | 'clicker';
  stats: PlayerStats;
  updateStats: (updater: (prev: PlayerStats) => PlayerStats) => void;
  addLog: (type: 'earn' | 'purchase_coins' | 'purchase_booster' | 'purchase_cosmetic' | 'stage_skip', desc: string, amount: number, currency: 'coins' | 'real') => void;
  openShop: () => void;
  onExit: () => void;
}

export const GameRunner: React.FC<GameRunnerProps> = ({
  gameId,
  stats,
  updateStats,
  addLog,
  openShop,
  onExit
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [victory, setVictory] = useState(false);
  const [score, setScore] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Screen layout customizable states
  const [screenMode, setScreenMode] = useState<'normal' | 'fullscreen'>('normal');
  const [isVertical, setIsVertical] = useState<boolean>(false);

  // Mario level stats tracked in React state for display
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [enemiesKilled, setEnemiesKilled] = useState(0);
  const [playerLivesRemaining, setPlayerLivesRemaining] = useState(stats.lives);
  const [activeMissions, setActiveMissions] = useState([
    { id: 'coins', text: 'Coletar 10 Moedas de Ouro', target: 10, current: 0, completed: false, reward: 40 },
    { id: 'goombas', text: 'Derrotar 2 Goombas Robôs (Pule em cima!)', target: 2, current: 0, completed: false, reward: 50 },
    { id: 'survive', text: 'Chegar à bandeira no final', target: 1, current: 0, completed: false, reward: 30 }
  ]);

  // References for high-speed Canvas game loop
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const requestRef = useRef<number | null>(null);

  // Grab active shop customizations & check advantages
  const activeSkin = SKINS.find((s) => s.id === stats.avatar.skin) || SKINS[0];
  const activeAccessory = ACCESSORIES.find((a) => a.id === stats.avatar.accessory) || ACCESSORIES[0];
  const activeAura = AURAS.find((au) => au.id === stats.avatar.aura) || AURAS[0];

  const hasDoubleJump = activeAura.id !== 'none' || activeAccessory.id === 'wizard';
  const hasShieldArmor = activeAccessory.id === 'viking' || activeAccessory.id === 'crown' || stats.isVip;
  const hasCoinMagnet = activeSkin.id === 'golden-warrior' || activeAura.id === 'stardust';
  const hasSpeedBoost = activeSkin.id === 'cyber-purple' || activeSkin.id === 'matrix-hacker';

  const stageSkipsOwned = stats.unlockedAccessories.filter(x => x === 'booster_stage_skip').length;

  // Track live key inputs
  const keysPressedRef = useRef({
    left: false,
    right: false,
    jump: false
  });

  // Track entire 60 FPS platformer state in ref to avoid React stutters
  const physicsStateRef = useRef({
    playerX: 60,
    playerY: 100,
    playerVx: 0,
    playerVy: 0,
    isGrounded: false,
    doubleJumpAvailable: hasDoubleJump,
    health: hasShieldArmor ? 3 : 2,
    maxHealth: hasShieldArmor ? 3 : 2,
    invulnerableFrames: 0,
    coinsEarnedThisRun: 0,
    enemiesDefeated: 0,
    cameraX: 0,
    flagReached: false,
    flagY: 40,
    castleWalkTimer: 0,
    levelCompleted: false,
    blocks: [] as any[],
    coins: [] as any[],
    enemies: [] as any[],
    particles: [] as any[],
    clouds: [] as any[],
    hills: [] as any[]
  });

  // AABB A-Box Helper
  const collides = (x1: number, y1: number, w1: number, h1: number, x2: number, y2: number, w2: number, h2: number) => {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  };

  // Generate Mario stages dynamically depending on difficulty stage
  const generateLevelData = (stage: number) => {
    const blocks: any[] = [];
    const coins: any[] = [];
    const enemies: any[] = [];

    // 1. Build ground with periodic gaps
    let cx = 0;
    while (cx < 2000) {
      const isGap = stage > 1 && Math.random() < 0.15 && cx > 300 && cx < 1600;
      const chunkW = isGap ? 90 : 180 + Math.random() * 200;

      if (!isGap) {
        blocks.push({
          x: cx,
          y: 200,
          w: chunkW,
          h: 40,
          type: 'ground'
        });
      }
      cx += chunkW;
    }

    // 2. Spawn static pipes and bricks
    const blockPositions = [200, 320, 480, 640, 800, 960, 1120, 1300, 1480, 1600];
    blockPositions.forEach((bx, idx) => {
      // Check if there's ground underneath to prevent spawning above a void
      const hasGround = blocks.some(g => g.type === 'ground' && bx >= g.x && bx + 40 <= g.x + g.w);
      if (!hasGround) return;

      // Question blocks
      const isQuestion = idx % 2 === 0;
      blocks.push({
        x: bx,
        y: 120,
        w: 24,
        h: 24,
        type: isQuestion ? 'question' : 'brick',
        hit: false,
        yOffset: 0
      });

      // Spawn a couple of coins floating above
      if (Math.random() < 0.6) {
        coins.push({
          x: bx + 4,
          y: 80,
          collected: false,
          id: Math.random()
        });
      }
    });

    // 3. Spawn classic green entry pipes
    const pipeXCoords = [380, 750, 1200, 1550];
    pipeXCoords.forEach((px) => {
      const hasGround = blocks.some(g => g.type === 'ground' && px >= g.x && px + 36 <= g.x + g.w);
      if (!hasGround) return;

      // Pipe heights vary
      const pipeH = 30 + Math.floor(Math.random() * 20);
      blocks.push({
        x: px,
        y: 200 - pipeH,
        w: 36,
        h: pipeH,
        type: 'pipe'
      });
    });

    // 4. Floating coin arcs
    const arcCenters = [260, 560, 900, 1050, 1400, 1700];
    arcCenters.forEach((ax) => {
      // Spawn 3 coins in an arc shape
      coins.push({ x: ax - 20, y: 150, collected: false, id: Math.random() });
      coins.push({ x: ax, y: 130, collected: false, id: Math.random() });
      coins.push({ x: ax + 20, y: 150, collected: false, id: Math.random() });
    });

    // 5. Goombas (Little alien robot bugs)
    const goombaCount = 3 + Math.floor(stage / 2) + Math.floor(Math.random() * 2);
    for (let i = 0; i < goombaCount; i++) {
      const ex = 400 + i * 280 + Math.random() * 120;
      enemies.push({
        x: ex,
        y: 180,
        vx: -(0.7 + stage * 0.15 + Math.random() * 0.3),
        width: 20,
        height: 20,
        alive: true,
        squishFrame: 0,
        id: Math.random()
      });
    }

    return { blocks, coins, enemies };
  };

  // Generate parallax backgrounds
  const generateBackgrounds = () => {
    const clouds = Array.from({ length: 8 }, (_, i) => ({
      x: i * 250 + Math.random() * 80,
      y: 20 + Math.random() * 40,
      w: 50 + Math.random() * 30,
      h: 20 + Math.random() * 15,
      speed: 0.1 + Math.random() * 0.15
    }));

    const hills = Array.from({ length: 12 }, (_, i) => ({
      x: i * 180 + Math.random() * 40,
      y: 200,
      w: 80 + Math.random() * 100,
      h: 40 + Math.random() * 70,
      color: i % 2 === 0 ? '#14532d' : '#166534' // dark forestry green
    }));

    return { clouds, hills };
  };

  // Clicker Game States (Neon Clicker) - Kept intact for compatibility
  const [clickerTimeLeft, setClickerTimeLeft] = useState(15);
  const [bubbles, setBubbles] = useState<{ id: number; x: number; y: number; size: number; color: string; val: number }[]>([]);
  const clickerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Spawn clicker bubbles
  const spawnBubbles = () => {
    const bubbleColors = ['#06b6d4', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
    const newBubbles = Array.from({ length: 5 }, (_, i) => ({
      id: Math.random() + i,
      x: 10 + Math.random() * 80,
      y: 10 + Math.random() * 75,
      size: 40 + Math.random() * 20,
      color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
      val: Math.floor(Math.random() * 5) + 8
    }));
    setBubbles(newBubbles);
  };

  const handleBubbleClick = (id: number, val: number) => {
    setScore((prev) => prev + val);
    playSound.collect();
    setBubbles((prev) => prev.filter((b) => b.id !== id));
    setTimeout(() => {
      const bubbleColors = ['#06b6d4', '#d946ef', '#10b981', '#fbbf24', '#3b82f6'];
      const newB = {
        id: Math.random(),
        x: 10 + Math.random() * 80,
        y: 10 + Math.random() * 75,
        size: 35 + Math.random() * 25,
        color: bubbleColors[Math.floor(Math.random() * bubbleColors.length)],
        val: Math.floor(Math.random() * 5) + 8
      };
      setBubbles((prev) => [...prev, newB]);
    }, 150);
  };

  const targetClickerQuota = 100 + stats.currentStage * 15;

  const evaluateClickerOutcome = () => {
    setIsPlaying(false);
    setScore((finalScore) => {
      if (finalScore >= targetClickerQuota) {
        completeStageVictory(finalScore);
        playSound.victory();
        setVictory(true);
      } else {
        deductLifeOnCrash();
        playSound.gameover();
        setGameOver(true);
      }
      return finalScore;
    });
  };

  // Helper to handle lives subtraction on death
  const deductLifeOnCrash = () => {
    updateStats((prev) => {
      const nextLives = Math.max(0, prev.lives - 1);
      setPlayerLivesRemaining(nextLives);
      return {
        ...prev,
        lives: nextLives,
        points: (prev.points ?? 0) + 15 // XP for effort
      };
    });
    addLog('purchase_booster', `Perdeu vida jogando Super Mario Arcade`, 1, 'coins');
  };

  // Helper to award coins and complete level
  const completeStageVictory = (runScore: number) => {
    // Stage rewards + missions rewards
    let coinReward = 40 + stats.currentStage * 8;
    
    // Evaluate which missions were completed
    let completedCount = 0;
    const finalMissions = activeMissions.map((m) => {
      let isCompleted = false;
      if (m.id === 'coins' && runScore >= m.target) isCompleted = true;
      if (m.id === 'goombas' && physicsStateRef.current.enemiesDefeated >= m.target) isCompleted = true;
      if (m.id === 'survive') isCompleted = true; // flag flagpole reached

      if (isCompleted) {
        coinReward += m.reward;
        completedCount++;
      }
      return { ...m, current: m.id === 'coins' ? runScore : physicsStateRef.current.enemiesDefeated, completed: isCompleted };
    });

    setActiveMissions(finalMissions);

    // Apply active rtp boost / lucky double coins if exists
    if (stats.rtpBoostSpins && stats.rtpBoostSpins > 0) {
      coinReward *= 2;
      updateStats(prev => ({
        ...prev,
        rtpBoostSpins: Math.max(0, (prev.rtpBoostSpins ?? 0) - 1)
      }));
    }

    updateStats((prev) => ({
      ...prev,
      currentStage: prev.currentStage + 1,
      coins: prev.coins + coinReward,
      highScore: Math.max(prev.highScore, runScore),
      points: (prev.points ?? 0) + 80 // XP Completed
    }));

    addLog('earn', `Limpou Estágio ${stats.currentStage} com ${completedCount} missões concluídas!`, coinReward, 'coins');
  };

  // Escape key handler to exit fullscreen mode
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setScreenMode('normal');
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, []);

  // CLICKER TIMER EFFECT
  useEffect(() => {
    if (gameId !== 'clicker' || !isPlaying || gameOver || victory) return;

    setClickerTimeLeft(15);
    setScore(0);
    spawnBubbles();

    clickerTimerRef.current = setInterval(() => {
      setClickerTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(clickerTimerRef.current!);
          evaluateClickerOutcome();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (clickerTimerRef.current) clearInterval(clickerTimerRef.current);
    };
  }, [gameId, isPlaying]);

  // SUPER MARIO PLATFORMER MAIN LOOP
  useEffect(() => {
    if (gameId !== 'jumper' || !isPlaying || gameOver || victory) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reset scores & HUD states
    setCoinsCollected(0);
    setEnemiesKilled(0);
    setScore(0);

    // Reset level maps
    const { blocks, coins, enemies } = generateLevelData(stats.currentStage);
    const { clouds, hills } = generateBackgrounds();

    // Setup physical properties
    physicsStateRef.current = {
      playerX: 60,
      playerY: 100,
      playerVx: 0,
      playerVy: 0,
      isGrounded: false,
      doubleJumpAvailable: hasDoubleJump,
      health: hasShieldArmor ? 3 : 2,
      maxHealth: hasShieldArmor ? 3 : 2,
      invulnerableFrames: 0,
      coinsEarnedThisRun: 0,
      enemiesDefeated: 0,
      cameraX: 0,
      flagReached: false,
      flagY: 40,
      castleWalkTimer: 0,
      levelCompleted: false,
      blocks,
      coins,
      enemies,
      particles: [],
      clouds,
      hills
    };

    // Particles helpers
    const spawnDustParticle = (x: number, y: number) => {
      physicsStateRef.current.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: -Math.random() * 1,
        life: 20,
        maxLife: 20,
        size: 3 + Math.random() * 3,
        color: '#cbd5e1'
      });
    };

    const spawnBrickDebris = (x: number, y: number) => {
      for (let i = 0; i < 4; i++) {
        physicsStateRef.current.particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 4,
          vy: -3 - Math.random() * 3,
          life: 30,
          maxLife: 30,
          size: 4 + Math.random() * 4,
          color: '#f59e0b', // golden amber wood
          gravity: 0.3
        });
      }
    };

    const spawnPointFloatingText = (x: number, y: number, text: string) => {
      physicsStateRef.current.particles.push({
        x,
        y,
        vx: 0,
        vy: -0.8,
        life: 45,
        maxLife: 45,
        text,
        size: 11,
        color: '#facc15'
      });
    };

    const triggerJumpAction = () => {
      const state = physicsStateRef.current;
      if (state.isGrounded) {
        state.playerVy = -8.2;
        state.isGrounded = false;
        state.doubleJumpAvailable = hasDoubleJump;
        playSound.jump();
        spawnDustParticle(state.playerX + 12, state.playerY + 32);
      } else if (state.doubleJumpAvailable) {
        state.playerVy = -7.5;
        state.doubleJumpAvailable = false;
        playSound.jump();
        // gorgeous double-jump halo particle bursts
        for (let i = 0; i < 6; i++) {
          physicsStateRef.current.particles.push({
            x: state.playerX + 12,
            y: state.playerY + 28,
            vx: (Math.random() - 0.5) * 4,
            vy: (Math.random() - 0.5) * 1.5,
            life: 15,
            maxLife: 15,
            size: 3 + Math.random() * 3,
            color: '#38bdf8'
          });
        }
      }
    };

    // Event listeners
    const handleKeyDown = (e: KeyboardEvent) => {
      if (physicsStateRef.current.flagReached) return;

      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressedRef.current.left = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressedRef.current.right = true;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        triggerJumpAction();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        keysPressedRef.current.left = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        keysPressedRef.current.right = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // PHYSICS ENGINE GAME LOOP (60 FPS)
    const updateGame = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const state = physicsStateRef.current;
      const keys = keysPressedRef.current;

      // 1. Draw Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      skyGrad.addColorStop(0, '#090d16'); // cosmic midnight deep space
      skyGrad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 2. Parallax clouds drawing
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      state.clouds.forEach(c => {
        c.x -= c.speed;
        if (c.x < -100) c.x = 2100;
        // Scroll camera factor
        const drawX = c.x - state.cameraX * 0.15;
        ctx.beginPath();
        ctx.arc(drawX, c.y, c.h, 0, Math.PI * 2);
        ctx.arc(drawX + 15, c.y - 8, c.h * 1.2, 0, Math.PI * 2);
        ctx.arc(drawX + 35, c.y, c.h * 0.9, 0, Math.PI * 2);
        ctx.fill();
      });

      // 3. Parallax green hills drawing
      state.hills.forEach(h => {
        const drawX = h.x - state.cameraX * 0.4;
        ctx.fillStyle = h.color;
        ctx.beginPath();
        ctx.ellipse(drawX + h.w/2, h.y, h.w/2, h.h, 0, Math.PI, 0);
        ctx.fill();
      });

      // 4. Update camera position smoothly to focus on the player
      const targetCamX = state.playerX - canvas.width / 2.5;
      state.cameraX += (targetCamX - state.cameraX) * 0.1;
      state.cameraX = Math.max(0, Math.min(2000 - canvas.width, state.cameraX));

      // 5. Update player physics if they haven't finished flagpole sliding
      if (!state.flagReached) {
        // Accelerations
        let accSpeed = 1.6;
        if (hasSpeedBoost) accSpeed *= 1.35;

        if (keys.left) {
          state.playerVx = -accSpeed;
        } else if (keys.right) {
          state.playerVx = accSpeed;
        } else {
          state.playerVx *= 0.8;
          if (Math.abs(state.playerVx) < 0.1) state.playerVx = 0;
        }

        // Apply gravity
        state.playerVy += 0.38;
        if (state.playerVy > 9) state.playerVy = 9;

        // X Collision resolution
        state.playerX += state.playerVx;
        if (state.playerX < 0) {
          state.playerX = 0;
          state.playerVx = 0;
        }

        const pW = 22;
        const pH = 28;

        for (let b of state.blocks) {
          if (collides(state.playerX, state.playerY, pW, pH, b.x, b.y, b.w, b.h)) {
            if (state.playerVx > 0) {
              state.playerX = b.x - pW;
              state.playerVx = 0;
            } else if (state.playerVx < 0) {
              state.playerX = b.x + b.w;
              state.playerVx = 0;
            }
          }
        }

        // Y Collision resolution
        state.playerY += state.playerVy;
        state.isGrounded = false;

        for (let b of state.blocks) {
          if (collides(state.playerX, state.playerY, pW, pH, b.x, b.y, b.w, b.h)) {
            if (state.playerVy > 0) {
              // Landing down on top of blocks
              state.playerY = b.y - pH;
              state.playerVy = 0;
              state.isGrounded = true;
              state.doubleJumpAvailable = hasDoubleJump;
            } else if (state.playerVy < 0) {
              // Hitting head on block bottom
              state.playerY = b.y + b.h;
              state.playerVy = 0.5;

              // If hitting brick/question blocks
              if (b.type === 'question' && !b.hit) {
                b.hit = true;
                b.yOffset = -8;
                state.coinsEarnedThisRun++;
                setCoinsCollected(state.coinsEarnedThisRun);
                playSound.collect();
                spawnPointFloatingText(b.x + b.w/2, b.y - 10, '+🪙 COIN');
                // Spawn sparkling coin
                for (let i = 0; i < 5; i++) {
                  state.particles.push({
                    x: b.x + b.w/2,
                    y: b.y - 5,
                    vx: (Math.random() - 0.5) * 3,
                    vy: -4 - Math.random() * 2,
                    life: 25,
                    maxLife: 25,
                    size: 3,
                    color: '#facc15'
                  });
                }
              } else if (b.type === 'brick') {
                spawnBrickDebris(b.x + b.w/2, b.y + b.h/2);
                playSound.click();
                // delete brick on Stage > 2 or bounce
                b.yOffset = -5;
              }
            }
          }
        }

        // Return blocks to normal position after bumper bounce
        state.blocks.forEach(b => {
          if (b.yOffset && b.yOffset < 0) {
            b.yOffset += 0.8;
            if (b.yOffset > 0) b.yOffset = 0;
          }
        });

        // Invulnerable frame ticker
        if (state.invulnerableFrames > 0) {
          state.invulnerableFrames--;
        }

        // Fall into endless pits check
        if (state.playerY > canvas.height + 20) {
          state.health = 0;
        }

      } else {
        // Flagpole victory sequence!
        if (state.flagY < 180) {
          state.flagY += 2;
          state.playerY += 1.5;
        } else {
          // Slide completed, walk to the castle automatically!
          state.playerVx = 1.2;
          state.playerX += state.playerVx;
          // Player is walking on the ground
          state.playerY = 172;

          state.castleWalkTimer++;
          if (state.castleWalkTimer > 80 && !state.levelCompleted) {
            state.levelCompleted = true;
            completeStageVictory(state.coinsEarnedThisRun);
            playSound.victory();
            setIsPlaying(false);
            setVictory(true);
            return;
          }
        }
      }

      // 6. Draw Block structures (Bricks, Question boxes, Pipes)
      state.blocks.forEach(b => {
        const drawX = b.x - state.cameraX;
        const drawY = b.y + (b.yOffset || 0);

        if (b.type === 'ground') {
          // Beautiful pixel soil gradient with grass top
          ctx.fillStyle = '#22c55e'; // neon green grass
          ctx.fillRect(drawX, drawY, b.w, 4);

          ctx.fillStyle = '#3f2c16'; // dark earthy dirt
          ctx.fillRect(drawX, drawY + 4, b.w, b.h - 4);

          // Grid dirt detail dots
          ctx.fillStyle = '#1e1105';
          for (let gx = 10; gx < b.w; gx += 30) {
            ctx.fillRect(drawX + gx, drawY + 12, 3, 3);
            ctx.fillRect(drawX + gx + 15, drawY + 24, 3, 3);
          }
        } else if (b.type === 'brick') {
          // Classic bricks
          ctx.fillStyle = '#b45309'; // brick amber
          ctx.fillRect(drawX, drawY, b.w, b.h);
          ctx.strokeStyle = '#78350f';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(drawX, drawY, b.w, b.h);
          // brick line splits
          ctx.beginPath();
          ctx.moveTo(drawX, drawY + b.h / 2);
          ctx.lineTo(drawX + b.w, drawY + b.h / 2);
          ctx.moveTo(drawX + b.w / 2, drawY);
          ctx.lineTo(drawX + b.w / 2, drawY + b.h / 2);
          ctx.stroke();
        } else if (b.type === 'question') {
          // Animated glowing gold mystery boxes
          const glow = Math.sin(Date.now() / 150) * 0.15 + 0.85;
          ctx.fillStyle = b.hit ? '#475569' : `rgba(234, 179, 8, ${glow})`; // spends slate or glows gold
          ctx.fillRect(drawX, drawY, b.w, b.h);
          ctx.strokeStyle = b.hit ? '#334155' : '#ca8a04';
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, drawY, b.w, b.h);

          // Draw the question mark symbol
          ctx.fillStyle = b.hit ? '#94a3b8' : '#ffffff';
          ctx.font = 'bold 12px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(b.hit ? '•' : '?', drawX + b.w / 2, drawY + b.h / 2 + 1);
        } else if (b.type === 'pipe') {
          // Green industrial tubes
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(drawX, drawY, b.w, b.h);
          // pipe border
          ctx.strokeStyle = '#15803d';
          ctx.lineWidth = 2;
          ctx.strokeRect(drawX, drawY, b.w, b.h);
          // pipe cap top
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(drawX - 2, drawY, b.w + 4, 8);
          ctx.strokeRect(drawX - 2, drawY, b.w + 4, 8);
        }
      });

      // 7. Update and Draw Coins (Spinning & Magnetism attraction)
      state.coins.forEach(c => {
        if (c.collected) return;

        // Magnetism perks! If Golden skin or Stardust aura, attract coins within 90px!
        if (hasCoinMagnet && !state.flagReached) {
          const dx = state.playerX + 11 - c.x;
          const dy = state.playerY + 14 - c.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 90) {
            // pull coins closer!
            c.x += (state.playerX + 11 - c.x) * 0.15;
            c.y += (state.playerY + 14 - c.y) * 0.15;
          }
        }

        // Draw spinning gold coins
        const coinW = 12 * Math.abs(Math.sin(Date.now() / 200));
        const drawX = c.x - state.cameraX;

        ctx.fillStyle = '#facc15'; // shiny gold
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(drawX + 6, c.y + 6, coinW / 2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Check collection collision
        if (collides(state.playerX, state.playerY, 22, 28, c.x, c.y, 12, 12)) {
          c.collected = true;
          state.coinsEarnedThisRun++;
          setCoinsCollected(state.coinsEarnedThisRun);
          playSound.collect();
          spawnPointFloatingText(c.x, c.y, '+1 🪙');
        }
      });

      // 8. Update and Draw Goombas (defeat by squishing on top)
      state.enemies.forEach(e => {
        if (!e.alive && e.squishFrame > 15) return;

        const drawX = e.x - state.cameraX;

        if (e.alive) {
          // Goomba horizontal patrols
          e.x += e.vx;

          // Check block walls in front to bounce back
          state.blocks.forEach(b => {
            if (collides(e.x, e.y, e.width, e.height, b.x, b.y, b.w, b.h)) {
              e.vx = -e.vx;
              e.x += e.vx * 2;
            }
          });

          // Draw active robot Goomba
          const goombaPulse = Math.sin(Date.now() / 150) * 1.5;
          
          // Goomba Mushroom Cap (classic brown/maroon cap)
          ctx.fillStyle = '#991b1b'; // cyber red-brown mushroom cap
          ctx.beginPath();
          ctx.ellipse(drawX + 10, e.y + 7 + goombaPulse/2, 11, 7, 0, 0, Math.PI * 2);
          ctx.fill();
          
          // Cap design spots
          ctx.fillStyle = '#fca5a5'; // lighter spots
          ctx.beginPath();
          ctx.arc(drawX + 6, e.y + 5 + goombaPulse/2, 2, 0, Math.PI * 2);
          ctx.arc(drawX + 14, e.y + 5 + goombaPulse/2, 2, 0, Math.PI * 2);
          ctx.fill();

          // Goomba Stem/Body
          ctx.fillStyle = '#ffedd5'; // cream stem
          ctx.beginPath();
          ctx.roundRect(drawX + 3, e.y + 10, 14, 8, 3);
          ctx.fill();

          // Angry eyebrows
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(drawX + 3, e.y + 9);
          ctx.lineTo(drawX + 8, e.y + 11);
          ctx.moveTo(drawX + 17, e.y + 9);
          ctx.lineTo(drawX + 12, e.y + 11);
          ctx.stroke();

          // Angry glowing red eyes
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.arc(drawX + 5, e.y + 12, 1.5, 0, Math.PI * 2);
          ctx.arc(drawX + 15, e.y + 12, 1.5, 0, Math.PI * 2);
          ctx.fill();

          // Angry mouth
          ctx.fillStyle = '#7f1d1d';
          ctx.beginPath();
          ctx.moveTo(drawX + 7, e.y + 16);
          ctx.lineTo(drawX + 13, e.y + 16);
          ctx.lineTo(drawX + 10, e.y + 14);
          ctx.closePath();
          ctx.fill();

          // Walk legs wobble animation
          const walkCycle = Math.sin(Date.now() / 120) > 0;
          ctx.fillStyle = '#451a03'; // brown feet
          if (walkCycle) {
            ctx.fillRect(drawX + 2, e.y + e.height - 2, 5, 2);
            ctx.fillRect(drawX + 13, e.y + e.height - 2, 5, 2);
          } else {
            ctx.fillRect(drawX + 5, e.y + e.height - 2, 5, 2);
            ctx.fillRect(drawX + 10, e.y + e.height - 2, 5, 2);
          }

          // Check collisions with player
          if (!state.flagReached && collides(state.playerX, state.playerY, 22, 28, e.x, e.y, e.width, e.height)) {
            // Did player land on top of enemy? (falling down)
            const isLanding = state.playerVy > 0.5 && state.playerY + 24 < e.y + 6;

            if (isLanding) {
              e.alive = false;
              e.squishFrame = 1;
              state.playerVy = -5.5; // bounce player upward!
              state.enemiesDefeated++;
              setEnemiesKilled(state.enemiesDefeated);
              playSound.collect();
              spawnPointFloatingText(e.x, e.y, '+100 XP');
            } else {
              // Player hit from side! Apply shield/lives damage
              if (state.invulnerableFrames <= 0) {
                state.health--;
                state.invulnerableFrames = 60; // 1 second immunity
                playSound.gameover();

                if (state.health <= 0) {
                  // Dead! Trigger Game Over
                  deductLifeOnCrash();
                  setIsPlaying(false);
                  setGameOver(true);
                  if (requestRef.current) cancelAnimationFrame(requestRef.current);
                  return;
                } else {
                  // Bounce player back with flash
                  state.playerVx = state.playerX < e.x ? -3.5 : 3.5;
                  state.playerVy = -3;
                }
              }
            }
          }

        } else {
          // Draw squished flattened goomba frame
          e.squishFrame++;
          ctx.fillStyle = '#4c0519';
          ctx.fillRect(drawX, e.y + 12, e.width, 8);
        }
      });

      // 9. Draw the Golden Flagpole and Castle (Stage Target goal)
      const flagpoleX = 1800;
      const drawFlagX = flagpoleX - state.cameraX;

      // Draw flagpole mast
      ctx.fillStyle = '#f59e0b'; // golden cyber-pole
      ctx.fillRect(drawFlagX + 6, 30, 4, 170);

      // Sphere on top
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(drawFlagX + 8, 28, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw waving neon green flag
      const flagGlow = Math.sin(Date.now() / 130) * 3;
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.moveTo(drawFlagX + 10, state.flagY);
      ctx.lineTo(drawFlagX + 42 + flagGlow, state.flagY + 10);
      ctx.lineTo(drawFlagX + 10, state.flagY + 20);
      ctx.closePath();
      ctx.fill();

      // Check Flagpole trigger collision
      if (!state.flagReached && state.playerX + 11 >= flagpoleX && state.playerX <= flagpoleX + 12) {
        state.flagReached = true;
        state.playerVx = 0;
        state.playerVy = 0;
        state.playerX = flagpoleX - 4;
        state.playerY = Math.max(30, Math.min(172, state.playerY));
        playSound.victory();
        spawnPointFloatingText(flagpoleX, state.playerY, 'GOAL! 👑');
      }

      // Draw big castle fortress at the end of the line
      const castleX = 1880;
      const drawCastleX = castleX - state.cameraX;
      ctx.fillStyle = '#1e293b'; // Slate dark tower
      ctx.fillRect(drawCastleX, 120, 80, 80);
      // Castle parapets/crenellations
      ctx.fillRect(drawCastleX, 108, 16, 12);
      ctx.fillRect(drawCastleX + 32, 108, 16, 12);
      ctx.fillRect(drawCastleX + 64, 108, 16, 12);
      // Main dark door
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(drawCastleX + 28, 160, 24, 40);

      // 10. Update and Draw active Particles (dust, coins, explosions)
      state.particles.forEach((p, idx) => {
        p.life--;
        if (p.life <= 0) {
          state.particles.splice(idx, 1);
          return;
        }

        // Apply physical properties
        if (p.gravity) p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;

        const drawPX = p.x - state.cameraX;

        if (p.text) {
          // Floating reward indicator
          ctx.fillStyle = p.color;
          ctx.font = `bold ${p.size}px Courier New`;
          ctx.textAlign = 'center';
          ctx.fillText(p.text, drawPX, p.y);
        } else {
          // Sparkler circles
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life / p.maxLife;
          ctx.beginPath();
          ctx.arc(drawPX, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1.0;
        }
      });

      // 11. Draw Player Character with their active custom skin / aura
      let drawPX = state.playerX - state.cameraX;
      let drawPY = state.playerY;

      // Invulnerable flashing effect
      const isVisible = state.invulnerableFrames === 0 || Math.floor(state.invulnerableFrames / 4) % 2 === 0;
      if (isVisible) {
        ctx.save();

        // A) Draw Purchased Aura/Glow if worn
        if (activeAura.id !== 'none') {
          ctx.shadowColor = activeAura.color === 'cyan' ? '#06b6d4' : activeAura.color === 'orange' ? '#f97316' : activeAura.color === 'green' ? '#22c55e' : '#fde047';
          ctx.shadowBlur = 12;
        }

        // B) Draw custom body base shape depending on selected skin
        ctx.fillStyle = activeSkin.id === 'classic' ? '#34d399' : activeSkin.id === 'cyber-purple' ? '#d946ef' : activeSkin.id === 'golden-warrior' ? '#fbbf24' : activeSkin.id === 'matrix-hacker' ? '#22c55e' : activeSkin.id === 'phantom-shadow' ? '#0f172a' : '#a3e635';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(drawPX, drawPY, 22, 28, 6);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0; // disable glowing shadows for details

        // C) Draw elegant clothing overalls design for Mario look
        ctx.fillStyle = activeSkin.id === 'classic' ? '#2563eb' : '#312e81'; // overalls blue or deep purple
        // Draw bottom trousers block
        ctx.fillRect(drawPX + 2, drawPY + 15, 18, 11);
        
        // Draw overalls straps
        ctx.fillRect(drawPX + 3, drawPY + 8, 4, 7);
        ctx.fillRect(drawPX + 15, drawPY + 8, 4, 7);

        // Yellow buttons
        ctx.fillStyle = '#eab308';
        ctx.fillRect(drawPX + 4, drawPY + 15, 2, 2);
        ctx.fillRect(drawPX + 16, drawPY + 15, 2, 2);

        // Animated Moving Shoes
        const walkCycle = Math.sin(Date.now() / 100) * 3;
        ctx.fillStyle = '#78350f'; // brown boots
        if (keysPressedRef.current.left || keysPressedRef.current.right) {
          ctx.fillRect(drawPX + 1 + walkCycle, drawPY + 26, 6, 2);
          ctx.fillRect(drawPX + 15 - walkCycle, drawPY + 26, 6, 2);
        } else {
          ctx.fillRect(drawPX + 2, drawPY + 26, 6, 2);
          ctx.fillRect(drawPX + 14, drawPY + 26, 6, 2);
        }

        // Red cap on top of classic skin
        if (activeSkin.id === 'classic') {
          ctx.fillStyle = '#dc2626'; // classic red cap
          ctx.beginPath();
          ctx.ellipse(drawPX + 11, drawPY + 3, 10, 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // Cap visor
          ctx.fillRect(drawPX + 6, drawPY + 1, 12, 2);
        }

        // D) Draw Skin visual Emoji
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(activeSkin.emoji, drawPX + 11, drawPY + 12);

        // E) Draw Accessory Emoji if worn
        if (activeAccessory.id !== 'none') {
          ctx.font = '11px Arial';
          ctx.fillText(activeAccessory.emoji, drawPX + 11, drawPY - 5);
        }

        ctx.restore();
      }

      // 12. Draw level goal flag reminder text on screen HUD
      if (state.playerX < 350) {
        ctx.font = '9px Courier New';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.textAlign = 'left';
        ctx.fillText('SUA MISSÃO: CHEGUE AO FINAL DO MAPA ⏩', 15, 20);
      }

      requestRef.current = requestAnimationFrame(updateGame);
    };

    requestRef.current = requestAnimationFrame(updateGame);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [gameId, isPlaying, gameOver, victory]);

  // Handle manual trigger jump for on-screen touch buttons
  const triggerOnScreenJump = () => {
    if (!isPlaying) return;
    const state = physicsStateRef.current;
    if (state.isGrounded) {
      state.playerVy = -8.2;
      state.isGrounded = false;
      state.doubleJumpAvailable = hasDoubleJump;
      playSound.jump();
    } else if (state.doubleJumpAvailable) {
      state.playerVy = -7.5;
      state.doubleJumpAvailable = false;
      playSound.jump();
    }
  };

  const handleStageSkipWithBooster = () => {
    if (stageSkipsOwned <= 0) {
      setErrorMessage('Você não possui créditos para Pular de Fase! Compre na Loja via Pix ou Cartão.');
      playSound.click();
      return;
    }

    updateStats((prev) => {
      const index = prev.unlockedAccessories.indexOf('booster_stage_skip');
      let nextAccessories = [...prev.unlockedAccessories];
      if (index > -1) nextAccessories.splice(index, 1);

      return {
        ...prev,
        unlockedAccessories: nextAccessories,
        currentStage: prev.currentStage + 1,
        coins: prev.coins + 100,
        points: (prev.points ?? 0) + 30
      };
    });

    addLog('stage_skip', `Usou Pulo de Fase para o Nível ${stats.currentStage + 1}`, 1, 'coins');
    playSound.purchase();
    
    setIsPlaying(false);
    setGameOver(false);
    setVictory(false);
    setScore(0);
    setErrorMessage(null);
  };

  const startPlaying = () => {
    if (stats.lives <= 0) {
      setErrorMessage('Você está sem vidas! Compre extra-vidas no Pix ou Cartão na Loja.');
      playSound.click();
      return;
    }
    setErrorMessage(null);
    setGameOver(false);
    setVictory(false);
    setIsPlaying(true);
    playSound.click();
  };

  const triggerQuickReset = () => {
    setIsPlaying(false);
    setGameOver(false);
    setVictory(false);
    setScore(0);
    playSound.click();
  };

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-6">
      
      {/* Visual Title / Level stats row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 shadow-lg">
        <div className="text-left space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-400 font-mono uppercase bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40 font-bold">
              Estágio Atual: {stats.currentStage}
            </span>
            {stats.isVip && (
              <span className="text-[10px] text-amber-400 font-mono uppercase bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 font-bold">
                👑 MEMBRO VIP
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            {gameId === 'jumper' ? '👾 Super Mario Arcade 2D' : '⚡ Neon Portal Clicker'}
          </h2>
          <p className="text-xs text-slate-400">
            {gameId === 'jumper' 
              ? 'Pule em caixas de perguntas, derrote Goombas e escale o mastro dourado.' 
              : 'Clique nas esferas cósmicas para completar o desafio sob pressão.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onExit}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors border border-slate-750"
            id="btn-exit-game"
          >
            Voltar ao Lobby
          </button>
        </div>
      </div>

      {/* Main Container Layout: Left Column (Game), Right Column (Shop/Benefits & Live feed) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* GAME SCREEN COLUMN (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">

          {/* Custom Screen Controls Toolbar */}
          <div className="bg-slate-900/80 border border-slate-800/80 p-2.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md animate-fadeIn">
            <div className="flex items-center gap-1.5 text-slate-300 font-mono text-[11px] font-bold">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>AJUSTES DE TELA:</span>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {/* Normal screen / Full screen */}
              <button
                onClick={() => { setScreenMode('normal'); playSound.click(); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  screenMode === 'normal'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Minimize2 className="w-3 h-3" /> Normal
              </button>
              <button
                onClick={() => { setScreenMode('fullscreen'); playSound.click(); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  screenMode === 'fullscreen'
                    ? 'bg-emerald-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Maximize2 className="w-3 h-3" /> Tela Cheia
              </button>

              {/* Separator */}
              <span className="text-slate-700 font-mono hidden sm:inline">|</span>

              {/* Vertical / Horizontal Rotation */}
              <button
                onClick={() => { setIsVertical(false); playSound.click(); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  !isVertical
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <RotateCw className="w-3 h-3 rotate-90" /> Horizontal
              </button>
              <button
                onClick={() => { setIsVertical(true); playSound.click(); }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono transition-all flex items-center gap-1 cursor-pointer ${
                  isVertical
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <RotateCw className="w-3 h-3" /> Vertical
              </button>
            </div>
          </div>
          
          <div className={
            screenMode === 'fullscreen'
              ? "fixed inset-0 z-50 bg-slate-950/98 flex flex-col items-center justify-center p-4 md:p-8 animate-fadeIn overflow-y-auto"
              : "bg-slate-950 rounded-2xl border border-slate-800/90 shadow-2xl relative overflow-hidden flex flex-col items-center justify-center min-h-[400px] p-4"
          }>

            {screenMode === 'fullscreen' && (
              <button
                onClick={() => { setScreenMode('normal'); playSound.click(); }}
                className="absolute top-4 right-4 z-50 p-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl shadow-lg flex items-center gap-1.5 text-xs font-black transition-all cursor-pointer"
              >
                <Minimize2 className="w-4 h-4" /> Sair da Tela Cheia [Esc]
              </button>
            )}
            
            {/* Dark grid line scans overlay */}
            <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-5 z-20" />

            {errorMessage && (
              <div className="absolute z-30 inset-x-4 top-4 p-3 bg-red-950/95 text-red-200 rounded-xl text-xs border border-red-800/60 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4.5 h-4.5 text-red-400 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button
                  onClick={() => {
                    setErrorMessage(null);
                    openShop();
                  }}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[10px] rounded-lg transition-all cursor-pointer shrink-0"
                >
                  Ir para Loja
                </button>
              </div>
            )}

            {/* A: LOBBY RECRUIT STATE */}
            {!isPlaying && !gameOver && !victory && (
              <div className="text-center space-y-6 py-8 relative z-10 animate-fadeIn w-full max-w-md">
                
                {/* Visual Header Mascot */}
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-slate-900 border border-slate-850 rounded-2xl text-4xl shadow-xl">
                  <Sparkles className="w-5 h-5 text-yellow-400 absolute -top-1.5 -right-1.5 animate-pulse" />
                  {gameId === 'jumper' ? '🍄' : '🎯'}
                </div>

                <div className="space-y-2">
                  <h3 className="text-lg font-extrabold text-white">
                    {gameId === 'jumper' ? 'Super Mario 2D Pixel Adventure' : 'Neon Bubble Collector'}
                  </h3>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {gameId === 'jumper'
                      ? 'Navegue usando as teclas [A / D] ou setas esquerda/direita, e pule usando a [Barra de Espaço] ou o controle touch na tela. Chegue à bandeira para triunfar!'
                      : `Atingir a quota alvo de ${targetClickerQuota} pontos coletando bolhas em menos de 15 segundos!`}
                  </p>
                </div>

                {/* Displaying User Perks (Monetization advantages shown clearly) */}
                {gameId === 'jumper' && (
                  <div className="bg-slate-900/80 border border-slate-800/80 p-3 rounded-xl text-left space-y-2.5">
                    <h4 className="text-[10px] text-cyan-400 font-mono uppercase font-bold tracking-wider">
                      Seus Itens de Vantagem Ativos:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <ChevronUp className={`w-3.5 h-3.5 ${hasDoubleJump ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>Pulo Duplo: <strong>{hasDoubleJump ? 'ATIVADO' : 'Inativo'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Shield className={`w-3.5 h-3.5 ${hasShieldArmor ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>Corações Extras: <strong>{hasShieldArmor ? '+3 Corações' : 'Inativo'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Coins className={`w-3.5 h-3.5 ${hasCoinMagnet ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>Ímã de Ouro: <strong>{hasCoinMagnet ? 'ATIVADO' : 'Inativo'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Zap className={`w-3.5 h-3.5 ${hasSpeedBoost ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span>Velocidade 135%: <strong>{hasSpeedBoost ? 'ATIVADO' : 'Inativo'}</strong></span>
                      </div>
                    </div>
                    <p className="text-[9px] text-slate-500 leading-normal border-t border-slate-850 pt-2">
                      💡 <em>Dica: Use peles premium ou coroa imperial para desbloquear o íman, vidas extras e pulo duplo na Loja Segura!</em>
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400 font-mono bg-slate-900/50 px-4 py-2 rounded-xl border border-slate-850">
                  <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-red-500" /> {stats.lives} Vidas</span>
                  <span>•</span>
                  <span>Estágio {stats.currentStage}</span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                  <button
                    onClick={startPlaying}
                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm rounded-xl transition-all cursor-pointer shadow-lg hover:scale-102"
                    id="btn-start-game"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Iniciar Jogo (❤️ 1 Vida)
                  </button>
                </div>

              </div>
            )}

            {/* B: PLATFORMER MARIO GAMEPLAY */}
            {gameId === 'jumper' && isPlaying && !gameOver && !victory && (
              <div className="w-full flex flex-col items-center">
                
                {/* Level HUD metrics */}
                <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono mb-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-yellow-400 font-bold">
                      🪙 {coinsCollected}
                    </span>
                    <span className="flex items-center gap-1 text-rose-400 font-bold">
                      👾 Squish: {enemiesKilled}
                    </span>
                  </div>

                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">
                    Estágio {stats.currentStage}
                  </span>
                </div>

                {/* Scaled & Rotatable Canvas Container */}
                <div className={`w-full transition-all duration-300 flex justify-center items-center my-1.5 ${
                  isVertical 
                    ? 'rotate-90 scale-75 md:scale-90 my-12 md:my-16' 
                    : 'rotate-0 scale-100'
                }`}>
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={240}
                    className="bg-slate-900 border-2 border-slate-800/80 rounded-xl w-full aspect-[25/10] shadow-inner"
                  />
                </div>

                {/* Touch controls for Mobile on-screen playing */}
                <div className="w-full grid grid-cols-3 gap-2 mt-4 max-w-sm select-none">
                  
                  {/* Left Controls */}
                  <div className="flex gap-2 justify-start">
                    <button
                      onTouchStart={() => { keysPressedRef.current.left = true; }}
                      onTouchEnd={() => { keysPressedRef.current.left = false; }}
                      onMouseDown={() => { keysPressedRef.current.left = true; }}
                      onMouseUp={() => { keysPressedRef.current.left = false; }}
                      onMouseLeave={() => { keysPressedRef.current.left = false; }}
                      style={{ touchAction: 'none' }}
                      className="w-14 h-14 bg-slate-800 hover:bg-slate-700 text-slate-200 active:bg-cyan-600 active:text-white rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer transition-all border border-slate-700 shadow-md"
                    >
                      <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                      onTouchStart={() => { keysPressedRef.current.right = true; }}
                      onTouchEnd={() => { keysPressedRef.current.right = false; }}
                      onMouseDown={() => { keysPressedRef.current.right = true; }}
                      onMouseUp={() => { keysPressedRef.current.right = false; }}
                      onMouseLeave={() => { keysPressedRef.current.right = false; }}
                      style={{ touchAction: 'none' }}
                      className="w-14 h-14 bg-slate-800 hover:bg-slate-700 text-slate-200 active:bg-cyan-600 active:text-white rounded-2xl flex items-center justify-center font-bold text-lg cursor-pointer transition-all border border-slate-700 shadow-md"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Centered touch instructions */}
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-[9px] text-slate-500 uppercase font-mono tracking-widest font-bold">Controles</span>
                    <span className="text-[8px] text-slate-600 uppercase font-mono">Touch / Teclas AD</span>
                  </div>

                  {/* Right Jump action button */}
                  <div className="flex justify-end">
                    <button
                      onTouchStart={() => { keysPressedRef.current.up = true; }}
                      onTouchEnd={() => { keysPressedRef.current.up = false; }}
                      onMouseDown={() => { keysPressedRef.current.up = true; }}
                      onMouseUp={() => { keysPressedRef.current.up = false; }}
                      onMouseLeave={() => { keysPressedRef.current.up = false; }}
                      onClick={triggerOnScreenJump}
                      style={{ touchAction: 'none' }}
                      className="w-16 h-14 bg-gradient-to-br from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-2xl flex items-center justify-center font-bold text-base cursor-pointer shadow-lg active:scale-95 transition-all border border-cyan-500"
                    >
                      <ChevronUp className="w-7 h-7 stroke-[3px]" />
                    </button>
                  </div>

                </div>

              </div>
            )}

            {/* C: NEON CLICKER GAMEPLAY */}
            {gameId === 'clicker' && isPlaying && !gameOver && !victory && (
              <div className="w-full flex flex-col items-center select-none">
                
                <div className="w-full flex items-center justify-between text-xs text-slate-400 font-mono mb-3 bg-slate-900 px-4 py-2.5 rounded-xl border border-slate-800">
                  <span>Tempo: <strong className="text-red-400 font-mono text-sm">{clickerTimeLeft}s</strong></span>
                  <span>Quota: <strong className="text-cyan-400">{score}</strong> / {targetClickerQuota}</span>
                </div>

                <div className="w-full bg-slate-900 border border-slate-800 rounded-xl relative min-h-[240px] overflow-hidden">
                  {bubbles.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => handleBubbleClick(b.id, b.val)}
                      className="absolute rounded-full flex items-center justify-center font-black text-xs text-slate-950 shadow-lg cursor-pointer transform hover:scale-110 active:scale-95 transition-transform"
                      style={{
                        left: `${b.x}%`,
                        top: `${b.y}%`,
                        width: `${b.size}px`,
                        height: `${b.size}px`,
                        backgroundColor: b.color,
                        boxShadow: `0 0 15px ${b.color}`
                      }}
                    >
                      +{b.val}
                    </button>
                  ))}
                </div>

                <p className="text-[10px] text-slate-500 font-mono text-center mt-3 uppercase tracking-widest">
                  Estoure as bolhas fluorescentes rapidamente!
                </p>
              </div>
            )}

            {/* D: GAME OVER FAILURE STATE */}
            {gameOver && (
              <div className="text-center space-y-5 py-6 max-w-sm relative z-10 animate-scaleIn">
                <div className="w-14 h-14 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center text-red-400 text-3xl mx-auto shadow-inner">
                  💀
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">Fim de Jogo! (Falhou)</h3>
                  <p className="text-slate-400 text-xs">
                    {gameId === 'jumper'
                      ? 'Você perdeu todos os seus corações ou caiu no abismo!'
                      : `Você coletou ${score} pontos, mas não atingiu a meta de ${targetClickerQuota}!`
                    }
                  </p>
                </div>

                <div className="bg-slate-900/90 border border-slate-800/80 p-3.5 rounded-xl text-xs text-slate-400 space-y-2.5 text-left">
                  <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-800 pb-1.5">
                    <span>SEUS SKIPS DE ESTÁGIO:</span>
                    <span className="text-cyan-400 font-bold">{stageSkipsOwned} Unidades</span>
                  </div>
                  <button
                    onClick={handleStageSkipWithBooster}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-750 text-cyan-400 hover:text-cyan-300 font-bold border border-cyan-800/40 rounded transition-all cursor-pointer text-xs"
                  >
                    Pular Este Nível (Usar 1 Skip)
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={startPlaying}
                    className="flex-1 py-2.5 bg-slate-850 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-colors border border-slate-700"
                    id="btn-retry-game"
                  >
                    Tentar Novamente (❤️ 1)
                  </button>
                  <button
                    onClick={onExit}
                    className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-850 text-slate-400 font-medium text-xs rounded-xl cursor-pointer transition-colors"
                  >
                    Lobby
                  </button>
                </div>
              </div>
            )}

            {/* E: VICTORY SCREEN / REWARDS */}
            {victory && (
              <div className="text-center space-y-5 py-6 max-w-sm relative z-10 animate-scaleIn w-full">
                
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center text-emerald-400 text-3xl mx-auto shadow-inner animate-bounce">
                  👑
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-extrabold text-white">Nível {stats.currentStage - 1} Concluído!</h3>
                  <p className="text-slate-400 text-xs">
                    Você cruzou a linha de chegada e conquistou todas as missões!
                  </p>
                </div>

                {/* Mission checklist output */}
                <div className="bg-slate-900/90 border border-slate-800/80 p-3 rounded-xl text-left space-y-2">
                  <span className="text-[9px] text-slate-500 font-mono block uppercase">Status das Missões:</span>
                  {activeMissions.map((m) => (
                    <div key={m.id} className="flex items-center justify-between gap-2 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{m.text}</span>
                      </span>
                      <strong className="text-yellow-500 shrink-0">+🪙 {m.reward}</strong>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    triggerQuickReset();
                  }}
                  className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-sm rounded-xl cursor-pointer hover:from-emerald-400 hover:to-teal-400 transition-colors"
                  id="btn-next-stage"
                >
                  Jogar Próximo Estágio (Nível {stats.currentStage})
                </button>
              </div>
            )}

          </div>

          {/* Key layout tutorial instructions bar */}
          {gameId === 'jumper' && isPlaying && !gameOver && !victory && (
            <div className="bg-slate-900/40 p-3 rounded-xl border border-slate-850/60 text-[11px] text-slate-400 flex justify-between items-center font-mono">
              <span>⌨️ TECLADO: [A/D] andar • [Espaço] pular</span>
              <span>📱 TOQUE: setas na tela</span>
            </div>
          )}

        </div>

        {/* RIGHT COLUMN: BENEFITS / SHOP CORRELATION & MULTI-USER ACTIVITY FEED (4 Cols) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Shop advantages list */}
          <div className="bg-slate-900/70 rounded-2xl border border-slate-800/80 p-4 space-y-3 shadow-lg">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-cyan-400" />
              Upgrade Vantagens (Pix/Cartão)
            </h3>
            
            <p className="text-xs text-slate-400 leading-normal">
              Obtenha vantagens premium diretamente pela Loja Segura para vencer estágios difíceis de forma fácil:
            </p>

            <div className="space-y-2 pt-1.5">
              <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                <span className="text-xl">❤️</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-200">Mini/Mega Vidas Extras</h4>
                  <p className="text-[10px] text-slate-500">Nunca mais veja o Game Over. Vidas garantem ressurgimento infinito!</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                <span className="text-xl">⏩</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-200">Bypass / Pular Nível</h4>
                  <p className="text-[10px] text-slate-500">Fase super difícil? Use créditos de pulo e ganhe 100 moedas extras!</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                <span className="text-xl">👑</span>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-slate-200">Acessórios de Coração/Escudo</h4>
                  <p className="text-[10px] text-slate-500">Equipe a Coroa Imperial ou Elmo Viking para começar com 3 Corações!</p>
                </div>
              </div>
            </div>

            <button
              onClick={openShop}
              className="w-full mt-2 py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-black text-xs rounded-xl cursor-pointer transition-colors shadow-md"
            >
              Comprar Vantagens na Loja (R$ Pix)
            </button>
          </div>

          {/* Elegant Smaller Sponsored Ad banner in place of the chat feed */}
          <div className="space-y-2 text-left">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono font-bold block ml-1">Patrocinador de Suporte</span>
            <AdBanner size="small" />
          </div>

        </div>

      </div>

    </div>
  );
};
