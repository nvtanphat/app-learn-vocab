// Word List Management

let allWords = []; // Store all words
let wordLists = []; // Divided into chunks
let currentListIndex = 0;
let listProgress = {}; // Track progress per list

// Initialize word lists
function initializeWordLists() {
    if (allWords.length === 0) return;
    
    // Divide into chunks of 30
    const CHUNK_SIZE = 30;
    wordLists = [];
    
    for (let i = 0; i < allWords.length; i += CHUNK_SIZE) {
        wordLists.push(allWords.slice(i, i + CHUNK_SIZE));
    }
    
    console.log(`Created ${wordLists.length} lists with max ${CHUNK_SIZE} words each`);
    
    // Load saved list index
    const savedIndex = localStorage.getItem('englishApp_currentList');
    if (savedIndex !== null && parseInt(savedIndex) < wordLists.length) {
        currentListIndex = parseInt(savedIndex);
    }
    
    // Load list progress
    const savedProgress = localStorage.getItem('englishApp_listProgress');
    if (savedProgress) {
        listProgress = JSON.parse(savedProgress);
    }
    
    // Set active words to current list
    words = wordLists[currentListIndex] || [];
    
    console.log(`List ${currentListIndex + 1} loaded with ${words.length} words`);
    
    // Update UI with new list
    if (words.length > 0) {
        currentIndex = 0;
        if (typeof updateFlashcard === 'function') {
            updateFlashcard();
        }
        if (typeof progressText !== 'undefined' && progressText) {
            progressText.innerText = `1 / ${words.length}`;
        }
    }
    
    // Show list selector on first load or if requested
    const hasSeenSelector = localStorage.getItem('englishApp_hasSeenSelector');
    if (!hasSeenSelector) {
        setTimeout(() => showListSelector(), 500);
        localStorage.setItem('englishApp_hasSeenSelector', 'true');
    } else {
        // Hide overlay by default
        hideListSelector();
        updateCurrentListDisplay();
    }
    
    renderListSelector();
}

// Render list selector
function renderListSelector() {
    const grid = document.getElementById('list-grid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    wordLists.forEach((list, index) => {
        const card = document.createElement('div');
        card.className = 'list-card';
        
        if (index === currentListIndex) {
            card.classList.add('active');
        }
        
        // Calculate progress
        const progress = listProgress[index] || { learned: 0, total: list.length };
        const percentage = Math.round((progress.learned / progress.total) * 100);
        
        if (percentage === 100) {
            card.classList.add('completed');
        }
        
        card.innerHTML = `
            <h3>📖 Nhóm ${index + 1}</h3>
            <p>${list.length} từ</p>
            <div class="list-progress">${percentage}% hoàn thành</div>
            <div class="list-stats">
                <div class="list-stat">
                    <span class="list-stat-value">${progress.learned || 0}</span>
                    <span class="list-stat-label">Đã học</span>
                </div>
                <div class="list-stat">
                    <span class="list-stat-value">${progress.total - (progress.learned || 0)}</span>
                    <span class="list-stat-label">Còn lại</span>
                </div>
            </div>
        `;
        
        card.onclick = () => selectList(index);
        grid.appendChild(card);
    });
}

// Select a list
function selectList(index) {
    if (index < 0 || index >= wordLists.length) return;
    
    // If selecting the same list, just close overlay
    if (index === currentListIndex) {
        hideListSelector();
        return;
    }
    
    // Save selection
    localStorage.setItem('englishApp_currentList', index);
    
    // Reload page to apply new list
    location.reload();
}

// Show/Hide list selector
function showListSelector() {
    document.getElementById('list-selector-overlay').classList.remove('hidden');
    renderListSelector();
}

function hideListSelector() {
    document.getElementById('list-selector-overlay').classList.add('hidden');
}

// Update current list display
function updateCurrentListDisplay() {
    const display = document.getElementById('current-list-name');
    if (display) {
        display.innerText = `Nhóm ${currentListIndex + 1} (${words.length} từ)`;
    }
}

// Update list progress
function updateListProgress() {
    const learned = words.filter(w => learnedWords.has(w.word)).length;
    
    listProgress[currentListIndex] = {
        learned: learned,
        total: words.length
    };
    
    localStorage.setItem('englishApp_listProgress', JSON.stringify(listProgress));
    renderListSelector();
}

// Override original loadData to store all words
const originalLoadDataComplete = () => {
    // After words are loaded, store them
    allWords = [...words];
    initializeWordLists();
};

// Hook into data loading
window.addEventListener('load', () => {
    // Wait a bit for data to load
    setTimeout(() => {
        if (words.length > 0 && allWords.length === 0) {
            allWords = [...words];
            initializeWordLists();
        }
    }, 1000);
});

// Update progress when marking learned
// Wait for DOM to be ready
window.addEventListener('load', () => {
    const markLearnedBtn = document.getElementById('mark-learned-btn');
    if (markLearnedBtn) {
        markLearnedBtn.addEventListener('click', () => {
            setTimeout(updateListProgress, 100);
        });
    }
});
