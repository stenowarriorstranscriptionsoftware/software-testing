// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBjY-pE5jxQJgKqDZrcE7Im66_5r-X_mRA",
  authDomain: "setup-login-page.firebaseapp.com",
  databaseURL: "https://setup-login-page-default-rtdb.firebaseio.com",
  projectId: "setup-login-page",
  storageBucket: "setup-login-page.appspot.com",
  messagingSenderId: "341251531099",
  appId: "1:341251531099:web:f4263621455541ffdc3a7e",
  measurementId: "G-ZXFC7NR9HV"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const database = firebase.database();

// Initialize jsPDF
const { jsPDF } = window.jspdf;

// DOM elements
const originalTextEl = document.getElementById('originalText');
const userTextEl = document.getElementById('userText');
const compareBtn = document.getElementById('compareBtn');
const showFullTextBtn = document.getElementById('showFullTextBtn');
const backToResultsBtn = document.getElementById('backToResultsBtn');
const downloadPdfBtn = document.getElementById('downloadPdfBtn');
const resultsSection = document.getElementById('results');
const fullTextSection = document.getElementById('fullTextSection');
const comparisonResultEl = document.getElementById('comparisonResult');
const statsEl = document.getElementById('stats');
const feedbackEl = document.getElementById('feedback');
const originalDisplayEl = document.getElementById('originalDisplay');
const userDisplayEl = document.getElementById('userDisplay');
const resultDateEl = document.getElementById('resultDate');
const loginBtn = document.getElementById('loginBtn');
const logoutBtn = document.getElementById('logoutBtn');
const userInfo = document.getElementById('userInfo');
const userName = document.getElementById('userName');
const adminPanel = document.getElementById('adminPanel');
const testTitle = document.getElementById('testTitle');
const adminOriginalText = document.getElementById('adminOriginalText');
const addTestBtn = document.getElementById('addTestBtn');
const testsContainer = document.getElementById('testsContainer');
const availableTests = document.getElementById('availableTests');
const testSelection = document.getElementById('testSelection');

// Admin email (replace with your actual admin email)
const ADMIN_EMAIL = "anishkumar18034@gmail.com";

// Initialize typing timer
let startTime = null;
userTextEl.addEventListener('input', function() {
  if (!startTime) {
    startTime = new Date();
  }
});

// Authentication state listener
auth.onAuthStateChanged(user => {
  if (user) {
    // User is signed in
    if (user.email === ADMIN_EMAIL) {
      // Admin user
      loginBtn.classList.add('hidden');
      userName.textContent = `Admin: ${user.email}`;
      userInfo.classList.remove('hidden');
      adminPanel.classList.remove('hidden');
    } else {
      // Regular user
      loginBtn.classList.add('hidden');
      userName.textContent = user.email;
      userInfo.classList.remove('hidden');
      adminPanel.classList.add('hidden');
    }
    loadTests();
  } else {
    // User is signed out
    loginBtn.classList.remove('hidden');
    userInfo.classList.add('hidden');
    adminPanel.classList.add('hidden');
    loadTests();
  }
});

// Login handler
loginBtn.addEventListener('click', () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(result => {
      console.log('Logged in:', result.user);
    })
    .catch(error => {
      console.error('Login error:', error);
      alert('Login failed. Please try again.');
    });
});

// Logout handler
logoutBtn.addEventListener('click', () => {
  auth.signOut()
    .then(() => {
      console.log('Logged out');
    })
    .catch(error => {
      console.error('Logout error:', error);
    });
});

// Add test handler
addTestBtn.addEventListener('click', () => {
  const title = testTitle.value.trim();
  const content = adminOriginalText.value.trim();
  
  if (!title || !content) {
    alert('Please enter both title and content for the test.');
    return;
  }
  
  const newTestRef = database.ref('tests').push();
  newTestRef.set({
    title: title,
    content: content,
    createdAt: firebase.database.ServerValue.TIMESTAMP
  })
  .then(() => {
    testTitle.value = '';
    adminOriginalText.value = '';
    alert('Test added successfully!');
  })
  .catch(error => {
    console.error('Error adding test:', error);
    alert('Failed to add test. Please try again.');
  });
});

