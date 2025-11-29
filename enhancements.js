// Enhanced Features

// Flashcard enhancements
let autoplayInterval = null;
let isAutoplayActive = false;
let quizMode = 'normal'; // normal, hard, review

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    const activeTab = document.querySelector('.tab-content.active');
    
    // Flashcard navigation
    if (activeTab && activeTab.id === 'flashcard') {
        if (e.key === 'ArrowLeft') {
            document.getElementById('prev-btn').click();
        } else if (e.key === 'ArrowRight') {
            document.getElementById('next-btn').click();
        } else if (e.key === ' ') {
            e.preventDefault();
            document.getElementById('flip-btn').click();
        }
    }
});

// Shuffle flashcards
document.getElementById('shuffle-btn')?.addEventListener('click', () => {
    if (words.length < 2) return;
    
    // Fisher-Yates shuffle
    for (let i = words.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [words[i], words[j]] = [words[j], words[i]];
    }
    
    currentIndex = 0;
    updateFlashcard();
    
    const btn = document.getElementById('shuffle-btn');
    btn.classList.add('active');
    setTimeout(() => btn.classList.remove('active'), 1000);
});

// Auto-play flashcards
document.getElementById('autoplay-btn')?.addEventListener('click', () => {
    const btn = document.getElementById('autoplay-btn');
    
    if (isAutoplayActive) {
        clearInterval(autoplayInterval);
        isAutoplayActive = false;
        btn.innerHTML = '<i class="fa-solid fa-play"></i> Tự động';
        btn.classList.remove('active');
    } else {
        isAutoplayActive = true;
        btn.innerHTML = '<i class="fa-solid fa-pause"></i> Dừng';
        btn.classList.add('active');
        
        autoplayInterval = setInterval(() => {
            if (currentIndex < words.length - 1) {
                currentIndex++;
            } else {
                currentIndex = 0;
            }
            flashcard.classList.remove('flipped');
            setTimeout(updateFlashcard, 300);
        }, 3000); // 3 seconds per card
    }
});

// Quiz Mode Selector
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        quizMode = btn.dataset.mode;
        if (typeof generateQuestionEnhanced === 'function') {
            generateQuestionEnhanced();
        }
    });
});

// Enhanced generateQuestion with modes
function generateQuestionEnhanced() {
    if (quizMode === 'review') {
        // Only use words with mistakes
        const mistakeWords = Object.keys(mistakes)
            .filter(word => mistakes[word] >= 2)
            .map(word => words.find(w => w.word === word))
            .filter(w => w);
        
        if (mistakeWords.length < 4) {
            alert('Chưa có đủ từ sai để ôn tập. Hãy làm Quiz thường trước!');
            document.querySelector('[data-mode="normal"]')?.click();
            return;
        }
        
        // Use mistake words
        const targetWord = mistakeWords[Math.floor(Math.random() * mistakeWords.length)];
        currentQuizAnswer = targetWord.meaning;
        quizWord.innerText = targetWord.word;
        
        const options = new Set([targetWord.meaning]);
        while (options.size < 4) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            if (randomWord.meaning !== targetWord.meaning) {
                options.add(randomWord.meaning);
            }
        }
        
        quizOptions.innerHTML = '';
        Array.from(options)
            .sort(() => Math.random() - 0.5)
            .forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = option;
                btn.onclick = () => checkAnswer(btn, option);
                quizOptions.appendChild(btn);
            });
            
        quizFeedback.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
        
    } else if (quizMode === 'hard') {
        // Hard mode: Reverse - show meaning, find word
        const dueWords = getDueWords();
        let targetWord;
        
        if (dueWords.length > 0) {
            targetWord = dueWords[Math.floor(Math.random() * dueWords.length)];
        } else {
            targetWord = words[Math.floor(Math.random() * words.length)];
        }
        
        currentQuizAnswer = targetWord.word;
        quizWord.innerText = targetWord.meaning;
        document.getElementById('quiz-question').innerText = 'Từ tiếng Anh nào có nghĩa này?';
        
        const options = new Set([targetWord.word]);
        while (options.size < 4) {
            const randomWord = words[Math.floor(Math.random() * words.length)];
            if (randomWord.word !== targetWord.word) {
                options.add(randomWord.word);
            }
        }
        
        quizOptions.innerHTML = '';
        Array.from(options)
            .sort(() => Math.random() - 0.5)
            .forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = option;
                btn.onclick = () => checkAnswer(btn, option);
                quizOptions.appendChild(btn);
            });
            
        quizFeedback.classList.add('hidden');
        nextQuestionBtn.classList.add('hidden');
    } else {
        // Normal mode - call original if exists
        document.getElementById('quiz-question').innerText = 'Từ này nghĩa là gì?';
        if (typeof window.originalGenerateQuestion === 'function') {
            window.originalGenerateQuestion();
        } else if (typeof generateQuestion === 'function') {
            generateQuestion();
        }
    }
}

