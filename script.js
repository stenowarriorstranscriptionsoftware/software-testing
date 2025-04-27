// Initialize jsPDF
const { jsPDF } = window.jspdf;

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB5rvgi0KYB5N5waBSVZf7fvtl4sj3QRHc",
  authDomain: "swtypingsoftware.firebaseapp.com",
  databaseURL: "https://swtypingsoftware-default-rtdb.firebaseio.com",
  projectId: "swtypingsoftware",
  storageBucket: "swtypingsoftware.appspot.com",
  messagingSenderId: "416692712964",
  appId: "1:416692712964:web:3f557f7935ad02b4fba751",
  measurementId: "G-FWD5WNL48G"
};

// Verify Firebase initialization
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
} else {
  firebase.app(); // if already initialized, use that one
}

const database = firebase.database();

document.addEventListener('DOMContentLoaded', function() {
  // DOM elements
  const originalTextEl = document.getElementById('originalText');
  const startTypingBtn = document.getElementById('startTypingBtn');
  const showSampleTextBtn = document.getElementById('showSampleTextBtn');
  const loadSavedTestsBtn = document.getElementById('loadSavedTestsBtn');
  const submitTestBtn = document.getElementById('submitTestBtn');
  const clearResultsBtn = document.getElementById('clearResultsBtn');
  const downloadPdfBtn = document.getElementById('downloadPdfBtn');
  const typingSection = document.getElementById('typingSection');
  const resultsSection = document.getElementById('results');
  const textToTypeEl = document.getElementById('textToType');
  const typingAreaEl = document.getElementById('typingArea');
  const timerEl = document.getElementById('timer');
  const wpmDisplayEl = document.getElementById('wpmDisplay');
  const accuracyDisplayEl = document.getElementById('accuracyDisplay');
  const timeRemainingEl = document.getElementById('timeRemaining');
  const comparisonResultEl = document.getElementById('comparisonResult');
  const statsEl = document.getElementById('stats');
  const feedbackEl = document.getElementById('feedback');
  const resultDateEl = document.getElementById('resultDate');
  const timeOptions = document.querySelectorAll('.time-option');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const adminSection = document.getElementById('adminSection');
  const saveTestBtn = document.getElementById('saveTestBtn');
  const testNameEl = document.getElementById('testName');
  const adminTextEl = document.getElementById('adminText');
  const testSelectionModal = document.getElementById('testSelectionModal');
  const closeModalBtn = document.querySelector('.close-modal');
  const testList = document.getElementById('testList');

  // Typing session variables
  let startTime = null;
  let timerInterval = null;
  let countdownInterval = null;
  let selectedMinutes = 1;
  let originalWords = [];
  let correctChars = 0;
  let totalChars = 0;
  let errors = 0;
  
  // Sample texts
  const sampleTexts = [
    "The quick brown fox jumps over the lazy dog. This sentence contains all the letters in the English alphabet.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune.",
    "It was the best of times, it was the worst of times, it was the age of wisdom, it was the age of foolishness.",
    "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.",
    "In the middle of difficulty lies opportunity. The important thing is not to stop questioning. Curiosity has its own reason for existing."
  ];
  
  // Event listeners
  startTypingBtn.addEventListener('click', startTypingSession);
  showSampleTextBtn.addEventListener('click', loadSampleText);
  loadSavedTestsBtn.addEventListener('click', showSavedTests);
  submitTestBtn.addEventListener('click', submitTypingTest);
  clearResultsBtn.addEventListener('click', clearResults);
  downloadPdfBtn.addEventListener('click', downloadAsPdf);
  typingAreaEl.addEventListener('input', checkTypingProgress);
  loginBtn.addEventListener('click', signInWithGoogle);
  logoutBtn.addEventListener('click', signOut);
  saveTestBtn.addEventListener('click', saveTest);
  closeModalBtn.addEventListener('click', () => {
    testSelectionModal.classList.remove('show');
  });
  
  // Time selection buttons
  timeOptions.forEach(option => {
    option.addEventListener('click', function() {
      timeOptions.forEach(btn => btn.classList.remove('active'));
      this.classList.add('active');
      selectedMinutes = parseInt(this.dataset.minutes);
    });
  });
  
  // Set default time selection
  document.querySelector('.time-option[data-minutes="1"]').classList.add('active');
  
  // Auth state listener
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      // User is signed in
      loginBtn.classList.add('hidden');
      logoutBtn.classList.remove('hidden');
      loadSavedTestsBtn.classList.remove('hidden');
      
      // Check if admin (anishkumar18034@gmail.com)
      if (user.email === 'anishkumar18034@gmail.com') {
        adminSection.classList.remove('hidden');
      }
    } else {
      // User is signed out
      loginBtn.classList.remove('hidden');
      logoutBtn.classList.add('hidden');
      adminSection.classList.add('hidden');
      loadSavedTestsBtn.classList.add('hidden');
    }
  });

  // Google Sign-In
  function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)
      .then((result) => {
        console.log("Signed in as:", result.user.email);
      })
      .catch((error) => {
        console.error("Error signing in:", error);
        alert("Error signing in: " + error.message);
      });
  }

  // Sign Out
  function signOut() {
    firebase.auth().signOut()
      .then(() => {
        console.log("User signed out");
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  }

  // Save Test (Admin only)
  function saveTest() {
    const testName = testNameEl.value.trim();
    const testContent = adminTextEl.value.trim();
    
    if (!testName || !testContent) {
      alert('Please enter both test name and content');
      return;
    }
    
    const testsRef = database.ref('tests');
    const newTestRef = testsRef.push();
    
    saveTestBtn.innerHTML = '<span class="spinner"></span> Saving...';
    saveTestBtn.disabled = true;
    
    newTestRef.set({
      name: testName,
      content: testContent,
      createdBy: firebase.auth().currentUser.email,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    })
    .then(() => {
      alert('Test saved successfully!');
      testNameEl.value = '';
      adminTextEl.value = '';
    })
    .catch((error) => {
      console.error("Error saving test:", error);
      let errorMessage = "Error saving test";
      if (error.code === 'PERMISSION_DENIED') {
        errorMessage = "You don't have permission to save tests";
      }
      alert(errorMessage);
    })
    .finally(() => {
      saveTestBtn.innerHTML = 'Save Test';
      saveTestBtn.disabled = false;
    });
  }

  // Delete Test (Admin only)
  function deleteTest(testId) {
    if (!confirm('Are you sure you want to delete this test?')) {
      return;
    }
    
    const testRef = database.ref('tests/' + testId);
    testRef.remove()
      .then(() => {
        showSavedTests(); // Refresh the test list
      })
      .catch((error) => {
        console.error("Error deleting test:", error);
        alert("Error deleting test: " + error.message);
      });
  }

  // Show saved tests in modal with delete option
  function showSavedTests() {
    if (!firebase.auth().currentUser) {
      alert('Please login to view saved tests');
      return;
    }

    testSelectionModal.classList.add('show');
    testList.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading tests...</p></div>';
    
    const testsRef = database.ref('tests');
    testsRef.once('value')
      .then((snapshot) => {
        const tests = [];
        snapshot.forEach((childSnapshot) => {
          tests.push({
            id: childSnapshot.key,
            ...childSnapshot.val()
          });
        });
        
        if (tests.length === 0) {
          testList.innerHTML = '<p class="no-tests">No tests available yet.</p>';
          return;
        }
        
        testList.innerHTML = '';
        tests.forEach(test => {
          const testItem = document.createElement('div');
          testItem.className = 'test-item';
          
          const isAdmin = firebase.auth().currentUser && 
                         firebase.auth().currentUser.email === 'anishkumar18034@gmail.com';
          
          testItem.innerHTML = `
            <div class="test-info">
              <h3>${test.name}</h3>
              <p>Created by: ${test.createdBy}</p>
              <small>${new Date(test.createdAt).toLocaleString()}</small>
            </div>
            <div class="test-actions">
              <button class="load-test-btn">Load</button>
              ${isAdmin ? `<button class="delete-test-btn">Delete</button>` : ''}
            </div>
          `;
          
          // Add load test functionality
          testItem.querySelector('.load-test-btn').addEventListener('click', () => {
            originalTextEl.value = test.content;
            testSelectionModal.classList.remove('show');
            originalTextEl.focus();
          });
          
          // Add delete functionality for admin
          if (isAdmin) {
            testItem.querySelector('.delete-test-btn').addEventListener('click', (e) => {
              e.stopPropagation();
              deleteTest(test.id);
            });
          }
          
          testList.appendChild(testItem);
        });
      })
      .catch((error) => {
        console.error("Error loading tests:", error);
        testList.innerHTML = '<p class="error-message">Error loading tests. Please try again.</p>';
      })
      .finally(() => {
        loadSavedTestsBtn.innerHTML = 'Load Saved Tests';
        loadSavedTestsBtn.disabled = false;
      });
  }

  function startTypingSession() {
    const originalText = originalTextEl.value.trim();
    
    if (!originalText) {
      alert('Please enter or paste some text to practice typing.');
      return;
    }
    
    // Process text
    originalWords = processText(originalText);
    textToTypeEl.textContent = originalText;
    typingAreaEl.value = '';
    typingAreaEl.focus();
    
    // Reset stats
    startTime = new Date();
    correctChars = 0;
    totalChars = 0;
    errors = 0;
    
    // Start timer
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
    
    // Start countdown
    startCountdown(selectedMinutes * 60);
    
    // Show typing section
    document.querySelector('.input-section').classList.add('hidden');
    typingSection.classList.remove('hidden');
    resultsSection.classList.add('hidden');
    
    // Hide WPM and accuracy during typing (only show time left)
    wpmDisplayEl.style.display = 'none';
    accuracyDisplayEl.style.display = 'none';
  }
  
  function startCountdown(seconds) {
    let remaining = seconds;
    updateTimeRemaining(remaining);
    
    clearInterval(countdownInterval);
    countdownInterval = setInterval(() => {
      remaining--;
      updateTimeRemaining(remaining);
      
      if (remaining <= 0) {
        clearInterval(countdownInterval);
        submitTypingTest();
      }
    }, 1000);
  }
  
  function updateTimeRemaining(seconds) {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    timeRemainingEl.textContent = `Time left: ${mins}:${secs}`;
  }
  
  function loadSampleText() {
    const randomIndex = Math.floor(Math.random() * sampleTexts.length);
    originalTextEl.value = sampleTexts[randomIndex];
  }
  
  function submitTypingTest() {
    clearInterval(countdownInterval);
    
    const userText = typingAreaEl.value;
    const originalText = originalTextEl.value;
    
    if (!userText) {
      alert('You haven\'t typed anything yet!');
      return;
    }
    
    // Process texts
    const userWords = processText(userText);
    
    // Compare words - this will now calculate word-based accuracy
    const comparison = compareParagraphs(originalWords, userWords);
    
    // Display results
    displayComparison(comparison);
    displayStats(comparison.stats);
    displayFeedback(comparison.stats, originalWords, userWords);
    
    // Set current date and time
    const now = new Date();
    resultDateEl.textContent = now.toLocaleString();
    
    // Show results section
    typingSection.classList.add('hidden');
    resultsSection.classList.remove('hidden');
    
    // Show WPM in results (accuracy is shown in stats)
    wpmDisplayEl.style.display = '';
  }
  
  function clearResults() {
    location.reload();
  }
  
  function checkTypingProgress() {
    // We don't need character-based accuracy anymore
    // Just update the timer and WPM
    updateRealTimeStats();
  }
  
  function updateRealTimeStats() {
    if (!startTime) return;
    
    const timeElapsed = (new Date() - startTime) / 1000 / 60;
    const wordsTyped = typingAreaEl.value.split(/\s+/).filter(word => word.length > 0).length;
    const wpm = timeElapsed > 0 ? Math.round(wordsTyped / timeElapsed) : 0;
    
    wpmDisplayEl.textContent = `${wpm} WPM`;
    // Remove accuracy display during typing since we can't calculate it in real-time
    accuracyDisplayEl.style.display = 'none';
  }
  
  function updateTimer() {
    if (!startTime) return;
    
    const timeElapsed = Math.floor((new Date() - startTime) / 1000);
    const minutes = Math.floor(timeElapsed / 60).toString().padStart(2, '0');
    const seconds = (timeElapsed % 60).toString().padStart(2, '0');
    
    timerEl.textContent = `${minutes}:${seconds}`;
  }
  
  function downloadAsPdf() {
    const resultsElement = document.getElementById('results');
    
    html2canvas(resultsElement).then(canvas => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save('typing-results.pdf');
    });
  }
  
  function processText(text) {
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/[\u2018\u2019]/g, "'")
      .trim()
      .split(/\s+/);
  }
  
  function compareParagraphs(paragraphA, paragraphB) {
    let comparedText = '';
    let numHalfDiff = 0;
    let numFullDiff = 0;
    let wordAIndex = 0;
    let wordBIndex = 0;
    let correctWords = 0; // Track correct words count

    while (wordAIndex < paragraphA.length || wordBIndex < paragraphB.length) {
      const wordA = paragraphA[wordAIndex] || '';
      const wordB = paragraphB[wordBIndex] || '';
      const cleanWordA = wordA.replace(/[,\?\-\s]/g, '');
      const cleanWordB = wordB.replace(/[,\?\-\s]/g, '');

      if (cleanWordA === cleanWordB) {
        comparedText += `<span class="correct">${wordA}</span> `;
        wordAIndex++;
        wordBIndex++;
        correctWords++; // Count as correct word
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
                  numFullDiff++;
                }
                comparedText += `<span class="correct">${pairB.join(' ')}</span> `;
                wordAIndex += i + pairB.length;
                wordBIndex += pairB.length;
                foundPairInA = true;
                break;
              }
            }

            if (!foundPairInA) {
              let foundPairInB = false;
              for (let i = 1; i <= 50 && (wordBIndex + i) < paragraphB.length; i++) {
                const subarrayB = paragraphB.slice(wordBIndex + i, wordBIndex + i + pairA.length);
                if (arraysAreEqual(subarrayB, pairA)) {
                  for (let j = 0; j < i; j++) {
                    comparedText += `<span class="addition">${paragraphB[wordBIndex + j]}</span> `;
                    numFullDiff++;
                  }
                  comparedText += `<span class="correct">${pairA.join(' ')}</span> `;
                  wordAIndex += pairA.length;
                  wordBIndex += i + pairA.length;
                  foundPairInB = true;
                  break;
                }
              }

              if (!foundPairInB) {
                comparedText += `<span class="missing">${wordA}</span> `;
                comparedText += `<span class="addition">${wordB}</span> `;
                wordAIndex++;
                wordBIndex++;
                numFullDiff++;
              }
            }
          }
        }
      }
    }

    // Calculate statistics
    const keystrokesCount = typingAreaEl.value.length;
    const totalWordsTyped = paragraphB.length; // Total words in user's text
    const accuracyPercentage = totalWordsTyped > 0 ? 
        Math.round((correctWords / totalWordsTyped) * 100) : 0;
    
    // Calculate WPM
    const endTime = new Date();
    const typingTimeSeconds = startTime ? (endTime - startTime) / 1000 : 60;
    const typingTimeMinutes = typingTimeSeconds / 60;
    const wpm = typingTimeMinutes > 0 ? Math.round(totalWordsTyped / typingTimeMinutes) : 0;

    return {
      html: comparedText,
      stats: {
        totalOriginal: paragraphA.length,
        totalUser: totalWordsTyped,
        correctWords: correctWords,
        halfMistakes: numHalfDiff,
        fullMistakes: numFullDiff,
        keystrokes: keystrokesCount,
        wpm: wpm,
        accuracy: accuracyPercentage,
        errorRate: 100 - accuracyPercentage
      }
    };
  }
  
  function isSimilar(wordA, wordB) {
    const minLength = Math.min(wordA.length, wordB.length);
    const maxLength = Math.max(wordA.length, wordB.length);
    let similarCount = 0;
    const threshold = 50;
    
    for (let i = 0; i < minLength; i++) {
      if (wordA[i] === wordB[i]) {
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
  
  function displayComparison(comparison) {
    comparisonResultEl.innerHTML = comparison.html;
  }
  
  function displayStats(stats) {
    statsEl.innerHTML = `
      <div class="stat-item">
        <h4>Original Words</h4>
        <p>${stats.totalOriginal}</p>
      </div>
      <div class="stat-item">
        <h4>Your Words</h4>
        <p>${stats.totalUser}</p>
      </div>
      <div class="stat-item">
        <h4>Correct Words</h4>
        <p>${stats.correctWords}</p>
      </div>
      <div class="stat-item">
        <h4>Half Mistakes</h4>
        <p>${stats.halfMistakes}</p>
      </div>
      <div class="stat-item">
        <h4>Full Mistakes</h4>
        <p>${stats.fullMistakes}</p>
      </div>
      <div class="stat-item">
        <h4>Typing Speed (WPM)</h4>
        <p>${stats.wpm}</p>
      </div>
      <div class="stat-item">
        <h4>Accuracy</h4>
        <p>${stats.accuracy}%</p>
      </div>
    `;
  }
  
  function displayFeedback(stats, originalWords, userWords) {
    const analysis = analyzeMistakes(originalWords, userWords);
    
    let feedback = `
      <h4>Overall Assessment</h4>
      ${getOverallAssessment(stats.accuracy, stats.wpm)}
      
      <h4>Mistake Analysis</h4>
      <ul>
        ${analysis.commonMistakes.map(m => `<li>${m}</li>`).join('')}
      </ul>
      
      <h4>Improvement Suggestions</h4>
      <ul>
        ${getImprovementSuggestions(analysis, stats)}
      </ul>
    `;
    
    feedbackEl.innerHTML = feedback;
  }
  
  function analyzeMistakes(originalText, userText) {
    const analysis = {
      commonMistakes: [],
      omissionRate: 0,
      additionRate: 0,
      spellingErrorRate: 0,
      capitalizationErrorRate: 0,
      mostErrorProneWords: []
    };
    
    const wordPairs = [];
    const minLength = Math.min(originalText.length, userText.length);
    
    for (let i = 0; i < minLength; i++) {
      const origWord = originalText[i].toLowerCase();
      const userWord = userText[i].toLowerCase();
      
      if (origWord !== userWord) {
        wordPairs.push({ original: originalText[i], user: userText[i] });
      }
    }
    
    let omissionCount = 0;
    let additionCount = 0;
    let spellingCount = 0;
    let capitalizationCount = 0;
    const errorWords = [];
    
    wordPairs.forEach(pair => {
      const orig = pair.original.toLowerCase();
      const user = pair.user.toLowerCase();
      
      if (user === '') {
        omissionCount++;
      } else if (orig === '') {
        additionCount++;
      } else if (orig === user) {
        capitalizationCount++;
        errorWords.push(pair.original);
      } else if (isSimilar(orig, user)) {
        spellingCount++;
        errorWords.push(pair.original);
      } else {
        errorWords.push(pair.original);
      }
    });
    
    analysis.omissionRate = omissionCount / originalText.length;
    analysis.additionRate = additionCount / originalText.length;
    analysis.spellingErrorRate = spellingCount / originalText.length;
    analysis.capitalizationErrorRate = capitalizationCount / originalText.length;
    
    const wordFrequency = {};
    errorWords.forEach(word => {
      const lowerWord = word.toLowerCase();
      wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
    });
    
    analysis.mostErrorProneWords = Object.entries(wordFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    if (capitalizationCount > 0) {
      analysis.commonMistakes.push(`Capitalization errors (${capitalizationCount} instances)`);
    }
    if (spellingCount > 0) {
      analysis.commonMistakes.push(`Spelling mistakes (${spellingCount} instances)`);
    }
    if (omissionCount > 0) {
      analysis.commonMistakes.push(`Omitted words (${omissionCount} instances)`);
    }
    if (additionCount > 0) {
      analysis.commonMistakes.push(`Added extra words (${additionCount} instances)`);
    }
    
    return analysis;
  }
  
  function getOverallAssessment(accuracy, wpm) {
    let assessment = '';
    
    if (accuracy >= 95) {
      assessment += '<p>🌟 <strong>Excellent accuracy!</strong> Your typing is nearly perfect.</p>';
    } else if (accuracy >= 85) {
      assessment += '<p>👍 <strong>Good accuracy.</strong> With a little more practice, you can reach excellence.</p>';
    } else if (accuracy >= 70) {
      assessment += '<p>📝 <strong>Fair accuracy.</strong> Focus on reducing errors to improve your score.</p>';
    } else {
      assessment += '<p>⚠️ <strong>Needs improvement.</strong> Work on accuracy before increasing speed.</p>';
    }
    
    if (wpm >= 50) {
      assessment += '<p>⚡ <strong>Fast typer!</strong> Your speed is impressive. ';
      if (accuracy < 90) {
        assessment += 'Try slowing down slightly to improve accuracy.</p>';
      } else {
        assessment += 'Maintain this speed while keeping accuracy high.</p>';
      }
    } else if (wpm >= 40) {
      assessment += '<p>🏃 <strong>Moderate speed.</strong> You\'re typing at a good pace. ';
      assessment += 'With practice, you can increase speed without sacrificing accuracy.</p>';
    } else {
      assessment += '<p>🐢 <strong>Slow pace.</strong> Focus on building muscle memory and gradually increasing your speed.</p>';
    }
    
    return assessment;
  }
  
  function getImprovementSuggestions(analysis, stats) {
    let suggestions = [];
    
    if (analysis.omissionRate > 0.2) {
      suggestions.push('You\'re skipping many words. Practice reading ahead to anticipate upcoming words.');
    }
    
    if (analysis.additionRate > 0.15) {
      suggestions.push('You\'re adding extra words. Focus on typing only what you see.');
    }
    
    if (analysis.spellingErrorRate > 0.25) {
      suggestions.push('Spelling mistakes are frequent. Consider practicing difficult words separately.');
    }
    
    if (analysis.capitalizationErrorRate > 0.1) {
      suggestions.push('Watch your capitalization. Remember proper nouns and sentence starts need capitals.');
    }
    
    suggestions.push('Practice difficult sections repeatedly until you master them.');
    suggestions.push('Focus on accuracy before speed - speed will come naturally with practice.');
    suggestions.push('Take regular breaks to avoid fatigue and maintain focus.');
    
    return suggestions.map(s => `<li>${s}</li>`).join('');
  }
});
