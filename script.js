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

let isAdmin = false;

// DOM elements (shortened, will complete later)
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userPhoto = document.getElementById('userPhoto');
const userName = document.getElementById('userName');
const loginPrompt = document.getElementById('loginPrompt');
const customTestSection = document.getElementById('customTestSection');
const globalTestsSection = document.getElementById('globalTestsSection');
const leaderboardSection = document.getElementById('leaderboardSection');
const globalTestsList = document.getElementById('globalTestsList');
const leaderboardList = document.getElementById('leaderboardList');

// Auth State Listener
auth.onAuthStateChanged(user => {
  if (user) {
    isAdmin = (user.email === "anishkumar18034@gmail.com");
    if (isAdmin) {
      console.log("Admin logged in");
      document.body.classList.add("admin-user");
    }
    loginBtn.classList.add('hidden');
    userInfo.classList.remove('hidden');
    userPhoto.src = user.photoURL || 'https://www.gravatar.com/avatar/' + user.uid + '?d=identicon';
    userName.textContent = user.displayName || 'User';
    loginPrompt.classList.add('hidden');
    customTestSection.classList.remove('hidden');
    globalTestsSection.classList.remove('hidden');
    leaderboardSection.classList.remove('hidden');
    loadGlobalTests();
    loadLeaderboard();
  } else {
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
    loginPrompt.classList.remove('hidden');
    customTestSection.classList.add('hidden');
    globalTestsSection.classList.add('hidden');
    leaderboardSection.classList.add('hidden');
  }
});
function loadGlobalTests() {
  database.ref('tests').once('value')
    .then(snapshot => {
      globalTestsList.innerHTML = '';
      snapshot.forEach(childSnapshot => {
        const test = childSnapshot.val();
        const testId = childSnapshot.key;

        const card = document.createElement('div');
        card.className = 'test-card';
        card.dataset.category = test.category;
        card.dataset.id = testId;
        card.innerHTML = `
          <h4>${test.title}</h4>
          <p>Category: ${test.category}</p>
        `;

        if (isAdmin) {
          const deleteBtn = document.createElement('button');
          deleteBtn.textContent = "Delete Test";
          deleteBtn.classList.add('secondary-btn');
          deleteBtn.style.marginTop = "10px";
          deleteBtn.onclick = () => deleteTest(testId);
          card.appendChild(deleteBtn);
        }

        globalTestsList.appendChild(card);
      });
    })
    .catch(error => {
      console.error('Error loading tests:', error);
    });
}

function deleteTest(testId) {
  if (confirm('Are you sure you want to delete this test?')) {
    database.ref('tests/' + testId).remove()
      .then(() => {
        alert('Test deleted successfully.');
        loadGlobalTests();
      })
      .catch(error => {
        console.error('Error deleting test:', error);
      });
  }
}
function loadLeaderboard() {
  database.ref('attempts').once('value')
    .then(snapshot => {
      leaderboardList.innerHTML = '';
      if (!snapshot.exists()) {
        leaderboardList.innerHTML = '<p>No leaderboard data available.</p>';
        return;
      }

      let table = `
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>Test Title</th>
              <th>Accuracy</th>
              <th>Speed (WPM)</th>
              <th>Date</th>
              ${isAdmin ? '<th>Action</th>' : ''}
            </tr>
          </thead>
          <tbody>
      `;

      const attempts = [];
      snapshot.forEach(childSnapshot => {
        const attempt = childSnapshot.val();
        attempt.id = childSnapshot.key;
        attempts.push(attempt);
      });

      attempts.sort((a, b) => b.stats.accuracy - a.stats.accuracy);

      attempts.forEach((attempt, index) => {
        const date = new Date(attempt.timestamp).toLocaleDateString();
        table += `
          <tr>
            <td>${index + 1}</td>
            <td>${attempt.userName}</td>
            <td>${attempt.testTitle || 'Custom Test'}</td>
            <td>${attempt.stats.accuracy.toFixed(1)}%</td>
            <td>${attempt.stats.wpm}</td>
            <td>${date}</td>
            ${isAdmin ? `<td><button class="secondary-btn" onclick="deleteAttempt('${attempt.id}')">Delete</button></td>` : ''}
          </tr>
        `;
      });

      table += `
          </tbody>
        </table>
      `;

      leaderboardList.innerHTML = table;
    })
    .catch(error => {
      console.error('Error loading leaderboard:', error);
    });
}

function deleteAttempt(attemptId) {
  if (confirm('Are you sure you want to delete this leaderboard attempt?')) {
    database.ref('attempts/' + attemptId).remove()
      .then(() => {
        alert('Leaderboard attempt deleted successfully.');
        loadLeaderboard();
      })
      .catch(error => {
        console.error('Error deleting attempt:', error);
      });
  }
}
// Login with Google
loginBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(error => {
    console.error('Google login failed:', error);
    alert('Login failed: ' + error.message);
  });
});

// Logout
logoutBtn.addEventListener('click', () => {
  auth.signOut().catch(error => {
    console.error('Logout failed:', error);
  });
});

// Save Custom Test
const saveBtn = document.getElementById('saveTestBtn');
const customTitle = document.getElementById('customTitle');
const customOriginal = document.getElementById('customOriginal');
const customVideoUrl = document.getElementById('customVideoUrl');
const customCategory = document.getElementById('customCategory');

saveBtn.addEventListener('click', () => {
  const title = customTitle.value.trim();
  const originalText = customOriginal.value.trim();
  const videoUrl = customVideoUrl.value.trim();
  const category = customCategory.value;

  if (!title || !originalText) {
    alert('Please fill in both Title and Text.');
    return;
  }

  const newTest = {
    title,
    text: originalText,
    videoUrl,
    category,
    timestamp: Date.now()
  };

  database.ref('tests').push(newTest)
    .then(() => {
      alert('Test saved successfully!');
      customTitle.value = '';
      customOriginal.value = '';
      customVideoUrl.value = '';
      customCategory.value = 'general';
      loadGlobalTests();
    })
    .catch(error => {
      console.error('Error saving test:', error);
    });
});

// Clear My Tests (this deletes all your locally created tests)
const clearBtn = document.getElementById('clearTestsBtn');
clearBtn.addEventListener('click', () => {
  if (confirm('This will delete ALL your custom tests. Are you sure?')) {
    database.ref('tests').once('value').then(snapshot => {
      const updates = {};
      snapshot.forEach(child => {
        const test = child.val();
        if (test.userId === auth.currentUser.uid) {
          updates[child.key] = null;
        }
      });
      return database.ref('tests').update(updates);
    }).then(() => {
      alert('Your custom tests cleared!');
      loadGlobalTests();
    }).catch(error => {
      console.error('Error clearing tests:', error);
    });
  }
});
