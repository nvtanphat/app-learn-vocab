// 9. Gamification Logic
function updateStreak() {
    const today = new Date().toDateString();
    
    if (lastStudyDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastStudyDate === yesterdayStr) {
            streak++;
        } else if (lastStudyDate === null) {
            streak = 1;
        } else {
            streak = 1; // Reset streak
        }
        
        lastStudyDate = today;
        saveProgress();
    }
}

function addXP(amount) {
    xp += amount;
    
    // Check for level up
    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (xp >= LEVELS[i].xp) {
            if (level < LEVELS[i].level) {
                level = LEVELS[i].level;
                showLevelUpMessage();
            }
            break;
        }
    }
    
    checkBadges();
    saveProgress();
}

function checkBadges() {
    let hasNewBadge = false;
    
    if (!badges.firstSteps && learnedWords.size >= 10) {
        badges.firstSteps = true;
        hasNewBadge = true;
    }
    
    if (!badges.week1 && streak >= 7) {
        badges.week1 = true;
        hasNewBadge = true;
    }
    
    if (!badges.perfectScore && score >= 100) {
        badges.perfectScore = true;
        hasNewBadge = true;
    }
    
    if (!badges.master100 && learnedWords.size >= 100) {
        badges.master100 = true;
        hasNewBadge = true;
    }
    
    if (!badges.persistent && streak >= 30) {
        badges.persistent = true;
        hasNewBadge = true;
    }
    
    if (hasNewBadge) {
        saveProgress();
    }
}

function trackMistake(word) {
    if (!mistakes[word]) {
        mistakes[word] = 0;
    }
    mistakes[word]++;
    saveProgress();
}

function showLevelUpMessage() {
    const levelInfo = LEVELS.find(l => l.level === level);
    if (levelInfo) {
        alert(`🎉 Chúc mừng! Bạn đã lên ${levelInfo.title} (Level ${level})!`);
    }
}

function updateProgressTab() {
    updateStreak();
    
    // Update Level Card
    const levelInfo = LEVELS.find(l => l.level === level) || LEVELS[0];
    const nextLevelInfo = LEVELS.find(l => l.level === level + 1);
    
    document.getElementById('level-badge').innerText = `Level ${level}`;
    document.getElementById('user-title').innerText = levelInfo.title;
    document.getElementById('current-xp').innerText = xp;
    
    if (nextLevelInfo) {
        document.getElementById('next-level-xp').innerText = nextLevelInfo.xp;
        const progress = ((xp - levelInfo.xp) / (nextLevelInfo.xp - levelInfo.xp)) * 100;
        document.getElementById('xp-fill').style.width = `${Math.min(progress, 100)}%`;
    } else {
        document.getElementById('next-level-xp').innerText = 'MAX';
        document.getElementById('xp-fill').style.width = '100%';
    }
    
    // Update Stats
    document.getElementById('streak-days').innerText = streak;
    document.getElementById('learned-count').innerText = learnedWords.size;
    document.getElementById('total-score').innerText = score;
    
    // Update Badges
    const badgesGrid = document.getElementById('badges-grid');
    badgesGrid.innerHTML = '';
    
    BADGE_CONFIG.forEach(badge => {
        const badgeEl = document.createElement('div');
        badgeEl.className = `badge-item ${badges[badge.id] ? 'unlocked' : 'locked'}`;
        badgeEl.innerHTML = `
            <div class="badge-icon">${badge.icon}</div>
            <div class="badge-name">${badge.name}</div>
        `;
        badgeEl.title = badge.desc;
        badgesGrid.appendChild(badgeEl);
    });
    
    // Update Difficult Words
    const difficultWordsList = document.getElementById('difficult-words-list');
    difficultWordsList.innerHTML = '';
    
    const difficultWords = Object.entries(mistakes)
        .filter(([word, count]) => count >= 2)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
    
    if (difficultWords.length === 0) {
        difficultWordsList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Chưa có từ nào bị sai nhiều. Tuyệt vời!</p>';
    } else {
        difficultWords.forEach(([word, count]) => {
            const wordData = words.find(w => w.word === word);
            const div = document.createElement('div');
            div.className = 'difficult-word-item';
            div.innerHTML = `
                <span class="difficult-word-name">${word}</span>
                <span class="mistake-count">Sai ${count} lần</span>
            `;
            div.onclick = () => {
                if (wordData) {
                    const idx = words.indexOf(wordData);
                    if (idx !== -1) {
                        currentIndex = idx;
                        updateFlashcard();
                        tabs[0].click();
                    }
                }
            };
            difficultWordsList.appendChild(div);
        });
    }
}
