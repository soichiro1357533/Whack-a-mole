// ゲーム状態
const gameState = {
    score: 0,
    level: 1,
    timeLeft: 30,
    lives: 3,
    mode: 'normal', // 'normal' or 'endless'
    isPlaying: false,
    isPaused: false,
    currentMole: null,
    gameTimer: null,
    moleTimer: null
};

// レベル設計（10匹=100点ごとにレベルアップ）
const levels = [
    { level: 1, requiredScore: 0, spawnInterval: 1000, moleDisplayTime: 800 },
    { level: 2, requiredScore: 100, spawnInterval: 900, moleDisplayTime: 750 },
    { level: 3, requiredScore: 200, spawnInterval: 800, moleDisplayTime: 700 },
    { level: 4, requiredScore: 300, spawnInterval: 700, moleDisplayTime: 650 },
    { level: 5, requiredScore: 400, spawnInterval: 600, moleDisplayTime: 600 },
    { level: 6, requiredScore: 500, spawnInterval: 550, moleDisplayTime: 550 },
    { level: 7, requiredScore: 600, spawnInterval: 500, moleDisplayTime: 500 },
    { level: 8, requiredScore: 700, spawnInterval: 450, moleDisplayTime: 450 },
    { level: 9, requiredScore: 800, spawnInterval: 400, moleDisplayTime: 400 },
    { level: 10, requiredScore: 900, spawnInterval: 350, moleDisplayTime: 350 }
];

// DOM要素
const homeScreen = document.getElementById('homeScreen');
const gameContainer = document.getElementById('gameContainer');
const normalModeBtn = document.getElementById('normalModeBtn');
const endlessModeBtn = document.getElementById('endlessModeBtn');
const scoreDisplay = document.getElementById('score');
const timerItem = document.getElementById('timerItem');
const livesItem = document.getElementById('livesItem');
const livesDisplay = document.getElementById('lives');
const levelDisplay = document.getElementById('level');
const timerDisplay = document.getElementById('timer');
const pauseBtn = document.getElementById('pauseBtn');
const gameBoard = document.getElementById('gameBoard');
const pauseModal = document.getElementById('pauseModal');
const resumeBtn = document.getElementById('resumeBtn');
const pauseHomeBtn = document.getElementById('pauseHomeBtn');
const gameOverModal = document.getElementById('gameOverModal');
const finalScoreDisplay = document.getElementById('finalScore');
const finalLevelDisplay = document.getElementById('finalLevel');
const restartBtn = document.getElementById('restartBtn');
const homeBtn = document.getElementById('homeBtn');
const holes = document.querySelectorAll('.hole');
const moles = document.querySelectorAll('.mole');
const hammer = document.getElementById('hammer');
const countdown = document.getElementById('countdown');

// サウンドシステム（Web Audio API）
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.initialized = false;
    }

    init() {
        if (this.initialized) return;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.initialized = true;
        } catch (e) {
            console.log('Web Audio API not supported');
        }
    }

    playTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
    }

    playHit() {
        this.playTone(800, 0.1, 'square', 0.2);
        setTimeout(() => this.playTone(1000, 0.1, 'square', 0.15), 50);
    }

    playMiss() {
        this.playTone(200, 0.2, 'sawtooth', 0.1);
    }

    playLevelUp() {
        this.playTone(523, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(659, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(784, 0.15, 'sine', 0.2), 200);
    }

    playGameOver() {
        this.playTone(392, 0.3, 'sine', 0.2);
        setTimeout(() => this.playTone(330, 0.3, 'sine', 0.2), 300);
        setTimeout(() => this.playTone(262, 0.5, 'sine', 0.2), 600);
    }

    playStart() {
        this.playTone(262, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(330, 0.1, 'sine', 0.2), 100);
        setTimeout(() => this.playTone(392, 0.15, 'sine', 0.2), 200);
    }
    
    playTimeUp() {
        this.playTone(1200, 0.1, 'triangle', 0.2);
        setTimeout(() => this.playTone(1500, 0.2, 'sine', 0.2), 100);
    }
    
    playHeal() {
        this.playTone(400, 0.1, 'sine', 0.2);
        setTimeout(() => this.playTone(600, 0.2, 'sine', 0.2), 100);
    }
}

const soundManager = new SoundManager();

