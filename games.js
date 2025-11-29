// Mini Games Logic

// Game State
let currentGame = null;
let puzzleData = { word: '', meaning: '', timer: null, score: 0 };
let typefastData = { timer: null, score: 0, combo: 0, currentWord: null };
let memoryData = { cards: [], flipped: [], matched: [], moves: 0 };

// Start Game
function startGame(gameType) {
    document.querySelector('.games-menu').classList.add('hidden');
    
    if (gameType === 'puzzle') {
        document.getElementById('puzzle-game').classList.remove('hidden');
        initPuzzleGame();
    } else if (gameType === 'typefast') {
        document.getElementById('typefast-game').classList.remove('hidden');
        initTypeFastGame();
    } else if (gameType === 'memory') {
        document.getElementById('memory-game').classList.remove('hidden');
        initMemoryGame();
    }
    
    currentGame = gameType;
}

function backToGamesMenu() {
    // Hide all games
    document.getElementById('puzzle-game').classList.add('hidden');
    document.getElementById('typefast-game').classList.add('hidden');
    document.getElementById('memory-game').classList.add('hidden');
    
    // Show menu
    document.querySelector('.games-menu').classList.remove('hidden');
    
    // Clear timers
    if (puzzleData.timer) clearInterval(puzzleData.timer);
    if (typefastData.timer) clearInterval(typefastData.timer);
    
    currentGame = null;
}

// ===== WORD PUZZLE =====
function initPuzzleGame() {
    puzzleData.score = 0;
    document.getElementById('puzzle-score').innerText = '0';
    generatePuzzle();
}

function generatePuzzle() {
    if (words.length === 0) return;
    
    // Pick random word
    const randomWord = words[Math.floor(Math.random() * words.length)];
    puzzleData.word = randomWord.word.toUpperCase();
    puzzleData.meaning = randomWord.meaning;
    
    // Show meaning
    document.getElementById('puzzle-meaning').innerText = `Nghĩa: ${puzzleData.meaning}`;
    
    // Shuffle letters
    const letters = puzzleData.word.split('');
    const shuffled = letters.sort(() => Math.random() - 0.5);
    
    const lettersContainer = document.getElementById('shuffle-letters');
    lettersContainer.innerHTML = '';
    shuffled.forEach(letter => {
        const box = document.createElement('div');
        box.className = 'letter-box';
        box.innerText = letter;
        lettersContainer.appendChild(box);
    });
    
    // Clear input
    document.getElementById('puzzle-input').value = '';
    document.getElementById('puzzle-feedback').classList.add('hidden');
    
    // Start timer
    let timeLeft = 30;
    document.getElementById('puzzle-timer').innerText = timeLeft;
    
    if (puzzleData.timer) clearInterval(puzzleData.timer);
    puzzleData.timer = setInterval(() => {
        timeLeft--;
        document.getElementById('puzzle-timer').innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(puzzleData.timer);
            checkPuzzle();
        }
    }, 1000);
}

function checkPuzzle() {
    const input = document.getElementById('puzzle-input').value.trim().toUpperCase();
    const feedback = document.getElementById('puzzle-feedback');
    
    if (input === puzzleData.word) {
        feedback.innerText = `Chính xác! 🎉 Từ đúng là: ${puzzleData.word}`;
        feedback.className = 'feedback correct';
        puzzleData.score += 10;
        document.getElementById('puzzle-score').innerText = puzzleData.score;
        
        addXP(10);
        
        setTimeout(() => {
            generatePuzzle();
        }, 2000);
    } else {
        feedback.innerText = `Sai rồi! Đáp án đúng là: ${puzzleData.word}`;
        feedback.className = 'feedback wrong';
        
        setTimeout(() => {
            generatePuzzle();
        }, 2000);
    }
    
    feedback.classList.remove('hidden');
    clearInterval(puzzleData.timer);
}

// ===== TYPE FAST =====
function initTypeFastGame() {
    typefastData.score = 0;
    typefastData.combo = 0;
    document.getElementById('typefast-score').innerText = '0';
    document.getElementById('typefast-combo').innerText = '0';
    
    generateTypeFastWord();
    
    // Timer
    let timeLeft = 60;
    document.getElementById('typefast-timer').innerText = timeLeft;
    
    if (typefastData.timer) clearInterval(typefastData.timer);
    typefastData.timer = setInterval(() => {
        timeLeft--;
        document.getElementById('typefast-timer').innerText = timeLeft;
        
        if (timeLeft <= 0) {
            clearInterval(typefastData.timer);
            alert(`Game Over! Điểm của bạn: ${typefastData.score}`);
            backToGamesMenu();
        }
    }, 1000);
    
    // Input handler
    const input = document.getElementById('typefast-input');
    input.value = '';
    input.onkeyup = checkTypeFast;
}

