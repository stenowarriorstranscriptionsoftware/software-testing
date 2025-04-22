// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDNdovILjmsBQxGuXx4iOOw1JgCL2_3TLI",
  authDomain: "stenowarriorsyoursteno.firebaseapp.com",
  databaseURL: "https://stenowarriorsyoursteno-default-rtdb.firebaseio.com",
  projectId: "stenowarriorsyoursteno",
  storageBucket: "stenowarriorsyoursteno.appspot.com",
  messagingSenderId: "173103533896",
  appId: "1:173103533896:web:78bbe18e17ca8f5da5ad7d",
  measurementId: "G-Y3E0QVFSBB"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Initialize jsPDF
const { jsPDF } = window.jspdf;

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const originalTextEl = document.getElementById('originalText');
  const userTextEl = document.getElementById('userText');
  const compareBtn = document.getElementById('compareBtn');
  const showFullTextBtn = document.getElementById('showFullTextBtn');
  const backToResultsBtn = document.getElementById('backToResultsBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const closeResultsBtn = document.getElementById('closeResultsBtn');
  const resultsSection = document.getElementById('results');
  const fullTextSection = document.getElementById('fullTextSection');
  const comparisonResultEl = document.getElementById('comparisonResult');
  const statsEl = document.getElementById('stats');
  const feedbackEl = document.getElementById('feedback');
  const originalDisplayEl = document.getElementById('originalDisplay');
  const userDisplayEl = document.getElementById('userDisplay');
  const resultDateEl = document.getElementById('resultDate');
  const originalTextGroup = document.getElementById('originalTextGroup');
  const timerOptions = document.getElementById('timerOptions');
  const timerDisplay = document.getElementById('timerDisplay');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const userInfo = document.getElementById('userInfo');
  const userPhoto = document.getElementById('userPhoto');
  const userName = document.getElementById('userName');
  const loginPrompt = document.getElementById('loginPrompt');
  const customTestSection = document.getElementById('customTestSection');
  const globalTestsSection = document.getElementById('globalTestsSection');
  const globalTestsList = document.getElementById('globalTestsList');
  const leaderboardSection = document.getElementById('leaderboardSection');
  const leaderboardList = document.getElementById('leaderboardList');
  const leaderboardFilter = document.getElementById('leaderboardFilter');
  const testNameFilter = document.getElementById('testNameFilter');
  const categoryFilter = document.getElementById('categoryFilter');
  const testCategoryFilter = document.getElementById('testCategoryFilter');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const leaderboardPagination = document.getElementById('leaderboardPagination');
  const saveBtn = document.getElementById('saveTestBtn');
  const clearBtn = document.getElementById('clearTestsBtn');
  const customTitle = document.getElementById('customTitle');
  const customOriginal = document.getElementById('customOriginal');
  const customVideoUrl = document.getElementById('customVideoUrl');
  const customCategory = document.getElementById('customCategory');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  const emailLoginBtn = document.getElementById('emailLoginBtn');
  const googleLoginBtn = document.getElementById('googleLoginBtn');
  const registerBtn = document.getElementById('registerBtn');
  const showRegister = document.getElementById('showRegister');
  const showLogin = document.getElementById('showLogin');
  const loginEmail = document.getElementById('loginEmail');
  const loginPassword = document.getElementById('loginPassword');
  const registerName = document.getElementById('registerName');
  const registerEmail = document.getElementById('registerEmail');
  const registerPassword = document.getElementById('registerPassword');
  const confirmPassword = document.getElementById('confirmPassword');

  // Timer variables
  let timerInterval;
  let endTime;
  let testActive = false;
  let timerButtons = document.querySelectorAll('.timer-option');
  
  // Leaderboard variables
  let currentPage = 1;
  const entriesPerPage = 10;
  let allAttempts = [];
  let filteredAttempts = [];
  let uniqueTestNames = new Set();
  let currentSortColumn = 'accuracy';
  let currentSortDirection = 'desc';

  // Initialize typing timer
  let startTime = null;
  userTextEl.addEventListener('input', function() {
    if (!startTime) {
      startTime = new Date();
    }
  });

  // Toggle between login and register forms
  showRegister.addEventListener('click', (e) => {
    e.preventDefault();
    loginForm.classList.add('hidden');
    registerForm.classList.remove('hidden');
  });

  showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    registerForm.classList.add('hidden');
    loginForm.classList.remove('hidden');
  });

  // Email/password login handler
  emailLoginBtn.addEventListener('click', () => {
    const email = loginEmail.value.trim();
    const password = loginPassword.value.trim();
    
    if (!email || !password) {
      alert('Please enter both email and password');
      return;
    }
    
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log('Login successful');
      })
      .catch(error => {
        console.error('Login error:', error);
        alert('Login failed: ' + error.message);
      });
  });

  // Registration handler
  registerBtn.addEventListener('click', () => {
    const name = registerName.value.trim();
    const email = registerEmail.value.trim();
    const password = registerPassword.value.trim();
    const confirm = confirmPassword.value.trim();
    
    if (!name || !email || !password || !confirm) {
      alert('Please fill in all fields');
      return;
    }
    
    if (password !== confirm) {
      alert('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      alert('Password should be at least 6 characters');
      return;
    }
    
    auth.createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        return userCredential.user.updateProfile({
          displayName: name
        });
      })
      .then(() => {
        alert('Registration successful! You are now logged in.');
        registerName.value = '';
        registerEmail.value = '';
        registerPassword.value = '';
        confirmPassword.value = '';
        registerForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
      })
      .catch(error => {
        console.error('Registration error:', error);
        alert('Registration failed: ' + error.message);
      });
  });

  // Google login handler
  googleLoginBtn.addEventListener('click', () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider)
      .catch(error => {
        console.error('Google login error:', error);
        alert('Google login failed. Please try again.');
      });
  });

  // Auth state listener
  auth.onAuthStateChanged(user => {
    if (user) {
      loginBtn.classList.add('hidden');
      userInfo.classList.remove('hidden');
      if (user.photoURL) {
        userPhoto.src = user.photoURL;
      } else {
        userPhoto.src = 'https://www.gravatar.com/avatar/' + user.uid + '?d=identicon';
      }
      userName.textContent = user.displayName || 'User';
      loginPrompt.classList.add('hidden');
      customTestSection.classList.remove('hidden');
      globalTestsSection.classList.remove('hidden');
      leaderboardSection.classList.remove('hidden');
      loadGlobalTests();
      loadLeaderboard();
      cleanupOldData();
    } else {
      loginBtn.classList.remove('hidden');
      userInfo.classList.add('hidden');
      loginPrompt.classList.remove('hidden');
      customTestSection.classList.add('hidden');
      globalTestsSection.classList.add('hidden');
      leaderboardSection.classList.add('hidden');
      loginForm.classList.remove('hidden');
      registerForm.classList.add('hidden');
    }
  });

  // Logout handler
  logoutBtn.addEventListener('click', () => {
    auth.signOut();
  });

  // Leaderboard filter change handlers
  leaderboardFilter.addEventListener('change', () => {
    currentPage = 1;
    loadLeaderboard();
  });

  testNameFilter.addEventListener('change', () => {
    currentPage = 1;
    loadLeaderboard();
  });

  categoryFilter.addEventListener('change', () => {
    currentPage = 1;
    loadLeaderboard();
  });

  // Test category filter for community tests
  testCategoryFilter.addEventListener('change', () => {
    loadGlobalTests();
  });

  // Pagination button handlers
  prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      updatePagination();
    }
  });

  nextPageBtn.addEventListener('click', () => {
    const totalPages = Math.ceil(filteredAttempts.length / entriesPerPage);
    if (currentPage < totalPages) {
      currentPage++;
      updatePagination();
    }
  });

  // Load leaderboard data with pagination
  function loadLeaderboard() {
    const filter = leaderboardFilter.value;
    const category = categoryFilter.value;
    let query = database.ref('attempts').orderByChild('timestamp');
    
    if (filter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      query = query.startAt(oneWeekAgo.getTime());
    } else if (filter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
      query = query.startAt(oneMonthAgo.getTime());
    }

    query.once('value')
      .then(snapshot => {
        const attempts = snapshot.val();
        if (!attempts) {
          leaderboardList.innerHTML = '<p>No attempts recorded yet. Be the first to complete a test!</p>';
          leaderboardPagination.innerHTML = '';
          return;
        }

        allAttempts = Object.entries(attempts).map(([id, attempt]) => ({
          id,
          ...attempt
        }));
        
        sortAttempts(currentSortColumn, currentSortDirection);
        updateTestNameFilter(allAttempts);
        
        filteredAttempts = allAttempts.filter(attempt => {
          const nameMatch = testNameFilter.value === 'all' || attempt.testTitle === testNameFilter.value;
          const categoryMatch = category === 'all' || attempt.category === category;
          return nameMatch && categoryMatch;
        });
          
        updatePagination();
      })
      .catch(error => {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<p>Error loading leaderboard. Please try again later.</p>';
        leaderboardPagination.innerHTML = '';
      });
  }

  function sortAttempts(column, direction) {
    allAttempts.sort((a, b) => {
      let aValue, bValue;
      
      switch (column) {
        case 'accuracy':
        case 'wpm':
        case 'totalOriginal':
        case 'totalUser':
        case 'halfMistakes':
        case 'fullMistakes':
        case 'timeTaken':
          aValue = a.stats[column];
          bValue = b.stats[column];
          break;
        case 'userName':
          aValue = a.userName.toLowerCase();
          bValue = b.userName.toLowerCase();
          break;
        case 'testTitle':
          aValue = (a.testTitle || 'Custom Test').toLowerCase();
          bValue = (b.testTitle || 'Custom Test').toLowerCase();
          break;
        case 'date':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      } else {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue) 
          : bValue.localeCompare(bValue);
      }
    });
  }

  function updateTestNameFilter(attempts) {
    uniqueTestNames = new Set(attempts.map(attempt => attempt.testTitle || 'Custom Test'));
    const currentTestFilter = testNameFilter.value;
    
    testNameFilter.innerHTML = '<option value="all">All Tests</option>';
    uniqueTestNames.forEach(testName => {
      const option = document.createElement('option');
      option.value = testName;
      option.textContent = testName;
      testNameFilter.appendChild(option);
    });
    
    if (currentTestFilter !== 'all' && uniqueTestNames.has(currentTestFilter)) {
      testNameFilter.value = currentTestFilter;
    } else {
      testNameFilter.value = 'all';
    }
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredAttempts.length / entriesPerPage);
    const startIdx = (currentPage - 1) * entriesPerPage;
    const endIdx = startIdx + entriesPerPage;
    const pageAttempts = filteredAttempts.slice(startIdx, endIdx);
    
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    leaderboardPagination.innerHTML = `Showing ${startIdx + 1}-${Math.min(endIdx, filteredAttempts.length)} of ${filteredAttempts.length} entries`;
    
    renderLeaderboardTable(pageAttempts, startIdx + 1);
  }

  function renderLeaderboardTable(attempts, startRank) {
    if (attempts.length === 0) {
      leaderboardList.innerHTML = '<p>No attempts match your filters.</p>';
      return;
    }

    let tableHTML = `
      <table>
        <thead>
          <tr>
            <th data-column="rank">Rank</th>
            <th data-column="userName">User</th>
            <th data-column="testTitle">Test</th>
            <th data-column="accuracy">Accuracy</th>
            <th data-column="wpm">Speed (WPM)</th>
            <th data-column="totalOriginal">Original Words</th>
            <th data-column="totalUser">Typed Words</th>
            <th data-column="timeTaken">Time Taken</th>
            <th data-column="halfMistakes">Half Mistakes</th>
            <th data-column="fullMistakes">Full Mistakes</th>
            <th data-column="date">Date</th>
          </tr>
        </thead>
        <tbody>
    `;

    let cardHTML = ''; // For mobile card layout

    attempts.forEach((attempt, index) => {
      const date = new Date(attempt.timestamp);
      const accuracyClass = 
        attempt.stats.accuracy >= 90 ? 'accuracy-high' :
        attempt.stats.accuracy >= 70 ? 'accuracy-medium' : 'accuracy-low';
      
      const minutes = Math.floor(attempt.stats.timeTaken / 60);
      const seconds = attempt.stats.timeTaken % 60;
      const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      let badge = '';
      if (startRank + index === 1) {
        badge = '<span class="badge badge-gold">🥇</span>';
      } else if (startRank + index === 2) {
        badge = '<span class="badge badge-silver">🥈</span>';
      } else if (startRank + index === 3) {
        badge = '<span class="badge badge-bronze">🥉</span>';
      }

      // Table row for desktop
      tableHTML += `
        <tr>
          <td data-label="Rank">${startRank + index} ${badge}</td>
          <td data-label="User" class="leaderboard-user">
            <img src="${attempt.userPhoto}" alt="${attempt.userName}">
            <span>${attempt.userName}</span>
          </td>
          <td data-label="Test">${attempt.testTitle || 'Custom Test'} ${attempt.category ? `<span class="category-badge category-${attempt.category}">${getCategoryName(attempt.category)}</span>` : ''}</td>
          <td data-label="Accuracy" class="accuracy-cell ${accuracyClass}">${attempt.stats.accuracy.toFixed(1)}%</td>
          <td data-label="Speed">${attempt.stats.wpm}</td>
          <td data-label="Original Words">${attempt.stats.totalOriginal}</td>
          <td data-label="Typed Words">${attempt.stats.totalUser}</td>
          <td data-label="Time Taken">${timeFormatted}</td>
          <td data-label="Half Mistakes">${attempt.stats.halfMistakes}</td>
          <td data-label="Full Mistakes">${attempt.stats.fullMistakes}</td>
          <td data-label="Date">${date.toLocaleDateString()}</td>
        </tr>
      `;

      // Card for mobile
      cardHTML += `
        <div class="leaderboard-card">
          <div class="leaderboard-card-header">
            <h4>${startRank + index}. ${attempt.userName} ${badge}</h4>
            <button class="leaderboard-card-toggle" aria-label="Toggle details">+</button>
          </div>
          <div class="leaderboard-card-details">
            <dl>
              <dt>Test:</dt>
              <dd>${attempt.testTitle || 'Custom Test'} ${attempt.category ? `<span class="category-badge category-${attempt.category}">${getCategoryName(attempt.category)}</span>` : ''}</dd>
              <dt>Accuracy:</dt>
              <dd class="accuracy-cell ${accuracyClass}">${attempt.stats.accuracy.toFixed(1)}%</dd>
              <dt>Speed:</dt>
              <dd>${attempt.stats.wpm} WPM</dd>
              <dt>Original Words:</dt>
              <dd>${attempt.stats.totalOriginal}</dd>
              <dt>Typed Words:</dt>
              <dd>${attempt.stats.totalUser}</dd>
              <dt>Time Taken:</dt>
              <dd>${timeFormatted}</dd>
              <dt>Half Mistakes:</dt>
              <dd>${attempt.stats.halfMistakes}</dd>
              <dt>Full Mistakes:</dt>
              <dd>${attempt.stats.fullMistakes}</dd>
              <dt>Date:</dt>
              <dd>${date.toLocaleDateString()}</dd>
            </dl>
          </div>
        </div>
      `;
    });

    tableHTML += `</tbody></table>`;
    leaderboardList.innerHTML = tableHTML + cardHTML;
    
    // Add toggle functionality for cards
    document.querySelectorAll('.leaderboard-card-toggle').forEach(toggle => {
      toggle.addEventListener('click', () => {
        const details = toggle.parentElement.nextElementSibling;
        const isExpanded = details.classList.contains('show');
        details.classList.toggle('show');
        toggle.textContent = isExpanded ? '+' : '−';
        toggle.setAttribute('aria-label', isExpanded ? 'Show details' : 'Hide details');
      });
    });
    
    makeTableSortable();
  }

  function makeTableSortable() {
    const headers = document.querySelectorAll('.leaderboard-list th[data-column]');
    headers.forEach(header => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', () => {
        const column = header.getAttribute('data-column');
        
        if (currentSortColumn === column) {
          currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
          currentSortColumn = column;
          currentSortDirection = 'desc';
        }
        
        sortAttempts(column, currentSortDirection);
        updatePagination();
        
        headers.forEach(h => {
          h.classList.remove('sorted-asc', 'sorted-desc');
          if (h.getAttribute('data-column') === column) {
            h.classList.add(`sorted-${currentSortDirection}`);
          }
        });
      });
      
      if (header.getAttribute('data-column') === currentSortColumn) {
        header.classList.add(`sorted-${currentSortDirection}`);
      }
    });
  }

  // Auto-delete old data function
  function cleanupOldData() {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const timestampThreshold = threeMonthsAgo.getTime();

    database.ref('attempts').once('value').then(snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        if (child.val().timestamp < timestampThreshold) {
          updates[child.key] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        database.ref('attempts').update(updates);
      }
    });

    database.ref('tests').once('value').then(snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        if (child.val().timestamp < timestampThreshold) {
          updates[child.key] = null;
        }
      });
      if (Object.keys(updates).length > 0) {
        database.ref('tests').update(updates);
      }
    });
  }

  // Run cleanup weekly
  setInterval(cleanupOldData, 7 * 24 * 60 * 60 * 1000);

  // Original text paste handler
  originalTextEl.addEventListener('paste', function() {
    document.querySelectorAll('.test-card').forEach(card => {
      card.classList.remove('selected');
    });
    
    setTimeout(() => {
      if (originalTextEl.value.trim() !== '' && !testActive) {
        originalTextGroup.classList.add('hidden');
        timerOptions.classList.remove('hidden');
        timerButtons.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
        });
      }
    }, 0);
  });
  
  // Timer option click handler
  timerButtons.forEach(button => {
    button.addEventListener('click', function() {
      const minutes = parseInt(this.dataset.minutes);
      startTimer(minutes);
      timerOptions.classList.add('hidden');
      timerDisplay.classList.remove('hidden');
      testActive = true;
    });
  });
  
  // Compare button click handler
  compareBtn.addEventListener('click', function() {
    stopTimer();
    compareTexts();
    disableTimerOptions();
  });
  
  // Show full text button click handler
  showFullTextBtn.addEventListener('click', showFullTexts);
  
  // Back to results button click handler
  backToResultsBtn.addEventListener('click', showResults);
  
  // Download PDF button click handler
  downloadPdfBtn.addEventListener('click', downloadAsPdf);
  
  // Close results button click handler
  closeResultsBtn.addEventListener('click', function() {
    const existingVideo = document.getElementById('testVideoPlayer');
    if (existingVideo) existingVideo.remove();
    location.reload();
  });
  
  function startTimer(minutes) {
    endTime = new Date();
    endTime.setMinutes(endTime.getMinutes() + minutes);
    
    updateTimerDisplay();
    
    timerInterval = setInterval(() => {
      updateTimerDisplay();
      
      const now = new Date();
      if (now >= endTime) {
        stopTimer();
        timerDisplay.classList.add('timer-ended');
        timerDisplay.textContent = "TIME'S UP!";
        compareTexts();
        lockTest();
        disableTimerOptions();
      }
    }, 1000);
  }
  
  function stopTimer() {
    clearInterval(timerInterval);
    timerDisplay.classList.add('hidden');
  }
  
  function disableTimerOptions() {
    timerButtons.forEach(btn => {
      btn.disabled = true;
      btn.style.opacity = '0.5';
      btn.style.cursor = 'not-allowed';
    });
  }
  
  function updateTimerDisplay() {
    const now = new Date();
    const remaining = endTime - now;
    
    if (remaining <= 0) return;
    
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
    
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  function lockTest() {
    userTextEl.readOnly = true;
    userTextEl.classList.add('locked-textarea');
    compareBtn.disabled = true;
    closeResultsBtn.classList.remove('hidden');
  }
  
  function compareTexts() {
    const originalText = originalTextEl.value;
    const userText = userTextEl.value;
    
    if (!originalText || !userText) {
      alert('Please enter both original text and your transcription.');
      return;
    }
    
    let testTitle = "Custom Test";
    const selectedTestCard = document.querySelector('.test-card.selected');
    if (selectedTestCard) {
        testTitle = selectedTestCard.querySelector('h4').textContent;
    }
    
    const originalWords = processText(originalText);
    const userWords = processText(userText);
    
    const comparison = compareParagraphs(originalWords, userWords);
    
    displayComparison(comparison);
    displayStats(comparison.stats);
    displayFeedback(comparison.stats, originalWords, userWords);
    displayFullTexts(originalText, userText);
    
    const now = new Date();
    resultDateEl.textContent = now.toLocaleString();
    
    showResults();
    
    if (testActive) {
      lockTest();
    }

    const user = auth.currentUser;
    if (user) {
      const attemptData = {
        userName: user.displayName,
        userPhoto: user.photoURL,
        testTitle: testTitle,
        category: selectedTestCard ? selectedTestCard.dataset.category : customCategory.value,
        stats: comparison.stats,
        timestamp: Date.now()
      };

      database.ref('attempts').push(attemptData)
        .then(() => loadLeaderboard())
        .catch(error => console.error('Error saving attempt:', error));
    }
  }
  
  function showFullTexts() {
    resultsSection.classList.add('hidden');
    fullTextSection.classList.remove('hidden');
  }
  
  function showResults() {
    fullTextSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
  }
  
  function downloadAsPdf() {
    const resultsElement = document.getElementById('results');

    html2canvas(resultsElement, {
      scale: 1.5,
      useCORS: true,
      allowTaint: true
    }).then(canvas => {
      const imgData = canvas.toDataURL('image/jpeg', 0.7);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth