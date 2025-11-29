let words = [];
let currentIndex = 0;
let score = 0;
let learnedWords = new Set();
let favorites = new Set();
let srsData = {}; // { word: { level: 0, nextReview: timestamp } }


// SRS Intervals (in minutes)
const SRS_INTERVALS = [0, 10, 60, 300, 1440, 4320, 10080]; // 0, 10m, 1h, 5h, 1d, 3d, 7d

// Gamification State
let mistakes = {}; // { word: count }
let streak = 0;
let lastStudyDate = null;
let level = 1;
let xp = 0;
let badges = {
    firstSteps: false,
    week1: false,
    perfectScore: false,
    master100: false,
    speedster: false,
    persistent: false
};

const LEVELS = [
    { level: 1, xp: 0, title: "Người mới" },
    { level: 2, xp: 100, title: "Học viên" },
    { level: 3, xp: 300, title: "Thành thạo" },
    { level: 4, xp: 600, title: "Chuyên gia" },
    { level: 5, xp: 1000, title: "Cao thủ" },
    { level: 6, xp: 1500, title: "Bậc thầy" }
];

const BADGE_CONFIG = [
    { id: 'firstSteps', name: 'Bước đầu', icon: '🎯', desc: 'Hoàn thành 10 từ' },
    { id: 'week1', name: 'Tuần đầu', icon: '📅', desc: 'Học 7 ngày liên tiếp' },
    { id: 'perfectScore', name: 'Hoàn hảo', icon: '💯', desc: 'Đạt 100 điểm' },
    { id: 'master100', name: 'Chuyên gia', icon: '👑', desc: 'Thuộc 100 từ' },
    { id: 'speedster', name: 'Tốc độ', icon: '⚡', desc: 'Trả lời 20 câu liên tiếp' },
    { id: 'persistent', name: 'Kiên trì', icon: '🔥', desc: 'Streak 30 ngày' }
];


// DOM Elements
const themeToggle = document.getElementById('theme-toggle');
const tabs = document.querySelectorAll('.nav-btn');

const tabContents = document.querySelectorAll('.tab-content');

// Flashcard Elements
const flashcard = document.getElementById('flashcard-element');
const fcWord = document.getElementById('fc-word');
const fcPronunciation = document.getElementById('fc-pronunciation');
const fcMeaning = document.getElementById('fc-meaning');
const fcExample = document.getElementById('fc-example');
const fcAudioBtn = document.getElementById('fc-audio-btn');
const fcFavBtn = document.getElementById('fc-fav-btn');
const prevBtn = document.getElementById('prev-btn');

const nextBtn = document.getElementById('next-btn');
const progressText = document.getElementById('progress-text');
const markLearnedBtn = document.getElementById('mark-learned-btn');

// Quiz Elements
const quizWord = document.getElementById('quiz-word');
const quizOptions = document.getElementById('quiz-options');
const quizFeedback = document.getElementById('quiz-feedback');
const nextQuestionBtn = document.getElementById('next-question-btn');
const scoreEl = document.getElementById('score');
const streakEl = document.getElementById('streak');
const dueCountEl = document.getElementById('due-count');

// Typing Elements

const typingMeaning = document.getElementById('typing-meaning');
const typingInput = document.getElementById('typing-input');
const typingSubmitBtn = document.getElementById('typing-submit-btn');
const typingHintBtn = document.getElementById('typing-hint-btn');
const typingFeedback = document.getElementById('typing-feedback');
const typingNextBtn = document.getElementById('typing-next-btn');
const typingScoreEl = document.getElementById('typing-score');

// Search Elements

const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    loadProgress();
    await loadData();
    setupEventListeners();
    updateFlashcard();
});


