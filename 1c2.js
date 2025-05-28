// --- START OF PORTED FUNCTIONS FROM KC.HTML ---

// Global startTime (already present in 1c2.js, will be used by ported logic)
var startTime;
var typingTimer = null; // Initialize typingTimer to null

// Text Processing
function processText(text) {
    return text.replace(/<[^>]*>/g, '') // Remove HTML tags
        .replace(/[\u2018\u2019]/g, "'") // Normalize apostrophes
        .replace(/[\u201C\u201D]/g, '"') // Normalize quotation marks
        .trim()
        .split(/\s+/)
        .filter(word => word.length > 0);
}

function getWordBase(word) {
    return word ? word.replace(/[.,!?]$/, '') : ""; // Remove trailing common punctuation for base comparison
}

function getPunctuation(word) {
    if (!word) return '';
    const lastChar = word.slice(-1);
    // Consider a broader set of punctuation if needed
    return (/[.,!?;:"']/.test(lastChar)) ? lastChar : '';
}

// LCS Comparison
function getLcsTable(arr1, arr2) {
    const m = arr1.length;
    const n = arr2.length;
    const dp = Array(m + 1).fill(0).map(() => Array(n + 1).fill(0));

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            if (getWordBase(arr1[i - 1]).toLowerCase() === getWordBase(arr2[j - 1]).toLowerCase()) {
                dp[i][j] = dp[i - 1][j - 1] + 1;
            } else {
                dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
            }
        }
    }
    return dp;
}

function compareParagraphsLCS(originalWords, userWords, userTextRawValue) {
    const m = originalWords.length;
    const n = userWords.length;
    const lcsTable = getLcsTable(originalWords, userWords);

    let i = m;
    let j = n;
    const diffResult = [];

    while (i > 0 || j > 0) {
        const origWord = i > 0 ? originalWords[i - 1] : '';
        const userWord = j > 0 ? userWords[j - 1] : '';
        const origBase = getWordBase(origWord);
        const userBase = getWordBase(userWord);
        const origPunc = getPunctuation(origWord);
        const userPunc = getPunctuation(userWord);

        if (i > 0 && j > 0 && origBase.toLowerCase() === userBase.toLowerCase()) {
            if (origPunc !== userPunc) {
                diffResult.push({ type: 'punctuation', originalWord: origWord, userWord: userWord });
            } else if (origBase !== userBase) { // Case difference
                diffResult.push({ type: 'capitalization', originalWord: origWord, userWord: userWord });
            } else { // Correct word
                diffResult.push({ type: 'correct', word: origWord });
            }
            i--;
            j--;
        } else if (j > 0 && (i === 0 || lcsTable[i][j - 1] >= lcsTable[i - 1][j])) {
            // Addition in user's text
            diffResult.push({ type: 'addition', word: userWord });
            j--;
        } else if (i > 0 && (j === 0 || lcsTable[i][j - 1] < lcsTable[i - 1][j])) {
            // Missing from user's text (omission)
            diffResult.push({ type: 'missing', word: origWord });
            i--;
        } else {
            break;
        }
    }
    diffResult.reverse(); // Results were added in reverse order

    let html = '', totalMistakes = 0, capMistakes = 0, puncMistakes = 0, correctCount = 0;
    diffResult.forEach(diff => {
        switch (diff.type) {
            case 'correct':
                html += `<span class="correct">${diff.word}</span> `;
                correctCount++;
                break;
            case 'capitalization':
                html += `<span class="capitalization">${diff.originalWord}</span> `;
                totalMistakes++;
                capMistakes++;
                correctCount++;
                break;
            case 'punctuation':
                html += `<span class="missing">${diff.originalWord}</span> `;
                totalMistakes++;
                puncMistakes++;
                // According to kc.html logic, punctuation differences might still allow the base word match.
                // If a punctuation difference means the word is effectively "correct" for WPM but still a mistake:
                correctCount++; // Count base word as correct for WPM, but mark as punc error.
                break;
            case 'missing':
                html += `<span class="missing">${diff.word}</span> `;
                totalMistakes++;
                break;
            case 'addition':
                html += `<span class="addition">${diff.word}</span> `;
                totalMistakes++;
                break;
        }
    });

    const totalOrig = originalWords.length;
    const effectiveCorrect = correctCount - (capMistakes / 2); // As per kc.html for accuracy
    const accuracy = totalOrig > 0 ? Math.max(0, Math.min(100, (effectiveCorrect / totalOrig) * 100)) : (userWords.length === 0 ? 100 : 0);
    
    var endTime = new Date();
    var typingTimeSeconds = startTime ? (endTime - startTime) / 1000 : 0;
    
    var timerDisplayElement = document.getElementById('timer');
    var timeTakenForWPM = typingTimeSeconds;

    if (timerDisplayElement && typingTimer !== null) { // Check if timer was active
        var timerDisplay = timerDisplayElement.textContent;
        if (timerDisplay !== "Time's up!" && timerDisplay.includes(":")) { // Check if timer is still running or just finished
             var timeParts = timerDisplay.split(':');
             var minutesLeft = parseInt(timeParts[0]);
             var secondsLeft = parseInt(timeParts[1]);
             var totalSecondsLeft = (minutesLeft * 60) + secondsLeft;
            
             var durationRadios = document.getElementsByName('duration');
             var selectedDurationValue = 0;
             for(var k=0; k < durationRadios.length; k++){
                 if(durationRadios[k].checked){
                     selectedDurationValue = parseInt(durationRadios[k].value);
                     break;
                 }
             }
             if (selectedDurationValue > 0) {
                  timeTakenForWPM = selectedDurationValue - totalSecondsLeft;
             }
        } else if (timerDisplay === "Time's up!") { // If time ran out, use the full selected duration
             var durationRadios = document.getElementsByName('duration');
             for(var k=0; k < durationRadios.length; k++){
                 if(durationRadios[k].checked){
                     timeTakenForWPM = parseInt(durationRadios[k].value);
                     break;
                 }
             }
        }
    }


    const timeMins = timeTakenForWPM > 0 ? timeTakenForWPM / 60 : 0;
    // WPM should be based on correctly typed words (or all user words, depending on standard)
    // kc.html WPM is based on userWords.length
    const wpm = timeMins > 0 ? Math.round(userWords.length / timeMins) : 0;

    return {
        html: html.trim(),
        stats: {
            totalOriginal: totalOrig,
            totalUser: userWords.length,
            totalMistakes: totalMistakes,
            punctuationMistakes: puncMistakes,
            capitalizationMistakes: capMistakes,
            keystrokes: userTextRawValue.length,
            wpm: wpm,
            accuracy: accuracy,
            errorRate: 100 - accuracy,
            timeTaken: Math.max(0, timeTakenForWPM) // Ensure timeTaken is not negative
        },
        punctuationMistakesCount: puncMistakes
    };
}