// Load tests from Firebase
function loadTests() {
  database.ref('tests').on('value', snapshot => {
    const tests = [];
    snapshot.forEach(childSnapshot => {
      tests.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    
    // Sort tests by creation date (newest first)
    tests.sort((a, b) => b.createdAt - a.createdAt);
    
    renderAdminTests(tests);
    renderAvailableTests(tests);
  });
}

// Render tests in admin panel
function renderAdminTests(tests) {
  testsContainer.innerHTML = '';
  
  if (tests.length === 0) {
    testsContainer.innerHTML = '<p>No tests available. Add your first test above.</p>';
    return;
  }
  
  tests.forEach(test => {
    const testElement = document.createElement('div');
    testElement.className = 'test-card';
    testElement.innerHTML = `
      <h3>${test.title}</h3>
      <p>${test.content.substring(0, 100)}${test.content.length > 100 ? '...' : ''}</p>
      <div class="test-actions">
        <button class="delete-btn" data-id="${test.id}">Delete</button>
      </div>
    `;
    testsContainer.appendChild(testElement);
  });
  
  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const testId = e.target.getAttribute('data-id');
      if (confirm('Are you sure you want to delete this test?')) {
        database.ref(`tests/${testId}`).remove()
          .then(() => {
            console.log('Test deleted');
          })
          .catch(error => {
            console.error('Error deleting test:', error);
          });
      }
    });
  });
}