function generateTypeFastWord() {
    if (words.length === 0) return;
    
    const randomWord = words[Math.floor(Math.random() * words.length)];
    typefastData.currentWord = randomWord.word;
    
    // Setup audio button
    const audioBtn = document.getElementById('typefast-audio');
    audioBtn.onclick = () => {
        speak(typefastData.currentWord);
        audioBtn.classList.add('playing');
        setTimeout(() => audioBtn.classList.remove('playing'), 1000);
    };
    
    // Auto play first time
    speak(typefastData.currentWord);
}

function checkTypeFast() {
    const input = document.getElementById('typefast-input');
    const feedback = document.getElementById('typefast-feedback');
    
    if (input.value.trim().toLowerCase() === typefastData.currentWord.toLowerCase()) {
        feedback.innerText = '✅ Chính xác!';
        feedback.className = 'feedback correct';
        feedback.classList.remove('hidden');
        
        typefastData.score += 10 + (typefastData.combo * 2);
        typefastData.combo++;
        
        document.getElementById('typefast-score').innerText = typefastData.score;
        document.getElementById('typefast-combo').innerText = typefastData.combo;
        
        addXP(10);
        
        setTimeout(() => {
            input.value = '';
            feedback.classList.add('hidden');
            generateTypeFastWord();
        }, 500);
    }
}

// ===== MEMORY MATCH =====
function initMemoryGame() {
    memoryData.matched = [];
    memoryData.flipped = [];
    memoryData.moves = 0;
    
    document.getElementById('memory-pairs').innerText = '0';
    document.getElementById('memory-moves').innerText = '0';
    
    // Pick 6 random words
    const selectedWords = [];
    while (selectedWords.length < 6 && words.length > 0) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        if (!selectedWords.find(w => w.word === randomWord.word)) {
            selectedWords.push(randomWord);
        }
    }
    
    // Create card pairs (word + meaning)
    const cards = [];
    selectedWords.forEach((word, idx) => {
        cards.push({ id: `word-${idx}`, content: word.word, pair: idx, type: 'word' });
        cards.push({ id: `meaning-${idx}`, content: word.meaning, pair: idx, type: 'meaning' });
    });
    
    // Shuffle
    memoryData.cards = cards.sort(() => Math.random() - 0.5);
    
    // Render
    const grid = document.getElementById('memory-grid');
    grid.innerHTML = '';
    memoryData.cards.forEach(card => {
        const cardEl = document.createElement('div');
        cardEl.className = 'memory-card';
        cardEl.dataset.id = card.id;
        cardEl.dataset.pair = card.pair;
        
        cardEl.innerHTML = `
            <div class="memory-card-front">?</div>
            <div class="memory-card-back">${card.content}</div>
        `;
        
        cardEl.onclick = () => flipMemoryCard(cardEl, card);
        grid.appendChild(cardEl);
    });
}

function flipMemoryCard(cardEl, card) {
    // Prevent flipping if already matched or too many flipped
    if (memoryData.matched.includes(card.pair) || memoryData.flipped.length >= 2) {
        return;
    }
    
    // Prevent flipping same card twice
    if (memoryData.flipped.find(f => f.id === card.id)) {
        return;
    }
    
    cardEl.classList.add('flipped');
    memoryData.flipped.push(card);
    
    if (memoryData.flipped.length === 2) {
        memoryData.moves++;
        document.getElementById('memory-moves').innerText = memoryData.moves;
        
        const [card1, card2] = memoryData.flipped;
        
        if (card1.pair === card2.pair) {
            // Match!
            memoryData.matched.push(card1.pair);
            document.getElementById('memory-pairs').innerText = memoryData.matched.length;
            
            setTimeout(() => {
                document.querySelectorAll(`[data-pair="${card1.pair}"]`).forEach(el => {
                    el.classList.add('matched');
                });
            }, 300);
            
            addXP(15);
            
            if (memoryData.matched.length === 6) {
                setTimeout(() => {
                    alert(`🎉 Chúc mừng! Bạn hoàn thành trong ${memoryData.moves} lượt!`);
                    backToGamesMenu();
                }, 1000);
            }
            
            memoryData.flipped = [];
        } else {
            // No match - flip back
            setTimeout(() => {
                document.querySelector(`[data-id="${card1.id}"]`).classList.remove('flipped');
                document.querySelector(`[data-id="${card2.id}"]`).classList.remove('flipped');
                memoryData.flipped = [];
            }, 1000);
        }
    }
}