function generateFeedback(stats, punctuationMistakesCount) {
    let fb = `<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">`;
    fb += '<h3 style="color: #3f37c9; margin-bottom: 10px;">Performance Summary</h3>';
    fb += getOverallAssessment(stats.accuracy, stats.wpm);
    fb += '</div>';

    fb += '<div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 15px;">';
    fb += '<h3 style="color: #3f37c9; margin-bottom: 10px;">Detailed Feedback</h3>';

    fb += `<h4>🔍 Mistake Summary</h4><ul>`;
    if (stats.totalMistakes > 0) {
        fb += `<li>Found ${stats.totalMistakes} total difference(s) when comparing to the original.</li>`;
        if (stats.capitalizationMistakes > 0) {
            fb += `<li>Including ${stats.capitalizationMistakes} capitalization difference(s).</li>`;
        }
        if (punctuationMistakesCount > 0) {
            fb += `<li>Including ${punctuationMistakesCount} punctuation difference(s).</li>`;
        }
         let otherMistakes = stats.totalMistakes - (stats.capitalizationMistakes || 0) - punctuationMistakesCount;
        if (otherMistakes > 0) {
            fb += `<li>Including ${otherMistakes} word additions/omissions.</li>`;
        }
    } else if (stats.accuracy === 100) {
        fb += `<li>No mistakes found! Excellent work!</li>`;
    } else {
        fb += `<li>Some minor differences detected.</li>`;
    }
    fb += `</ul>`;

    fb += `<h4>💡 Improvement Suggestions</h4><ul>`;
    if (stats.accuracy < 90) {
        fb += `<li>Focus on overall accuracy. Slow down if necessary to ensure each word is typed correctly.</li>`;
    }
    if (punctuationMistakesCount > 3) {
        fb += `<li>Pay close attention to commas, periods, and other punctuation marks.</li>`;
    }
    if (stats.capitalizationMistakes > 2) {
        fb += `<li>Be mindful of capitalization for proper nouns and sentence beginnings.</li>`;
    }
    if (stats.totalMistakes - (stats.capitalizationMistakes || 0) - punctuationMistakesCount > 3) { // More than 3 other errors
        fb += `<li>Review the original text carefully to reduce omissions or additions of words.</li>`;
    }
    if (stats.wpm > 0 && stats.wpm < 40) {
        fb += `<li>Practice regularly to increase typing speed once accuracy improves.</li>`;
    } else if (stats.wpm === 0 && stats.timeTaken > 0 && stats.totalUser > 0) {
         fb += `<li>Your WPM is calculated as 0. This might be due to a very short typing duration or very few words typed.</li>`;
    }
    fb += `<li>Consistent practice is key! Even short, focused sessions can make a big difference.</li></ul>`;
    fb += '</div>';
    return fb;
}