// カウントダウン
function startCountdown(mode) {
    gameState.mode = mode;
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';

    // モードに応じて表示切替
    if (mode === 'endless') {
        timerItem.style.display = 'none';
        livesItem.style.display = 'flex';
    } else {
        timerItem.style.display = 'flex';
        livesItem.style.display = 'none';
    }

    let count = 3;
    countdown.textContent = count;
    countdown.classList.add('show');

    const countInterval = setInterval(() => {
        count--;
        if (count > 0) {
            countdown.textContent = count;
            countdown.classList.remove('show');
            setTimeout(() => countdown.classList.add('show'), 50);
        } else {
            clearInterval(countInterval);
            countdown.classList.remove('show');
            startGame();
        }
    }, 1000);
}

// ホーム画面に戻る
function showHome() {
    gameState.isPlaying = false;
    gameState.isPaused = false;
    clearInterval(gameState.gameTimer);
    clearTimeout(gameState.moleTimer);
    hideMole();
    hammer.classList.remove('active');
    document.body.classList.remove('playing');
    pauseModal.classList.remove('show');
    gameOverModal.classList.remove('show');
    gameContainer.style.display = 'none';
    homeScreen.style.display = 'flex';
}

// ゲーム開始
function startGame() {
    soundManager.init();
    soundManager.playStart();

    // 状態リセット
    gameState.score = 0;
    gameState.level = 1;
    gameState.timeLeft = 30;
    gameState.lives = 3;
    gameState.isPlaying = true;
    gameState.isPaused = false;

    // 表示更新
    updateDisplay();

    // ハンマー表示
    hammer.classList.add('active');
    document.body.classList.add('playing');

    // ノーマルモードのみタイマー開始
    if (gameState.mode === 'normal') {
        startGameTimer();
    }

    // モグラ出現開始
    spawnMole();
}

// ゲームタイマー
function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        gameState.timeLeft--;
        timerDisplay.textContent = gameState.timeLeft;

        if (gameState.timeLeft <= 0) {
            endGame();
        }
    }, 1000);
}

// モグラ画像リスト
const moleImages = ['a.png', 'b.png', 'c.png'];

// モグラ出現
function spawnMole() {
    if (!gameState.isPlaying) return;

    // 前のモグラを隠す
    hideMole();

    // ランダムな穴を選択
    const randomHole = Math.floor(Math.random() * 9);
    const mole = moles[randomHole];
    
    gameState.currentMole = randomHole;

    // アイテム出現判定 (10%の確率)
    const isItem = Math.random() < 0.02;
    let itemType = null;
    
    if (isItem) {
        if (gameState.mode === 'normal') {
            itemType = 'clock'; // ノーマルなら時計
        } else {
            itemType = 'heart'; // エンドレスならハート
        }
    }

    if (itemType) {
        mole.classList.add(itemType);
        mole.dataset.type = itemType;
    } else {
        // 通常のモグラ
        const randomImage = moleImages[Math.floor(Math.random() * moleImages.length)];
        mole.style.backgroundImage = `url('${randomImage}')`;
        mole.dataset.type = 'mole';
    }

    mole.classList.add('up');

    // 現在のレベル設定を取得
    const currentLevel = levels.find(l => l.level === gameState.level) || levels[0];

    // モグラを隠すタイマー
    setTimeout(() => {
        if (mole.classList.contains('up') && !mole.classList.contains('hit')) {
            mole.classList.remove('up', 'clock', 'heart');
            mole.style.backgroundImage = ''; // 画像リセット
            
            // エンドレスモードでミス (アイテムは見逃してもOK)
            if (gameState.mode === 'endless' && gameState.isPlaying && mole.dataset.type === 'mole') {
                gameState.lives--;
                soundManager.playMiss();
                updateDisplay();
                if (gameState.lives <= 0) {
                    endGame();
                }
            }
        }
    }, currentLevel.moleDisplayTime);

    // 次のモグラ出現
    gameState.moleTimer = setTimeout(() => {
        spawnMole();
    }, currentLevel.spawnInterval);
}

// モグラを隠す
function hideMole() {
    moles.forEach(mole => {
        mole.classList.remove('up', 'hit', 'clock', 'heart');
        mole.style.backgroundImage = ''; // 画像リセット
        mole.dataset.type = '';
    });
    gameState.currentMole = null;
}

// スコアポップアップ表示
function showScorePopup(rect, text) {
    const popup = document.createElement('div');
    popup.classList.add('score-popup');
    popup.textContent = text;
    
    // 穴の中央付近に配置
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    popup.style.left = `${x}px`;
    popup.style.top = `${y}px`;
    popup.style.transform = 'translate(-50%, -50%)';
    
    document.body.appendChild(popup);
    
    // アニメーション終了後に削除
    setTimeout(() => {
        popup.remove();
    }, 800);
}

