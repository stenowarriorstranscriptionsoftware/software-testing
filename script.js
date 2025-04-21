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
  const mainSection = document.getElementById('mainSection');
  const homeLink = document.getElementById('homeLink');
  const testsLink = document.getElementById('testsLink');
  const leaderboardLink = document.getElementById('leaderboardLink');
  const testSearchInput = document.getElementById('testSearchInput');
  const searchTestsBtn = document.getElementById('searchTestsBtn');
  const customTimerMinutes = document.getElementById('customTimerMinutes');
  const startCustomTimer = document.getElementById('startCustomTimer');

  // Timer variables
  let timerInterval;
  let endTime;
  let testActive = false;
  let timerButtons = document.querySelectorAll('.timer-option');
  let startTime = null;

  // Leaderboard variables
  let currentPage = 1;
  const entriesPerPage = 10;
  let allAttempts = [];
  let filteredAttempts = [];
  let uniqueTestNames = new Set();
  let currentSortColumn = 'accuracy';
  let currentSortDirection = 'desc';

  // Initialize the app
  initNavigation();
  initAuth();
  initTimer();
  initSearch();

  function initNavigation() {
    homeLink.addEventListener('click', () => showSection(mainSection));
    testsLink.addEventListener('click', () => {
      showSection(globalTestsSection);
      loadGlobalTests();
    });
    leaderboardLink.addEventListener('click', () => {
      showSection(leaderboardSection);
      loadLeaderboard();
    });
  }

  function showSection(section) {
    [mainSection, globalTestsSection, leaderboardSection, resultsSection, fullTextSection].forEach(sec => {
      sec.classList.add('hidden');
    });
    section.classList.remove('hidden');

    document.querySelectorAll('.nav-link').forEach(link => {
      link.classList.remove('active');
    });

    if (section === mainSection) homeLink.classList.add('active');
    if (section === globalTestsSection) testsLink.classList.add('active');
    if (section === leaderboardSection) leaderboardLink.classList.add('active');
  }

  function initAuth() {
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

    googleLoginBtn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
        .catch(error => {
          console.error('Google login error:', error);
          alert('Google login failed. Please try again.');
        });
    });

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

        database.ref(`users/${user.uid}`).once('value').then(snapshot => {
          if (!snapshot.exists()) {
            database.ref(`users/${user.uid}`).set({
              name: user.displayName,
              photoURL: user.photoURL,
              stats: {
                testsCompleted: 0,
                bestAccuracy: 0,
                bestWPM: 0,
                totalKeystrokes: 0
              },
              achievements: [],
              testHistory: {},
              customCategories: {}
            });
          }
        });
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

    logoutBtn.addEventListener('click', () => {
      auth.signOut();
    });
  }

  function initTimer() {
    userTextEl.addEventListener('input', function() {
      if (!startTime) {
        startTime = new Date();
      }
    });

    timerButtons.forEach(button => {
      button.addEventListener('click', function() {
        const minutes = parseInt(this.dataset.minutes);
        startTimer(minutes);
        timerOptions.classList.add('hidden');
        timerDisplay.classList.remove('hidden');
        testActive = true;
      });
    });

    startCustomTimer.addEventListener('click', () => {
      const minutes = parseInt(customTimerMinutes.value);
      if (minutes > 0) {
        startTimer(minutes);
        timerOptions.classList.add('hidden');
        timerDisplay.classList.remove('hidden');
        testActive = true;
      }
    });
  }

  function initSearch() {
    searchTestsBtn.addEventListener('click', () => loadGlobalTests(testSearchInput.value));
    testSearchInput.addEventListener('keyup', (e) => {
      if (e.key === 'Enter') loadGlobalTests(testSearchInput.value);
    });
  }

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

  function updatePagination() {
    const totalPages = Math.ceil(filteredAttempts.length / entriesPerPage);
    const startIdx = (currentPage - 1) * entriesPerPage;
    const endIdx = startIdx + entriesPerPage;
    const pageAttempts = filteredAttempts.slice(startIdx, endIdx);

    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;

    leaderboardPagination.innerHTML = `Showing ${startIdx + 1}-${Math.min(endIdx, filteredAttempts.length)} of ${filteredAttempts.length} entries`;

    renderLeaderboardTable(pageAttempts, startIdx + 1);

    prevPageBtn.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        updatePagination();
      }
    });

    nextPageBtn.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        updatePagination();
      }
    });
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

        sortAttempts(currentSortColumn, currentSortDirection);
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

  setInterval(cleanupOldData, 7 * 24 * 60 * 60 * 1000);

  function loadGlobalTests(searchTerm = '') {
    globalTestsList.innerHTML = '<div class="loader"></div>';

    const category = testCategoryFilter.value;

    database.ref('tests').orderByChild('timestamp').once('value')
      .then(snapshot => {
        const tests = snapshot.val();
        if (!tests) {
          globalTestsList.innerHTML = '<p>No community tests yet. Be the first to share one!</p>';
          return;
        }

        const testsArray = Object.entries(tests).map(([id, test]) => ({
          id,
          ...test
        }));

        const filteredTests = testsArray
          .filter(test => {
            const matchesCategory = category === 'all' || test.category === category;
            const matchesSearch = searchTerm === '' ||
              test.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
              test.text.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
          })
          .sort((a, b) => b.timestamp - a.timestamp);

        renderTestCards(filteredTests);

        testCategoryFilter.addEventListener('change', () => {
          loadGlobalTests(searchTerm);
        });
      })
      .catch(error => {
        console.error('Error loading tests:', error);
        globalTestsList.innerHTML = '<p>Error loading community tests. Please try again later.</p>';
      });
  }

  function renderTestCards(tests) {
    globalTestsList.innerHTML = '';

    if (tests.length === 0) {
      globalTestsList.innerHTML = '<p>No tests found matching your criteria.</p>';
      return;
    }

    const recentTests = tests.slice(0, 6);

    recentTests.forEach(test => {
      const testCard = document.createElement('div');
      testCard.className = 'test-card';
      testCard.dataset.category = test.category;
      testCard.innerHTML = `
        <h4>${test.title} <span class="category-badge category-${test.category}">${getCategoryName(test.category)}</span></h4>
        <p>${test.text.substring(0, 100)}${test.text.length > 100 ? '...' : ''}</p>
        ${test.videoUrl ? '<div class="video-indicator"><svg viewBox="0 0 24 24"><path d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"></path></svg> Includes Video</div>' : ''}
        <div class="test-author">
          <img src="${test.userPhoto}" alt="${test.userName}">
          <span>Added by ${test.userName}</span>
        </div>
      `;
      testCard.addEventListener('click', () => {
        document.querySelectorAll('.test-card').forEach(card => {
          card.classList.remove('selected');
        });
        testCard.classList.add('selected');

        originalTextEl.value = test.text;
        showSection(mainSection);
        originalTextGroup.classList.add('hidden');
        timerOptions.classList.remove('hidden');
        timerButtons.forEach(btn => {
          btn.disabled = false;
          btn.style.opacity = '1';
        });

        if (test.videoUrl) {
          embedVideo(test.videoUrl);
        } else {
          const existingVideo = document.getElementById('testVideoPlayer');
          if (existingVideo) existingVideo.remove();
        }
      });
      globalTestsList.appendChild(testCard);
    });

    if (tests.length > 6) {
      const showMoreBtn = document.createElement('button');
      showMoreBtn.className = 'secondary-btn';
      showMoreBtn.textContent = 'Show More Tests';
      showMoreBtn.style.marginTop = '1rem';
      showMoreBtn.addEventListener('click', () => {
        globalTestsList.innerHTML = '';
        tests.forEach(test => {
          const testCard = document.createElement('div');
          testCard.className = 'test-card';
          testCard.dataset.category = test.category;
          testCard.innerHTML = `
            <h4>${test.title} <span class="category-badge category-${test.category}">${getCategoryName(test.category)}</span></h4>
            <p>${test.text.substring(0, 100)}${test.text.length > 100 ? '...' : ''}</p>
            ${test.videoUrl ? '<div class="video-indicator"><svg viewBox="0 0 24 24"><path d="M10,16.5V7.5L16,12M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"></path></svg> Includes Video</div>' : ''}
            <div class="test-author">
              <img src="${test.userPhoto}" alt="${test.userName}">
              <span>Added by ${test.userName}</span>
            </div>
          `;
          testCard.addEventListener('click', () => {
            document.querySelectorAll('.test-card').forEach(card => {
              card.classList.remove('selected');
            });
            testCard.classList.add('selected');
            originalTextEl.value = test.text;
            showSection(mainSection);
            originalTextGroup.classList.add('hidden');
            timerOptions.classList.remove('hidden');
            timerButtons.forEach(btn => {
              btn.disabled = false;
              btn.style.opacity = '1';
            });

            if (test.videoUrl) {
              embedVideo(test.videoUrl);
            } else {
              const existingVideo = document.getElementById('testVideoPlayer');
              if (existingVideo) existingVideo.remove();
            }
          });
          globalTestsList.appendChild(testCard);
        });

        showMoreBtn.textContent = 'Show Less';
        showMoreBtn.onclick = () => {
          loadGlobalTests();
        };
      });
      globalTestsList.parentNode.appendChild(showMoreBtn);
    }
  }

  function getCategoryName(category) {
    const categories = {
      'general': 'General Matter',
      'kailash': 'Kailash Chandra',
      'progressive': 'Progressive',
      'legal': 'Legal',
      'previous': 'Previous Year'
    };
    return categories[category] || 'General';
  }

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

  compareBtn.addEventListener('click', function() {
    stopTimer();
    compareTexts();
    disableTimerOptions();
  });

  showFullTextBtn.addEventListener('click', showFullTexts);

  backToResultsBtn.addEventListener('click', showResults);

  downloadPdfBtn.addEventListener('click', downloadAsPdf);

  closeResultsBtn.addEventListener('click', function() {
    const existingVideo = document.getElementById('testVideoPlayer');
    if (existingVideo) existingVideo.remove();
    location.reload();
  });

  saveBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) {
      alert('Please login to save tests.');
      return;
    }

    const title = customTitle.value.trim();
    const text = customOriginal.value.trim();
    const videoUrl = customVideoUrl.value.trim();
    const category = customCategory.value;

    if (!title || !text) {
      alert('Please enter both a title and the original text.');
      return;
    }

    const testData = {
      title,
      text,
      videoUrl: videoUrl || null,
      userName: user.displayName,
      userPhoto: user.photoURL,
      category,
      timestamp: firebase.database.ServerValue.TIMESTAMP
    };

    database.ref('tests').push(testData)
      .then(() => {
        alert('Test saved and shared with the community!');
        customTitle.value = '';
        customOriginal.value = '';
        customVideoUrl.value = '';
        loadGlobalTests();
      })
      .catch(error => {
        console.error('Error saving test:', error);
        alert('Failed to save test. Please try again.');
      });
  });

  clearBtn.addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;

    database.ref('tests').orderByChild('userName').equalTo(user.displayName).once('value')
      .then(snapshot => {
        const userTests = snapshot.val();
        if (!userTests || Object.keys(userTests).length === 0) {
          alert('You have no tests to delete.');
          return;
        }

        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
          <div class="modal-content">
            <h3>Select Tests to Delete</h3>
            <div class="test-selection"></div>
            <div class="modal-buttons">
              <button id="cancelDelete" class="secondary-btn">Cancel</button>
              <button id="confirmDelete" class="danger-btn">Delete Selected</button>
            </div>
          </div>
        `;

        document.body.appendChild(modal);

        const testSelection = modal.querySelector('.test-selection');
        const checkboxes = [];

        Object.entries(userTests).forEach(([id, test]) => {
          const testItem = document.createElement('div');
          testItem.className = 'test-item';
          const checkboxId = `test-${id}`;
          testItem.innerHTML = `
            <input type="checkbox" id="${checkboxId}" checked>
            <label for="${checkboxId}">${test.title} <span class="category-badge category-${test.category}">${getCategoryName(test.category)}</span></label>
          `;
          testSelection.appendChild(testItem);
          checkboxes.push({id, checkbox: testItem.querySelector('input')});
        });

        modal.querySelector('#cancelDelete').addEventListener('click', () => {
          document.body.removeChild(modal);
        });

        modal.querySelector('#confirmDelete').addEventListener('click', () => {
          const selectedTests = checkboxes
            .filter(item => item.checkbox.checked)
            .map(item => item.id);

          if (selectedTests.length === 0) {
            alert('Please select at least one test to delete.');
            return;
          }

          const updates = {};
          selectedTests.forEach(id => {
            updates[id] = null;
          });

          database.ref('tests').update(updates)
            .then(() => {
              alert(`${selectedTests.length} test(s) deleted successfully.`);
              document.body.removeChild(modal);
              loadGlobalTests();
            })
            .catch(error => {
              console.error('Error deleting tests:', error);
              alert('Failed to delete tests. Please try again.');
            });
        });
      })
      .catch(error => {
        console.error('Error fetching user tests:', error);
        alert('Failed to fetch your tests. Please try again.');
      });
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

      const testRef = database.ref(`users/${user.uid}`);

      const newTestRef = testRef.child(`testHistory`).push();
      newTestRef.set({
        date: Date.now(),
        testTitle: testTitle,
        accuracy: comparison.stats.accuracy,
        wpm: comparison.stats.wpm
      });

      testRef.child('stats').transaction(stats => {
        if (!stats) {
          stats = { testsCompleted: 0, bestAccuracy: 0, bestWPM: 0, totalKeystrokes: 0 };
        }

        stats.testsCompleted = (stats.testsCompleted || 0) + 1;
        stats.bestAccuracy = Math.max(stats.bestAccuracy || 0, comparison.stats.accuracy);
        stats.bestWPM = Math.max(stats.bestWPM || 0, comparison.stats.wpm);
        stats.totalKeystrokes = (stats.totalKeystrokes || 0) + comparison.stats.keystrokes;

        const achievements = [];
        if (comparison.stats.wpm >= 50 && !stats.achievements?.includes('fast-typer')) {
          achievements.push('fast-typer');
        }
        if (comparison.stats.accuracy >= 95 && !stats.achievements?.includes('accuracy-master')) {
          achievements.push('accuracy-master');
        }
        if (stats.testsCompleted >= 100 && !stats.achievements?.includes('veteran')) {
          achievements.push('veteran');
        }

        if (achievements.length > 0) {
          testRef.child('achievements').transaction(ach => {
            ach = ach || [];
            return [...new Set([...ach, ...achievements])];
          });
        }

        return stats;
      });
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
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save('transcription-comparison.pdf');
    });
  }

  function processText(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[\u2018\u2019]/g, "'")
      .trim()
      .split(/\s+/);
  }

  function isSimilar(wordA, wordB) {
    const minLength = Math.min(wordA.length, wordB.length);
    const maxLength = Math.max(wordA.length, wordB.length);
    let similarCount = 0;
    const threshold = 50;

    for (let i = 0; i < minLength; i++) {
 LOCKED      if (wordA[i] === wordB[i]) {
        similarCount++;
      }
    }

    const similarityPercentage = (similarCount / maxLength) * 100;
    return similarityPercentage >= threshold;
  }

  function arraysAreEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) return false;
    }
    return true;
  }

  function compareParagraphs(paragraphA, paragraphB) {
    let comparedText = '';
    let numHalfDiff = 0;
    let numFullDiff = 0;
    let wordAIndex = 0;
    let wordBIndex = 0;

    while (wordAIndex < paragraphA.length || wordBIndex < paragraphB.length) {
      const wordA = paragraphA[wordAIndex] || '';
      const wordB = paragraphB[wordBIndex] || '';
      const cleanWordA = wordA.replace(/[,\?\-\s]/g, '');
      const cleanWordB = wordB.replace(/[,\?\-\s]/g, '');

      if (cleanWordA === cleanWordB) {
        comparedText += `<span class="correct">${wordA}</span> `;
        wordAIndex++;
        wordBIndex++;
      } else if (cleanWordA.toLowerCase() === cleanWordB.toLowerCase()) {
        comparedText += `<span class="capitalization">${wordA}</span> `;
        comparedText += `<span class="capitalization-strike">${wordB}</span> `;
        wordAIndex++;
        wordBIndex++;
        numHalfDiff++;
      } else {
        if (!wordA) {
          comparedText += `<span class="addition">${wordB}</span> `;
          wordBIndex++;
          numFullDiff++;
        } else if (!wordB) {
          comparedText += `<span class="missing">${wordA}</span> `;
          wordAIndex++;
          numFullDiff++;
        } else {
          if (wordA === paragraphB[wordBIndex]) {
            comparedText += `<span class="spelling">${wordA}</span> `;
            wordAIndex++;
            wordBIndex++;
          } else if (wordB === paragraphA[wordAIndex]) {
            comparedText += `<span class="spelling-strike">${wordB}</span> `;
            wordAIndex++;
            wordBIndex++;
          } else if (isSimilar(wordA, wordB)) {
            comparedText += `<span class="spelling">${wordA}</span> `;
            comparedText += `<span class="spelling-strike">${wordB}</span> `;
            wordAIndex++;
            wordBIndex++;
            numHalfDiff++;
          } else {
            const pairA = [wordA];
            const pairB = [wordB];

            for (let i = 1; i < 5 && (wordBIndex + i) < paragraphB.length; i++) {
              pairB.push(paragraphB[wordBIndex + i]);
            }

            for (let i = 1; i < 5 && (wordAIndex + i) < paragraphA.length; i++) {
              pairA.push(paragraphA[wordAIndex + i]);
            }

            let foundPairInA = false;
            for (let i = 1; i <= 50 && (wordAIndex + i) < paragraphA.length; i++) {
              const subarrayA = paragraphA.slice(wordAIndex + i, wordAIndex + i + pairB.length);
              if (arraysAreEqual(subarrayA, pairB)) {
                for (let j = 0; j < i; j++) {
                  comparedText += `<span class="missing">${paragraphA[wordAIndex + j]}</span> `;
 among others.