function getOverallAssessment(accuracy, wpm) {
    let assessmentText = '';
    if (accuracy >= 98) {
        assessmentText += '<p>🌟 <strong>Outstanding accuracy!</strong></p>';
    } else if (accuracy >= 95) {
        assessmentText += '<p>👍 <strong>Excellent accuracy!</strong></p>';
    } else if (accuracy >= 90) {
        assessmentText += '<p>✅ <strong>Good accuracy.</strong></p>';
    } else if (accuracy >= 80) {
        assessmentText += '<p>📝 <strong>Fair accuracy.</strong> There is room for improvement.</p>';
    } else {
        assessmentText += '<p>⚠️ <strong>Accuracy needs significant improvement.</strong> Focus on typing correctly.</p>';
    }

    if (wpm === 0 && accuracy < 100) { // If WPM is 0 but there were mistakes, don't comment on speed yet.
         // assessmentText += '<p>Focus on typing a bit more to calculate speed effectively.</p>';
    } else if (wpm === 0 && accuracy === 100 && document.getElementById('paragraphB').value.trim() === '') {
        // User hasn't typed anything yet
    }
     else if (wpm >= 60) {
        assessmentText += '<p>⚡ <strong>Very Fast Typer!</strong></p>';
    } else if (wpm >= 50) {
        assessmentText += '<p>🚀 <strong>Fast Typer!</strong></p>';
    } else if (wpm >= 40) {
        assessmentText += '<p>🏃 <strong>Moderate Speed.</strong> Good pace.</p>';
    } else if (wpm > 0) { // Only if WPM is calculated and > 0
        assessmentText += '<p>🐢 <strong>Developing Speed.</strong> Keep practicing to build up pace.</p>';
    }
    return assessmentText;
}

// --- END OF PORTED FUNCTIONS FROM KC.HTML ---

window.onload = function() {
    var paragraphBElement = document.getElementById('paragraphB');
    if (paragraphBElement) {
        paragraphBElement.addEventListener('input', function() {
            if (!startTime) {
                startTime = new Date();
            }
            // If there's a timer selected AND it hasn't been started yet, start it.
            if (typingTimer === null) { 
                var durationRadios = document.getElementsByName('duration');
                var selectedDuration = 0;
                for(var i=0; i < durationRadios.length; i++){
                    if(durationRadios[i].checked){
                        selectedDuration = parseInt(durationRadios[i].value);
                        break;
                    }
                }
                if (selectedDuration > 0) {
                    startTimer(selectedDuration);
                }
            }
        });
    }


    var durationRadios = document.getElementsByName('duration');
    for(var i=0; i < durationRadios.length; i++){
        durationRadios[i].addEventListener('change', function() {
            // Only start/restart timer if paragraphB has content or if user explicitly changes duration
            // Clear existing timer before starting a new one
            if (typingTimer !== null) { 
                clearInterval(typingTimer);
                typingTimer = null;
            }
            startTime = new Date(); // Reset startTime for WPM calculation based on new timer
            startTimer(parseInt(this.value));
            if (paragraphBElement) paragraphBElement.readOnly = false; // Ensure textarea is editable
            if (paragraphBElement) paragraphBElement.focus();
        });
    }
};

