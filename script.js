// ゲーム状態
const gameState = {
    score: 0,
    level: 1,
    timeLeft: 30,
    isPlaying: false,
    isPaused: false,
    currentMole: null,
    gameTimer: null,
    moleTimer: null
};

// レベル設計
const levels = [
    { level: 1, requiredScore: 0, spawnInterval: 1000, moleDisplayTime: 800 },
    { level: 2, requiredScore: 50, spawnInterval: 800, moleDisplayTime: 700 },
    { level: 3, requiredScore: 100, spawnInterval: 600, moleDisplayTime: 600 },
    { level: 4, requiredScore: 200, spawnInterval: 500, moleDisplayTime: 500 },
    { level: 5, requiredScore: 350, spawnInterval: 400, moleDisplayTime: 400 }
];

// DOM要素
const homeScreen = document.getElementById('homeScreen');
const gameContainer = document.getElementById('gameContainer');
const homeStartBtn = document.getElementById('homeStartBtn');
const scoreDisplay = document.getElementById('score');
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
}

const soundManager = new SoundManager();

// ホーム画面からゲーム開始
function showGame() {
    homeScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    startGame();
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
    gameState.isPlaying = true;
    gameState.isPaused = false;

    // 表示更新
    updateDisplay();

    // ハンマー表示
    hammer.classList.add('active');
    document.body.classList.add('playing');

    // タイマー開始
    startGameTimer();

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

    // ランダムな画像を選択
    const randomImage = moleImages[Math.floor(Math.random() * moleImages.length)];
    mole.style.backgroundImage = `url('${randomImage}')`;

    gameState.currentMole = randomHole;
    mole.classList.add('up');

    // 現在のレベル設定を取得
    const currentLevel = levels.find(l => l.level === gameState.level) || levels[0];

    // モグラを隠すタイマー
    setTimeout(() => {
        if (mole.classList.contains('up') && !mole.classList.contains('hit')) {
            mole.classList.remove('up');
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
        mole.classList.remove('up', 'hit');
    });
    gameState.currentMole = null;
}

// 穴クリック処理
function handleHoleClick(e) {
    if (!gameState.isPlaying) return;

    const hole = e.currentTarget;
    const holeIndex = parseInt(hole.dataset.hole);
    const mole = hole.querySelector('.mole');

    if (mole.classList.contains('up') && !mole.classList.contains('hit')) {
        // ヒット！
        mole.classList.add('hit');
        gameState.score += 10;
        soundManager.playHit();

        // レベルチェック
        checkLevelUp();

        // 表示更新
        updateDisplay();

        // モグラを隠す
        setTimeout(() => {
            mole.classList.remove('up', 'hit');
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
    startGameTimer();
    spawnMole();
}

// リスタート
function restartGame() {
    gameOverModal.classList.remove('show');
    startGame();
}

// イベントリスナー
homeStartBtn.addEventListener('click', showGame);
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
