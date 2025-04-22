// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDNdovILjmsBQxGuXx4iOOw1JgCL2_3TLI",
  authDomain: "stenowarriorsyoursteno.firebaseapp.com",
  databaseURL: "https://stenowarriorsyoursteno-default-rtdb.firebaseio.com",
  projectId: "stenowarriorsyoursteno",
  storageBucket: "stenowarriorsyoursteno.firebasestorage.app",
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
  const userFilter = document.getElementById('userFilter');
  const testCategoryFilter = document.getElementById('testCategoryFilter');
  const firstPageBtn = document.getElementById('firstPageBtn');
  const prevPageBtn = document.getElementById('prevPageBtn');
  const nextPageBtn = document.getElementById('nextPageBtn');
  const lastPageBtn = document.getElementById('lastPageBtn');
  const pageInfo = document.getElementById('pageInfo');
  const exportBtn = document.getElementById('exportBtn');
  const toggleGraphBtn = document.getElementById('toggleGraphBtn');
  const leaderboardGraph = document.getElementById('leaderboardGraph');
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
  let uniqueUserNames = new Set();
  let currentSortColumn = 'accuracy';
  let currentSortDirection = 'desc';
  let chart = null;

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

  userFilter.addEventListener('change', () => {
    currentPage = 1;
    loadLeaderboard();
  });

  // Test category filter for community tests
  testCategoryFilter.addEventListener('change', () => {
    loadGlobalTests();
  });

  // Pagination button handlers
  firstPageBtn.addEventListener('click', () => {
    currentPage = 1;
    updatePagination();
  });

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

  lastPageBtn.addEventListener('click', () => {
    currentPage = Math.ceil(filteredAttempts.length / entriesPerPage);
    updatePagination();
  });

  // Export button handler
  exportBtn.addEventListener('click', exportLeaderboardToCSV);

  // Toggle graph view
  toggleGraphBtn.addEventListener('click', toggleGraphView);

  // Load leaderboard data with pagination
  function loadLeaderboard() {
    const filter = leaderboardFilter.value;
    const category = categoryFilter.value;
    const userName = userFilter.value;
    let query = database.ref('attempts').orderByChild('timestamp');
    
    // Apply time filter
    const now = new Date();
    let startTimestamp = 0;
    
    switch (filter) {
      case 'today':
        startTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        break;
      case 'week':
        startTimestamp = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()).getTime();
        break;
      case 'month':
        startTimestamp = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        break;
      case 'year':
        startTimestamp = new Date(now.getFullYear(), 0, 1).getTime();
        break;
    }
    
    if (filter !== 'all') {
      query = query.startAt(startTimestamp);
    }

    query.once('value')
      .then(snapshot => {
        const attempts = snapshot.val();
        if (!attempts) {
          leaderboardList.innerHTML = '<p>No attempts recorded yet. Be the first to complete a test!</p>';
          pageInfo.textContent = 'Page 1 of 1';
          return;
        }

        allAttempts = Object.entries(attempts).map(([id, attempt]) => ({
          id,
          ...attempt
        }));
        
        sortAttempts(currentSortColumn, currentSortDirection);
        updateTestNameFilter(allAttempts);
        updateUserFilter(allAttempts);
        
        filteredAttempts = allAttempts.filter(attempt => {
          const nameMatch = testNameFilter.value === 'all' || attempt.testTitle === testNameFilter.value;
          const categoryMatch = category === 'all' || attempt.category === category;
          const userMatch = userName === 'all' || attempt.userName === userName;
          return nameMatch && categoryMatch && userMatch;
        });
          
        updatePagination();
      })
      .catch(error => {
        console.error('Error loading leaderboard:', error);
        leaderboardList.innerHTML = '<p>Error loading leaderboard. Please try again later.</p>';
        pageInfo.textContent = 'Page 1 of 1';
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
          : bValue.localeCompare(aValue);
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

  function updateUserFilter(attempts) {
    uniqueUserNames = new Set(attempts.map(attempt => attempt.userName));
    const currentUserFilter = userFilter.value;
    
    userFilter.innerHTML = '<option value="all">All Users</option>';
    uniqueUserNames.forEach(userName => {
      const option = document.createElement('option');
      option.value = userName;
      option.textContent = userName;
      userFilter.appendChild(option);
    });
    
    if (currentUserFilter !== 'all' && uniqueUserNames.has(currentUserFilter)) {
      userFilter.value = currentUserFilter;
    } else {
      userFilter.value = 'all';
    }
  }

  function updatePagination() {
    const totalPages = Math.ceil(filteredAttempts.length / entriesPerPage) || 1;
    const startIdx = (currentPage - 1) * entriesPerPage;
    const endIdx = startIdx + entriesPerPage;
    const pageAttempts = filteredAttempts.slice(startIdx, endIdx);
    
    firstPageBtn.disabled = currentPage === 1;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    lastPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    
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

    attempts.forEach((attempt, index) => {
      const date = new Date(attempt.timestamp);
      const accuracyClass = 
        attempt.stats.accuracy >= 90 ? 'accuracy-high' :
        attempt.stats.accuracy >= 70 ? 'accuracy-medium' : 'accuracy-low';
      
      const minutes = Math.floor(attempt.stats.timeTaken / 60);
      const seconds = attempt.stats.timeTaken % 60;
      const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      // Add badges to top 3
      let badge = '';
      if (startRank + index === 1) {
        badge = '<span class="badge badge-gold">🥇</span>';
      } else if (startRank + index === 2) {
        badge = '<span class="badge badge-silver">🥈</span>';
      } else if (startRank + index === 3) {
        badge = '<span class="badge badge-bronze">🥉</span>';
      }

      tableHTML += `
        <tr>
          <td>${startRank + index} ${badge}</td>
          <td class="leaderboard-user">
            <img src="${attempt.userPhoto}" alt="${attempt.userName}">
            <span>${attempt.userName}</span>
          </td>
          <td>${attempt.testTitle || 'Custom Test'} ${attempt.category ? `<span class="category-badge category-${attempt.category}">${getCategoryName(attempt.category)}</span>` : ''}</td>
          <td class="accuracy-cell ${accuracyClass}">${attempt.stats.accuracy.toFixed(1)}%</td>
          <td>${attempt.stats.wpm}</td>
          <td>${attempt.stats.totalOriginal}</td>
          <td>${attempt.stats.totalUser}</td>
          <td>${timeFormatted}</td>
          <td>${attempt.stats.halfMistakes}</td>
          <td>${attempt.stats.fullMistakes}</td>
          <td>${date.toLocaleDateString()}</td>
        </tr>
      `;
    });

    tableHTML += `</tbody></table>`;
    leaderboardList.innerHTML = tableHTML;
    
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

  function exportLeaderboardToCSV() {
    if (filteredAttempts.length === 0) {
      alert('No data to export');
      return;
    }
    
    let csv = 'Rank,User,Test,Category,Accuracy (%),Speed (WPM),Original Words,Typed Words,Time Taken,Half Mistakes,Full Mistakes,Date\n';
    
    filteredAttempts.forEach((attempt, index) => {
      const date = new Date(attempt.timestamp);
      const minutes = Math.floor(attempt.stats.timeTaken / 60);
      const seconds = attempt.stats.timeTaken % 60;
      const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      
      csv += `"${index + 1}","${attempt.userName}","${attempt.testTitle || 'Custom Test'}","${getCategoryName(attempt.category)}",` +
             `"${attempt.stats.accuracy.toFixed(1)}","${attempt.stats.wpm}","${attempt.stats.totalOriginal}",` +
             `"${attempt.stats.totalUser}","${timeFormatted}","${attempt.stats.halfMistakes}",` +
             `"${attempt.stats.fullMistakes}","${date.toLocaleDateString()}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `steno_leaderboard_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function toggleGraphView() {
    if (leaderboardGraph.classList.contains('hidden')) {
      renderLeaderboardGraph();
      leaderboardGraph.classList.remove('hidden');
      toggleGraphBtn.textContent = 'Hide Graph';
    } else {
      leaderboardGraph.classList.add('hidden');
      toggleGraphBtn.textContent = 'Show Graph View';
    }
  }

  function renderLeaderboardGraph() {
    if (chart) {
      chart.destroy();
    }
    
    // Prepare data for top 10 by accuracy
    const top10 = [...filteredAttempts]
      .sort((a, b) => b.stats.accuracy - a.stats.accuracy)
      .slice(0, 10);
    
    const ctx = document.createElement('canvas');
    leaderboardGraph.innerHTML = '';
    leaderboardGraph.appendChild(ctx);
    
    chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: top10.map(attempt => attempt.userName),
        datasets: [
          {
            label: 'Accuracy (%)',
            data: top10.map(attempt => attempt.stats.accuracy),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          },
          {
            label: 'Speed (WPM)',
            data: top10.map(attempt => attempt.stats.wpm),
            backgroundColor: 'rgba(255, 99, 132, 0.6)',
            borderColor: 'rgba(255, 99, 132, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true
          }
        },
        plugins: {
          title: {
            display: true,
            text: 'Top 10 Performers (Accuracy vs Speed)'
          }
        }
      }
    });
  }

  // Rest of your existing functions remain the same...
  // (compareTexts, displayComparison, displayStats, etc.)
});

// Dark mode toggle
document.getElementById('darkModeToggle').addEventListener('change', function() {
  document.body.classList.toggle('dark-mode');
  localStorage.setItem('darkMode', this.checked);
});

// Check for saved user preference
if (localStorage.getItem('darkMode') === 'true') {
  document.getElementById('darkModeToggle').checked = true;
  document.body.classList.add('dark-mode');
}