function startTimer(durationInSeconds) {
    var timer = durationInSeconds;
    var minutes, seconds;
    var display = document.getElementById('timer');
    var paragraphBElement = document.getElementById('paragraphB');
    
    if (display) display.style.color = 'black'; // Reset color

    // Clear any existing timer
    if (typingTimer !== null) {
        clearInterval(typingTimer);
    }

    if (paragraphBElement) paragraphBElement.readOnly = false; // Make sure it's editable

    typingTimer = setInterval(function () {
        minutes = parseInt(timer / 60, 10);
        seconds = parseInt(timer % 60, 10);

        minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        if (display) display.textContent = minutes + ":" + seconds;

        if (--timer < 0) {
            clearInterval(typingTimer);
            typingTimer = null; 
            if (display) {
                display.textContent = "Time's up!";
                display.style.color = 'red';
            }
            if (paragraphBElement) paragraphBElement.readOnly = true;
            compareParagraphs(); 
        }
    }, 1000);
}


function saveToLeaderboard(stats) {
    if (typeof firebase === 'undefined' || typeof firebase.auth === 'undefined') {
        console.log("Firebase not initialized, skipping leaderboard save.");
        return;
    }
    const user = firebase.auth().currentUser;
    if (!user) {
        console.log("User not logged in, skipping leaderboard save");
        return;
    }
    
    const testSelect = document.getElementById('test-select');
    const speedSelect = document.getElementById('speed-select');

    const testNumber = testSelect ? testSelect.value : "Custom"; // Default to "Custom"
    const speedSetting = speedSelect ? parseInt(speedSelect.value) : 0; // Speed setting from dropdown
    
    // Construct a more descriptive test title
    let testTitle = `Test: ${testNumber}`;
    if (speedSetting > 0) {
        testTitle += ` @ ${speedSetting} WPM Setting`;
    } else if (testNumber === "Custom" && document.getElementById('paragraphA').value.length > 0) {
        testTitle = "Custom Text Input";
    }


    const result = {
        userName: user.displayName || 'Anonymous',
        userId: user.uid,
        userPhoto: user.photoURL || `https://www.gravatar.com/avatar/${user.uid}?d=identicon&s=30`,
        testTitle: testTitle,
        // category: "general", // Could add a category selector in HTML
        stats: { 
            accuracy: parseFloat(stats.accuracy.toFixed(1)), // Consistent with kc.html display
            totalOriginal: stats.totalOriginal,
            totalUser: stats.totalUser,
            totalMistakes: stats.totalMistakes,
            wpm: stats.wpm,
            timeTaken: Math.round(stats.timeTaken), // Round to nearest second
            keystrokes: stats.keystrokes,
            errorRate: parseFloat(stats.errorRate.toFixed(1)),
            capitalizationMistakes: stats.capitalizationMistakes,
            punctuationMistakes: stats.punctuationMistakes
        },
        timestamp: firebase.database.ServerValue.TIMESTAMP
    };
    
    try {
        const newResultRef = firebase.database().ref('leaderboard').push(); // Ensure 'leaderboard' path is correct
        newResultRef.set(result)
            .then(() => console.log("Result saved to leaderboard successfully"))
            .catch(error => console.error("Error saving to leaderboard:", error));
    } catch (error) {
        console.error("Exception when saving to leaderboard:", error);
    }
}