// 穴クリック処理
function handleHoleClick(e) {
    if (!gameState.isPlaying) return;

    const hole = e.currentTarget;
    const mole = hole.querySelector('.mole');
    const type = mole.dataset.type;

    if (mole.classList.contains('up') && !mole.classList.contains('hit')) {
        const rect = hole.getBoundingClientRect();
        
        if (type === 'clock') {
            // 時計アイテム
            mole.classList.add('hit');
            gameState.timeLeft += 5;
            timerDisplay.textContent = gameState.timeLeft;
            soundManager.playTimeUp();
            showScorePopup(rect, "+5 Sec");
            
        } else if (type === 'heart') {
            // ハートアイテム
            mole.classList.add('hit');
            gameState.lives++;
            updateDisplay();
            soundManager.playHeal();
            showScorePopup(rect, "+1 Life");
            
        } else {
            // 通常モグラ
            mole.classList.add('hit');
            gameState.score += 10;
            soundManager.playHit();
            showScorePopup(rect, "+10");
            
            // レベルチェック
            checkLevelUp();
        }

        // 表示更新
        updateDisplay();

        // モグラを隠す
        setTimeout(() => {
            mole.classList.remove('up', 'hit', 'clock', 'heart');
            mole.style.backgroundImage = '';
        }, 200);
    } else if (!mole.classList.contains('up')) {
        // ミス
        soundManager.playMiss();
    }
}

// レベルアップチェック
function checkLevelUp() {
    const nextLevel = levels.find(l => l.level === gameState.level + 1);

    if (nextLevel && gameState.score >= nextLevel.requiredScore) {
        gameState.level = nextLevel.level;
        soundManager.playLevelUp();

        // レベルアップアニメーション
        levelDisplay.classList.add('level-up');
        setTimeout(() => {
            levelDisplay.classList.remove('level-up');
        }, 500);
    }
}

// 表示更新
function updateDisplay() {
    scoreDisplay.textContent = gameState.score;
    levelDisplay.textContent = gameState.level;
    timerDisplay.textContent = gameState.timeLeft;
    livesDisplay.textContent = '❤'.repeat(gameState.lives);
}

// ゲーム終了
function endGame() {
    gameState.isPlaying = false;

    // タイマー停止
    clearInterval(gameState.gameTimer);
    clearTimeout(gameState.moleTimer);

    // モグラを隠す
    hideMole();

    // ハンマー非表示
    hammer.classList.remove('active');
    document.body.classList.remove('playing');

    // サウンド再生
    soundManager.playGameOver();

    // モーダル表示
    finalScoreDisplay.textContent = gameState.score;
    finalLevelDisplay.textContent = gameState.level;
    gameOverModal.classList.add('show');
}

// ポーズ
function pauseGame() {
    if (!gameState.isPlaying || gameState.isPaused) return;
    gameState.isPaused = true;
    clearInterval(gameState.gameTimer);
    clearTimeout(gameState.moleTimer);
    hammer.classList.remove('active');
    document.body.classList.remove('playing');
    pauseModal.classList.add('show');
}

// 再開
function resumeGame() {
    if (!gameState.isPaused) return;
    gameState.isPaused = false;
    pauseModal.classList.remove('show');
    hammer.classList.add('active');
    document.body.classList.add('playing');
    if (gameState.mode === 'normal') {
        startGameTimer();
    }
    spawnMole();
}

// リスタート
function restartGame() {
    gameOverModal.classList.remove('show');
    startGame();
}

// イベントリスナー
normalModeBtn.addEventListener('click', () => startCountdown('normal'));
endlessModeBtn.addEventListener('click', () => startCountdown('endless'));
pauseBtn.addEventListener('click', pauseGame);
resumeBtn.addEventListener('click', resumeGame);
pauseHomeBtn.addEventListener('click', showHome);
restartBtn.addEventListener('click', restartGame);
homeBtn.addEventListener('click', showHome);

holes.forEach(hole => {
    hole.addEventListener('click', handleHoleClick);
});

// ハンマー追従
document.addEventListener('mousemove', (e) => {
    if (hammer.classList.contains('active')) {
        hammer.style.left = e.clientX + 'px';
        hammer.style.top = e.clientY + 'px';
    }
});

// ハンマー振り下ろし
gameBoard.addEventListener('mousedown', () => {
    if (gameState.isPlaying) {
        hammer.classList.add('swing');
    }
});

document.addEventListener('mouseup', () => {
    hammer.classList.remove('swing');
});

// 初期表示
updateDisplay();