// 1. Data Loading
async function loadData() {
    try {
        const response = await fetch('data/VoCa.xlsx');
        if (!response.ok) throw new Error('Cannot fetch data file');
        
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Use header: 1 to get array of arrays
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let dataRows = rawData;
        let wordIdx = 1; // Default fallback
        let meaningIdx = 4;
        let ipaIdx = 2;
        let exampleIdx = 5;
        let startRow = 0;

        // Dynamic Header Detection
        for (let i = 0; i < Math.min(10, rawData.length); i++) {
            const row = rawData[i];
            if (!row || row.length === 0) continue;

            const rowStr = row.map(c => String(c).toLowerCase());
            
            const wIdx = rowStr.findIndex(c => c.includes('word') || c.includes('từ'));
            const mIdx = rowStr.findIndex(c => c.includes('meaning') || c.includes('nghĩa') || c.includes('vietnamese'));
            
            if (wIdx !== -1 && mIdx !== -1) {
                wordIdx = wIdx;
                meaningIdx = mIdx;
                
                // Try to find others
                const pIdx = rowStr.findIndex(c => c.includes('pronunciation') || c.includes('ipa') || c.includes('phiên âm'));
                if (pIdx !== -1) ipaIdx = pIdx;
                
                const eIdx = rowStr.findIndex(c => c.includes('example') || c.includes('ví dụ') || c.includes('note'));
                if (eIdx !== -1) exampleIdx = eIdx;
                
                startRow = i + 1;
                break;
            }
        }
        
        dataRows = rawData.slice(startRow);

        words = dataRows.map(row => {
            if (!row || !row[wordIdx]) return null;

            return {
                word: row[wordIdx], 
                meaning: row[meaningIdx] || 'Chưa có nghĩa',
                ipa: row[ipaIdx] || '',
                example: row[exampleIdx] || ''
            };
        }).filter(w => w !== null);

        console.log(`Loaded ${words.length} words`);





        console.log(`Loaded ${words.length} words`);
        
        // Initialize word lists after loading
        if (typeof initializeWordLists === 'function') {
            // Store all words first
            if (!window.allWords || window.allWords.length === 0) {
                window.allWords = [...words];
                initializeWordLists();
            }
        } else {
            // If list manager not loaded, just show first word
            progressText.innerText = `1 / ${words.length}`;
        }
        
    } catch (error) {
        console.error('Error loading data:', error);
        fcWord.innerText = 'Error';
        fcMeaning.innerText = 'Please run on a local server to load Excel file.';
        alert('Không thể tải file Excel. Hãy chắc chắn bạn đang chạy trên server (ví dụ: Live Server).');
    }
}

// 2. Event Listeners
function setupEventListeners() {
    // Theme Toggle
    themeToggle.addEventListener('click', toggleTheme);

    // Tabs
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            document.getElementById(tab.dataset.tab).classList.add('active');
            
            if (tab.dataset.tab === 'quiz') startQuiz();
            if (tab.dataset.tab === 'typing') startTypingGame();
            if (tab.dataset.tab === 'progress') updateProgressTab();
        });
    });


    // Flashcard
    flashcard.addEventListener('click', () => {
        flashcard.classList.toggle('flipped');
    });

    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            flashcard.classList.remove('flipped');
            setTimeout(updateFlashcard, 300);
        }
    });

    nextBtn.addEventListener('click', () => {
        if (currentIndex < words.length - 1) {
            currentIndex++;
            flashcard.classList.remove('flipped');
            setTimeout(updateFlashcard, 300);
        }
    });

    const flipBtn = document.getElementById('flip-btn');
    if (flipBtn) {
        flipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            flashcard.classList.toggle('flipped');
        });
    }

    fcAudioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        speak(words[currentIndex].word);
    });

    fcFavBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite();
    });

    markLearnedBtn.addEventListener('click', () => {

        const word = words[currentIndex].word;
        if (learnedWords.has(word)) {
            learnedWords.delete(word);
            markLearnedBtn.classList.remove('learned');
            markLearnedBtn.innerHTML = '<i class="fa-regular fa-check-circle"></i> Đánh dấu đã thuộc';
        } else {
            learnedWords.add(word);
            markLearnedBtn.classList.add('learned');
            markLearnedBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Đã thuộc';
        }
        saveProgress();
    });

    // Quiz
    nextQuestionBtn.addEventListener('click', generateQuestion);

    // Typing Game
    typingSubmitBtn.addEventListener('click', checkTypingAnswer);
    typingNextBtn.addEventListener('click', generateTypingQuestion);
    typingHintBtn.addEventListener('click', showTypingHint);
    typingInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') checkTypingAnswer();
    });

    // Search

    searchInput.addEventListener('input', (e) => {
        handleSearch(e.target.value);
    });
}