function compareParagraphs() {
    var paragraphBElement = document.getElementById('paragraphB');

    if (typingTimer !== null) { 
        clearInterval(typingTimer);
        // typingTimer = null; // Will be set to null if time ran out, or here if user clicks compare early
    }
    if (paragraphBElement) paragraphBElement.readOnly = true;

    var originalTextRaw = document.getElementById('paragraphA').value;
    var userTextRaw = paragraphBElement ? paragraphBElement.value : "";

    if (originalTextRaw.trim() === "" && userTextRaw.trim() === "") {
        alert("Please enter some text in both original and your transcription fields.");
        if (paragraphBElement) paragraphBElement.readOnly = false; // Allow editing again
        return;
    }
     if (originalTextRaw.trim() === "") {
        alert("Original text is empty. Please provide the original text to compare against.");
        if (paragraphBElement) paragraphBElement.readOnly = false;
        return;
    }


    var originalWords = processText(originalTextRaw);
    var userWords = processText(userTextRaw);

    var legendHTML = `
        <div style="border: 1px solid #ccc; width: 95%; max-width: 930px; padding: 10px; border-radius: 4px; margin-bottom: 10px; font-family: sans-serif; font-size: 0.9em;">
            <h4 style="margin-top:0; margin-bottom: 8px;">Legend:</h4>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <span class="correct" style="color: #2ecc71; font-weight: bold; margin-right: 5px; display: inline-block; padding: 0 2px;">■</span> Correct
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <span class="missing" style="color: #e74c3c; font-weight: bold; background-color: rgba(231, 76, 60, 0.1); padding: 0 2px; border-radius: 3px; margin-right: 5px; display: inline-block;">■</span> Missing (from Original) / Punctuation Difference
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <span class="addition" style="color: #3498db; font-weight: bold; background-color: rgba(52, 152, 219, 0.1); padding: 0 2px; border-radius: 3px; text-decoration: line-through; margin-right: 5px; display: inline-block;">■</span> Added (in Your Text)
            </div>
            <div style="display: flex; align-items: center; margin-bottom: 5px;">
                <span class="capitalization" style="color: #9b59b6; font-weight: bold; border-bottom: 2px dotted rgba(155, 89, 182, 0.7); margin-right: 5px; display: inline-block; padding: 0 2px;">■</span> Capitalization Difference
            </div>
        </div>
        <style>
            .correct { color: #2ecc71; font-weight: bold; }
            .missing { color: #e74c3c; font-weight: bold; background-color: rgba(231, 76, 60, 0.1); padding: 0 2px; border-radius: 3px;}
            .addition { color: #3498db; font-weight: bold; background-color: rgba(52, 152, 219, 0.1); padding: 0 2px; border-radius: 3px; text-decoration: line-through;}
            .capitalization { color: #9b59b6; font-weight: bold; border-bottom: 2px dotted rgba(155, 89, 182, 0.7); }
        </style>
    `;

    var comparisonResult = compareParagraphsLCS(originalWords, userWords, userTextRaw);
    var comparedText = comparisonResult.html;
    var stats = comparisonResult.stats;

    if (typeof firebase !== 'undefined' && firebase.auth().currentUser) {
        saveToLeaderboard(stats);
    }
    
    var tableContent =
        '<h3 style="color: #3f37c9;">Statistics:</h3>' +
        '<table style="border-collapse: collapse; width: 95%; max-width: 930px; margin-bottom: 20px; font-family: sans-serif; font-size: 0.95em;">' +
        '<thead><tr>' +
        '<th style="border: 1px solid #ddd; padding: 8px; background-color: #f0f0f0; text-align: left;">Metric</th>' +
        '<th style="border: 1px solid #ddd; padding: 8px; background-color: #f0f0f0; text-align: left;">Value</th>' +
        '</tr></thead>' +
        '<tbody>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Original Words</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.totalOriginal + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Your Words Typed</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.totalUser + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Total Differences</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.totalMistakes + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Capitalization Diffs</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.capitalizationMistakes + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Punctuation Diffs</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.punctuationMistakes + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Keystrokes</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.keystrokes + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Typing Speed (WPM)</td><td style="border: 1px solid #ddd; padding: 8px;">' + stats.wpm + '</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">Accuracy</td><td style="border: 1px solid #ddd; padding: 8px; font-weight: bold;">' + stats.accuracy.toFixed(1) + '%</td></tr>' +
        '<tr><td style="border: 1px solid #ddd; padding: 8px;">Time Taken</td><td style="border: 1px solid #ddd; padding: 8px;">' + Math.floor(stats.timeTaken / 60) + 'm ' + Math.round(stats.timeTaken % 60) + 's</td></tr>' +
        '</tbody>' +
        '</table>';

    var aiAnalysis = generateFeedback(stats, comparisonResult.punctuationMistakesCount);
    
    var resultBox = document.getElementById('textBoxC');
    if (resultBox) {
        resultBox.innerHTML = '<h2 style="color: #4361ee;">Result Sheet</h2>' + // Main heading
            legendHTML + 
            '<h3 style="color: #3f37c9;">Comparison:</h3>' + // Sub-heading for comparison text
            '<div style="padding:10px; border:1px solid #eee; border-radius:4px; margin-bottom:20px; line-height:1.8; font-size:1.1em; width: 95%; max-width:930px; word-wrap: break-word; white-space: pre-wrap;">' + comparedText + '</div>' +
            tableContent + 
            '<div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px; width: 95%; max-width:930px;">' +
            '<h3 style="color: #3f37c9;">AI-Powered Feedback</h3>' + 
            aiAnalysis +
            '</div>';
        
        resultBox.style.display = 'block';
        resultBox.style.border = '1px solid #ddd'; 
        resultBox.style.padding = '15px';
        resultBox.style.backgroundColor = '#fff';
    }
    
    // startTime = null; // Reset startTime for the next attempt if not using a fixed timer
    // If a fixed timer was used, startTime is less relevant for manual WPM after timer stops.
    // The `timeTaken` in stats is now the primary source for WPM.
}