// Override generateQuestion if not already
if (typeof generateQuestion !== 'undefined') {
    window.originalGenerateQuestion = generateQuestion;
    generateQuestion = generateQuestionEnhanced;
}

// Export Progress
function exportProgress() {
    const data = {
        learnedWords: [...learnedWords],
        favorites: [...favorites],
        srsData: srsData,
        score: score,
        mistakes: mistakes,
        streak: streak,
        lastStudyDate: lastStudyDate,
        level: level,
        xp: xp,
        badges: badges,
        exportDate: new Date().toISOString()
    };
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `english-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    alert('✅ Đã xuất dữ liệu thành công!');
}

// Import Progress
function importProgress(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            // Restore data
            learnedWords = new Set(data.learnedWords || []);
            favorites = new Set(data.favorites || []);
            srsData = data.srsData || {};
            score = data.score || 0;
            mistakes = data.mistakes || {};
            streak = data.streak || 0;
            lastStudyDate = data.lastStudyDate || null;
            level = data.level || 1;
            xp = data.xp || 0;
            badges = data.badges || {
                firstSteps: false,
                week1: false,
                perfectScore: false,
                master100: false,
                speedster: false,
                persistent: false
            };
            
            saveProgress();
            
            // Update UI
            scoreEl.innerText = score;
            typingScoreEl.innerText = score;
            updateDueCount();
            updateFlashcard();
            
            alert('✅ Đã nhập dữ liệu thành công!');
            
            // Refresh progress tab if open
            if (document.getElementById('progress').classList.contains('active')) {
                updateProgressTab();
            }
        } catch (error) {
            alert('❌ Lỗi: File không hợp lệ!');
            console.error(error);
        }
    };
    
    reader.readAsText(file);
}

// Reset Progress
function resetProgress() {
    if (!confirm('⚠️ Bạn có chắc muốn xóa toàn bộ tiến độ? Hành động này không thể hoàn tác!')) {
        return;
    }
    
    if (!confirm('🔴 XÁC NHẬN LẦN CUỐI: Tất cả dữ liệu sẽ bị XÓA!')) {
        return;
    }
    
    // Clear all data
    localStorage.clear();
    
    // Reset variables
    learnedWords = new Set();
    favorites = new Set();
    srsData = {};
    score = 0;
    streak = 0;
    mistakes = {};
    lastStudyDate = null;
    level = 1;
    xp = 0;
    badges = {
        firstSteps: false,
        week1: false,
        perfectScore: false,
        master100: false,
        speedster: false,
        persistent: false
    };
    
    // Update UI
    scoreEl.innerText = 0;
    typingScoreEl.innerText = 0;
    streakEl.innerText = 0;
    currentIndex = 0;
    updateFlashcard();
    updateDueCount();
    
    alert('✅ Đã xóa toàn bộ tiến độ!');
    location.reload();
}