// 3. Flashcard Logic
function updateFlashcard() {
    if (words.length === 0) return;
    
    const word = words[currentIndex];
    
    fcWord.innerText = word.word;

    
    // Fix double slashes in IPA
    let ipa = word.ipa || '';
    if (ipa.startsWith('/') && ipa.endsWith('/')) {
        fcPronunciation.innerText = ipa;
    } else if (ipa) {
        fcPronunciation.innerText = `/${ipa}/`;
    } else {
        fcPronunciation.innerText = '';
    }

    fcMeaning.innerText = word.meaning;
    fcExample.innerText = word.example;
    
    progressText.innerText = `${currentIndex + 1} / ${words.length}`;
    
    // Update Favorite Status
    if (favorites.has(word.word)) {
        fcFavBtn.classList.add('active');
        fcFavBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
    } else {
        fcFavBtn.classList.remove('active');
        fcFavBtn.innerHTML = '<i class="fa-regular fa-star"></i>';
    }

    // Update learned status
    if (learnedWords.has(word.word)) {

        markLearnedBtn.classList.add('learned');
        markLearnedBtn.innerHTML = '<i class="fa-solid fa-check-circle"></i> Đã thuộc';
    } else {
        markLearnedBtn.classList.remove('learned');
        markLearnedBtn.innerHTML = '<i class="fa-regular fa-check-circle"></i> Đánh dấu đã thuộc';
    }
}

function speak(text) {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
}

// 4. Quiz Logic
let currentQuizAnswer = null;

function startQuiz() {
    if (words.length < 4) {
        quizWord.innerText = "Cần ít nhất 4 từ để bắt đầu Quiz!";
        return;
    }
    generateQuestion();
}

function generateQuestion() {
    // Reset UI
    quizFeedback.classList.add('hidden');
    nextQuestionBtn.classList.add('hidden');
    quizOptions.innerHTML = '';
    
    // Pick random word or Due word
    let targetWord;
    const dueWords = getDueWords();
    
    if (dueWords.length > 0) {
        // Prioritize due words
        targetWord = dueWords[Math.floor(Math.random() * dueWords.length)];
    } else {
        // Fallback to random
        const targetIndex = Math.floor(Math.random() * words.length);
        targetWord = words[targetIndex];
    }

    currentQuizAnswer = targetWord.meaning;
    quizWord.innerText = targetWord.word;

    
    // Generate distractors
    const options = new Set([targetWord.meaning]);
    while (options.size < 4) {
        const randomWord = words[Math.floor(Math.random() * words.length)];
        if (randomWord.meaning !== targetWord.meaning) {
            options.add(randomWord.meaning);
        }
    }
    
    // Shuffle and display
    Array.from(options)
        .sort(() => Math.random() - 0.5)
        .forEach(option => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = option;
            btn.onclick = () => checkAnswer(btn, option);
            quizOptions.appendChild(btn);
        });
}

