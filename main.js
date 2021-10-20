log = console.log

const WORD_AMOUNT = 10;
var keystrokes = 0;

async function readWords() {
    var newWords = [];
    const response = await fetch('./words.txt')
    const words = await response.text()
    const wordList = words.split("\n")
    for (let i=0; i<wordList.length; ++i) {
        newWords.push(wordList[i].replace("\r", ""))
    }
    return newWords
}

function wordsLeft() {
    var left = 0;
    var elements = document.getElementById('words').children;
    for (let i=0; i<elements.length; ++i) {
        const element = elements[i]
        const cl = Array.from(element.classList)
        if (!cl.includes("written")) {
            left++;
        }
    }
    return left;
}

function getCurrentWord() {
    var elements = document.getElementById('words').children;
    for (let i=0; i<elements.length; ++i) {
        const element = elements[i]
        const cl = Array.from(element.classList)
        if (!cl.includes("written")) {
            return element
        }
    }
}

function wordWritten(currentWord) {
    keystrokes += currentWord.textContent.length;
    currentWord.classList.add("written")
    input.value = ""
}

function calculateWPM(time) {
    const minutes = time / 60
    log(keystrokes, minutes)
    const wpm = Math.round((keystrokes / 5) / minutes, 3)
    return wpm
}

function displayStats(seconds, raw_wpm, accuracy, wpm) {
    document.getElementById("time").textContent = seconds
    document.getElementById("raw_wpm").textContent = raw_wpm
    document.getElementById("accuracy").textContent = accuracy
    document.getElementById("wpm").textContent = wpm
}

function getRandom(arr, n) {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len)
        throw new RangeError("getRandom: more elements taken than available");
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

// Creates a "word" div in the "words" div, places an array of letters in it to allow easy mistake highlighting.
async function placeWords() {
    const words = await readWords();
    const selectedWords = getRandom(words, WORD_AMOUNT)
    for (let i=0; i<selectedWords.length; ++i) {
        const wordElement = document.createElement("div");
        wordElement.classList.add("word")
        for (let j=0; j<selectedWords[i].length; ++j) {
            const letterElement = document.createElement("letter")
            letterElement.textContent = selectedWords[i][j]
            wordElement.appendChild(letterElement)
        }
        document.getElementById('words').appendChild(wordElement);  
    }
}

// Clears all of the words on the screen
async function clearWords() {
    var words = document.getElementById("words")
    while (words.firstChild) {
        words.removeChild(words.lastChild);
    }
}

function calculateAccuracy() {
    var el = document.getElementsByTagName("letter");
    var cnt = 0, total = 0
    for (var i = 0; i < el.length; i++) {
        if (el[i].className == 'typo') cnt++;
        else total++;
    }
    cnt = total - cnt;
    return Math.round((cnt / total) * 100, 1)
}

async function endGame(timer, currentWord) {
    wordWritten(currentWord)
    const time = timer.getTimeValues()
    const totalSeconds = time.seconds + time.secondTenths / 10
    const raw_wpm = calculateWPM(totalSeconds)
    const accuracy = calculateAccuracy()
    const wpm = raw_wpm * (accuracy / 100);
    displayStats(totalSeconds, raw_wpm, accuracy+"%", wpm)
}

async function main() {
    var lastState = ""
    await placeWords();
    const input = document.getElementById("input")
    var firstInput = false; 
    const timer = new easytimer.Timer();
    input.oninput = async function(){
        if (!firstInput) {
            timer.start({ precision: "secondTenths" });
            firstInput = true;
        }
        const text = input.value
        const wLeft = wordsLeft()
        const currentWord = getCurrentWord()

        // Typo catching and removal
        if (text.length < lastState.length) {
            try {
                const element = currentWord.children.item(lastState.length-1)
                if (element.classList.contains("typo")) {
                    element.classList.remove("typo")
                }   
            } catch (e) {}
        }
        if (text[text.length-1] === " ") { // Word skipped
            var elements = currentWord.children
            log(elements, text.length-1, currentWord)
            for (let i=text.length-1; i<currentWord.textContent.length; ++i) {
                log(i)
                const m = elements[i]
                m.classList.add("typo")
            }
            wordWritten(currentWord)
            if (wLeft === 1) await endGame(timer, currentWord)
        }
        //

        // Checks if word was typed
        if (wLeft > 1 && text === currentWord.textContent+" ") wordWritten(currentWord)
        if (wLeft === 1 && text === currentWord.textContent) {
            await endGame(timer, currentWord)
        }
        //

        // Typo check (to allow for mistakes)
        if (currentWord.textContent[text.length-1] !== text[text.length-1]) {
            var elements = currentWord.children
            const m = elements.item(text.length-1)
            if (m) m.classList.add("typo")
            var typoMade = true;
        }
        //
        if (!typoMade) {
            var elements = currentWord.children
            const m = elements.item(text.length-1)
            if (m) m.classList.add("written")
        }

        // For typo correction
        lastState = text.replace(" ", "")
    };
}

document.addEventListener("DOMContentLoaded", async function(event) {
    const refresh = document.getElementById("refresh")
    refresh.onclick = async function() {
        await clearWords()
        await main()
    }
    await main()
});