// Render available tests for all users
function renderAvailableTests(tests) {
  availableTests.innerHTML = '';
  
  if (tests.length === 0) {
    availableTests.innerHTML = '<p>No tests available yet. Check back later.</p>';
    return;
  }
  
  tests.forEach(test => {
    const testElement = document.createElement('div');
    testElement.className = 'test-card';
    testElement.innerHTML = `
      <h3>${test.title}</h3>
      <p>${test.content.substring(0, 100)}${test.content.length > 100 ? '...' : ''}</p>
      <button class="start-test-btn" data-id="${test.id}">Start Test</button>
    `;
    availableTests.appendChild(testElement);
  });
  
  // Add event listeners to start test buttons
  document.querySelectorAll('.start-test-btn').forEach(button => {
    button.addEventListener('click', (e) => {
      const testId = e.target.getAttribute('data-id');
      const test = tests.find(t => t.id === testId);
      if (test) {
        originalTextEl.value = test.content;
        userTextEl.value = '';
        userTextEl.focus();
        
        // Scroll to the input section
        document.querySelector('.input-section').scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

// Original transcription comparison functions (unchanged)
compareBtn.addEventListener('click', compareTexts);
showFullTextBtn.addEventListener('click', showFullTexts);
backToResultsBtn.addEventListener('click', showResults);
downloadPdfBtn.addEventListener('click', downloadAsPdf);

function compareTexts() {
  const originalText = originalTextEl.value;
  const userText = userTextEl.value;
  
  if (!originalText || !userText) {
    alert('Please enter both original text and your transcription.');
    return;
  }
  
  // Process texts
  const originalWords = processText(originalText);
  const userWords = processText(userText);
  
  // Compare words
  const comparison = compareParagraphs(originalWords, userWords);
  
  // Display results
  displayComparison(comparison);
  displayStats(comparison.stats);
  displayFeedback(comparison.stats, originalWords, userWords);
  displayFullTexts(originalText, userText);
  
  // Set current date and time
  const now = new Date();
  resultDateEl.textContent = now.toLocaleString();
  
  // Show results section
  showResults();
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
  
  // Use html2canvas to capture the results section
  html2canvas(resultsElement).then(canvas => {
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 width in mm
    const pageHeight = 295; // A4 height in mm
    const imgHeight = canvas.height * imgWidth / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;
    
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;
    
    // Add additional pages if content is too long
    while (heightLeft >= 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
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

function checkForMatchingWords(word, paragraph, startIndex) {
  const wordsToCheck = 1;
  for (let i = 0; i < wordsToCheck && (startIndex + i) < paragraph.length; i++) {
    const nextWord = paragraph[startIndex + i];
    if (word === nextWord) {
      return true;
    }
  }
  return false;
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

function compareParagraphs(paragraphA, paragraphB) {
  let comparedText = '';
  let numHalfDiff = 0;
  let numFullDiff = 0;
  let wordAIndex = 0;
  let wordBIndex = 0;

  // Normal comparison when both paragraphs have content
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
  const keystrokesCount = userTextEl.value.length;
  const errorPercentage = paragraphA.length > 0 ? 
    Math.min(100, ((numHalfDiff / 2) + numFullDiff) / paragraphA.length * 100) : 0;
  const accuracyPercentage = Math.max(0, 100 - errorPercentage);
  
  // Calculate WPM
  const endTime = new Date();
  const typingTimeSeconds = startTime ? (endTime - startTime) / 1000 : 60;
  const typingTimeMinutes = typingTimeSeconds / 60;
  const wordsTyped = paragraphB.length;
  const wpm = typingTimeMinutes > 0 ? Math.round(wordsTyped / typingTimeMinutes) : 0;

  return {
    html: comparedText,
    stats: {
      totalOriginal: paragraphA.length,
      totalUser: paragraphB.length,
      halfMistakes: numHalfDiff,
      fullMistakes: numFullDiff,
      keystrokes: keystrokesCount,
      wpm: wpm,
      accuracy: accuracyPercentage,
      errorRate: errorPercentage
    }
  };
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
      <h4>Half Mistakes</h4>
      <p>${stats.halfMistakes}</p>
    </div>
    <div class="stat-item">
      <h4>Full Mistakes</h4>
      <p>${stats.fullMistakes}</p>
    </div>
    <div class="stat-item">
      <h4>Keystrokes</h4>
      <p>${stats.keystrokes}</p>
    </div>
    <div class="stat-item">
      <h4>Typing Speed (WPM)</h4>
      <p>${stats.wpm}</p>
    </div>
    <div class="stat-item">
      <h4>Accuracy</h4>
      <p>${stats.accuracy.toFixed(1)}%</p>
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

function displayFullTexts(original, user) {
  originalDisplayEl.textContent = original;
  userDisplayEl.textContent = user;
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
  
  // Find word-by-word differences
  for (let i = 0; i < minLength; i++) {
    const origWord = originalText[i].toLowerCase();
    const userWord = userText[i].toLowerCase();
    
    if (origWord !== userWord) {
      wordPairs.push({ original: originalText[i], user: userText[i] });
    }
  }
  
  // Count different types of errors
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
  
  // Calculate rates
  analysis.omissionRate = omissionCount / originalText.length;
  analysis.additionRate = additionCount / originalText.length;
  analysis.spellingErrorRate = spellingCount / originalText.length;
  analysis.capitalizationErrorRate = capitalizationCount / originalText.length;
  
  // Find most common error words
  const wordFrequency = {};
  errorWords.forEach(word => {
    const lowerWord = word.toLowerCase();
    wordFrequency[lowerWord] = (wordFrequency[lowerWord] || 0) + 1;
  });
  
  analysis.mostErrorProneWords = Object.entries(wordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
  
  // Generate common mistake descriptions
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
    assessment += '<p>🌟 <strong>Excellent accuracy!</strong> Your transcription is nearly perfect.</p>';
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
    suggestions.push('You\'re adding extra words. Focus on typing only what you see/hear.');
  }
  
  if (analysis.spellingErrorRate > 0.25) {
    suggestions.push('Spelling mistakes are frequent. Consider practicing difficult words separately.');
  }
  
  if (analysis.capitalizationErrorRate > 0.1) {
    suggestions.push('Watch your capitalization. Remember proper nouns and sentence starts need capitals.');
  }
  
  // Add general tips
  suggestions.push('Practice difficult sections repeatedly until you master them.');
  suggestions.push('Break long passages into smaller chunks for focused practice.');
  suggestions.push('Focus on accuracy before speed - speed will come naturally with practice.');
  
  return suggestions.map(s => `<li>${s}</li>`).join('');
}