function checkAnswer(btn, selected) {
    if (!nextQuestionBtn.classList.contains('hidden')) return; // Prevent multiple clicks
    
    const isCorrect = selected === currentQuizAnswer;
    const allBtns = document.querySelectorAll('.option-btn');
    
    if (isCorrect) {
        btn.classList.add('correct');
        score += 10;
        streak++;
        quizFeedback.innerText = "Chính xác! 🎉";
        quizFeedback.className = "feedback correct";
        speak(quizWord.innerText);
        
        // Gamification
        addXP(10);
        updateStreak();
        
        // Update SRS
        updateSRS(quizWord.innerText, true);
    } else {
        btn.classList.add('wrong');
        streak = 0;
        quizFeedback.innerText = `Sai rồi! Đáp án đúng là: ${currentQuizAnswer}`;
        quizFeedback.className = "feedback wrong";
        
        // Gamification
        trackMistake(quizWord.innerText);
        
        // Update SRS
        updateSRS(quizWord.innerText, false);
        
        // Highlight correct answer
        allBtns.forEach(b => {
            if (b.innerText === currentQuizAnswer) b.classList.add('correct');
        });
    }
    
    scoreEl.innerText = score;
    streakEl.innerText = streak;
    updateDueCount();
    quizFeedback.classList.remove('hidden');
    nextQuestionBtn.classList.remove('hidden');
    
    saveProgress();
}


// 5. Typing Game Logic
let currentTypingWord = null;

function startTypingGame() {
    if (words.length < 1) return;
    generateTypingQuestion();
}

function generateTypingQuestion() {
    typingFeedback.classList.add('hidden');
    typingNextBtn.classList.add('hidden');
    typingInput.value = '';
    typingInput.disabled = false;
    typingInput.focus();
    
    let randomWord;
    const dueWords = getDueWords();
    
    if (dueWords.length > 0) {
        randomWord = dueWords[Math.floor(Math.random() * dueWords.length)];
    } else {
        randomWord = words[Math.floor(Math.random() * words.length)];
    }

    currentTypingWord = randomWord;
    typingMeaning.innerText = randomWord.meaning;
}

function checkTypingAnswer() {
    if (!currentTypingWord || typingInput.disabled) return;
    
    const input = typingInput.value.trim().toLowerCase();
    const correct = currentTypingWord.word.toLowerCase();
    
    if (input === correct) {
        typingFeedback.innerText = "Chính xác! 🎉";
        typingFeedback.className = "feedback correct";
        score += 10;
        speak(currentTypingWord.word);
        typingInput.disabled = true;
        typingNextBtn.classList.remove('hidden');
        updateSRS(currentTypingWord.word, true);
    } else {
        typingFeedback.innerText = "Sai rồi, thử lại nhé!";
        typingFeedback.className = "feedback wrong";
        updateSRS(currentTypingWord.word, false);
    }
    
    typingFeedback.classList.remove('hidden');
    typingScoreEl.innerText = score;
    updateDueCount();
    saveProgress();
}


function showTypingHint() {
    if (!currentTypingWord) return;
    const firstLetter = currentTypingWord.word.charAt(0);
    typingFeedback.innerText = `Gợi ý: Bắt đầu bằng chữ "${firstLetter.toUpperCase()}"`;
    typingFeedback.className = "feedback";
    typingFeedback.classList.remove('hidden');
}

// 6. Search Logic
function handleSearch(query) {

    searchResults.innerHTML = '';
    if (!query) return;
    
    const filtered = words.filter(w => 
        w.word.toLowerCase().includes(query.toLowerCase()) || 
        w.meaning.toLowerCase().includes(query.toLowerCase())
    );
    
    filtered.forEach(w => {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <span class="result-word">${w.word}</span>
            <span class="result-meaning">${w.meaning}</span>
        `;
        div.onclick = () => {
            // Switch to flashcard and jump to word
            const idx = words.indexOf(w);
            if (idx !== -1) {
                currentIndex = idx;
                updateFlashcard();
                tabs[0].click(); // Switch to flashcard tab
            }
        };
        searchResults.appendChild(div);
    });
}

// 7. LocalStorage & Theme
function saveProgress() {
    localStorage.setItem('englishApp_learned', JSON.stringify([...learnedWords]));
    localStorage.setItem('englishApp_favorites', JSON.stringify([...favorites]));
    localStorage.setItem('englishApp_srs', JSON.stringify(srsData));
    localStorage.setItem('englishApp_score', score);
    
    // Gamification
    localStorage.setItem('englishApp_mistakes', JSON.stringify(mistakes));
    localStorage.setItem('englishApp_streak', streak);
    localStorage.setItem('englishApp_lastStudyDate', lastStudyDate);
    localStorage.setItem('englishApp_level', level);
    localStorage.setItem('englishApp_xp', xp);
    localStorage.setItem('englishApp_badges', JSON.stringify(badges));
}

function loadProgress() {
    const savedLearned = localStorage.getItem('englishApp_learned');
    if (savedLearned) learnedWords = new Set(JSON.parse(savedLearned));
    
    const savedFavorites = localStorage.getItem('englishApp_favorites');
    if (savedFavorites) favorites = new Set(JSON.parse(savedFavorites));
    
    const savedSRS = localStorage.getItem('englishApp_srs');
    if (savedSRS) srsData = JSON.parse(savedSRS);

    const savedScore = localStorage.getItem('englishApp_score');
    if (savedScore) {
        score = parseInt(savedScore);
        scoreEl.innerText = score;
        typingScoreEl.innerText = score;
    }
    
    // Gamification
    const savedMistakes = localStorage.getItem('englishApp_mistakes');
    if (savedMistakes) mistakes = JSON.parse(savedMistakes);
    
    const savedStreak = localStorage.getItem('englishApp_streak');
    if (savedStreak) streak = parseInt(savedStreak);
    
    const savedLastStudyDate = localStorage.getItem('englishApp_lastStudyDate');
    if (savedLastStudyDate) lastStudyDate = savedLastStudyDate;
    
    const savedLevel = localStorage.getItem('englishApp_level');
    if (savedLevel) level = parseInt(savedLevel);
    
    const savedXP = localStorage.getItem('englishApp_xp');
    if (savedXP) xp = parseInt(savedXP);
    
    const savedBadges = localStorage.getItem('englishApp_badges');
    if (savedBadges) badges = JSON.parse(savedBadges);
    
    updateDueCount();
}


// 8. SRS Logic Helpers
function getDueWords() {
    const now = Date.now();
    return words.filter(w => {
        const data = srsData[w.word];
        // If never learned (no data), it's not "due" in SRS sense, but we can treat as new.
        // Here we only return words that are strictly DUE for review.
        return data && data.nextReview <= now;
    });
}

function updateSRS(word, isCorrect) {
    if (!srsData[word]) {
        srsData[word] = { level: 0, nextReview: 0 };
    }
    
    let data = srsData[word];
    
    if (isCorrect) {
        data.level = Math.min(data.level + 1, SRS_INTERVALS.length - 1);
    } else {
        data.level = 0; // Reset on wrong
    }
    
    // Calculate next review time
    const minutes = SRS_INTERVALS[data.level];
    data.nextReview = Date.now() + (minutes * 60 * 1000);
    
    srsData[word] = data;
    console.log(`SRS Update for ${word}: Level ${data.level}, Next review in ${minutes} mins`);
}

function updateDueCount() {
    const count = getDueWords().length;
    if (dueCountEl) dueCountEl.innerText = count;
}


function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('englishApp_theme', isDark ? 'dark' : 'light');
    updateThemeIcon(isDark);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('englishApp_theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        updateThemeIcon(true);
    }
}

function updateThemeIcon(isDark) {
    themeToggle.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
}

function toggleFavorite() {
    const word = words[currentIndex].word;
    if (favorites.has(word)) {
        favorites.delete(word);
    } else {
        favorites.add(word);
    }
    updateFlashcard();
    saveProgress();
}

