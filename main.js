log = console.log

const REFRESH_KEY = "Tab"
const WORD_AMOUNT = 10;
var keystrokes = 0;

async function readWords() {
    const response = await fetch('./words.txt')
    const words = await response.text()
    const wordList = words.split("\n")
    return wordList.map(word => word.replace("\r", "").toLowerCase());
}

function wordsLeft() {
    const elements = document.getElementById('words').children;
    return [...elements].reduce((prev, curr) => curr.classList.contains('written') ? prev : ++prev, 0);
}

function getCurrentWord() {
    const elements = document.getElementById('words').children;
    return [...elements].find(e => !e.classList.contains('written'));
}

function wordWritten(currentWord) {
    keystrokes += currentWord.textContent.length;
    currentWord.classList.add("written")
}

function calculateWPM(time) {
    const minutes = time / 60
    const wpm = (keystrokes / 5) / minutes
    return wpm
}

function displayStats(seconds, raw_wpm, accuracy, wpm) {
    document.getElementById("time").textContent = seconds
    document.getElementById("raw_wpm").textContent = Math.round(raw_wpm, 2)
    document.getElementById("accuracy").textContent = accuracy
    document.getElementById("wpm").textContent = Math.round(wpm, 2)
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
        total++;
        if (el[i].className == 'typo') cnt++;
    }
    cnt = total - cnt;
    return Math.round((cnt / total) * 100, 1)
}

async function endGame(timer, currentWord) {
    wordWritten(currentWord)
    text = ""
    const time = timer.getTimeValues()
    const totalSeconds = time.seconds + time.secondTenths / 10
    const raw_wpm = calculateWPM(totalSeconds)
    const accuracy = calculateAccuracy()
    const wpm = raw_wpm * (accuracy / 100);
    displayStats(totalSeconds, raw_wpm, accuracy+"%", wpm)
}

function isLetter(str) {
    return str.length === 1 && str.match(/[a-z]/i);
}

async function main() {
    await placeWords();
    var firstInput = false;
    const timer = new easytimer.Timer();
    var text = ""

    document.onkeydown = async function(e) {

        if (e.key === REFRESH_KEY) {
            text = ""
            e.preventDefault()
            await refresh()
        }
        if (isLetter(e.key) || e.key === " ") {
            e.preventDefault();
            text += e.key;
        }

        if (!firstInput) {
            timer.start({ precision: "secondTenths" });
            firstInput = true;
        }
        const wLeft = wordsLeft()
        const currentWord = getCurrentWord()

        // Typo catching and removal
        if (e.key === "Backspace") {
            try {
                const element = currentWord.children.item(lastState.length-1)
                element.classList.remove("written")
                element.classList.remove("typo")
                text = text.slice(0, -1)
            } catch (e) {}
        }

        if (text[text.length-1] === " ") { // Word skipped
            var elements = currentWord.children
            for (let i=text.length-1; i<currentWord.textContent.length; ++i) {
                const m = elements[i]
                m.classList.add("typo")
            }
            wordWritten(currentWord)
            text = ""
            if (wLeft === 1) await endGame(timer, currentWord)
        }
        //

        // Checks if word was typed
        if (wLeft > 1 && text === currentWord.textContent+" ") {
            text = ""
            wordWritten(currentWord)
        }
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
    };
}

async function refresh() {
    document.getElementById("time").textContent = 0
    document.getElementById("raw_wpm").textContent = 0
    document.getElementById("accuracy").textContent = 0
    document.getElementById("wpm").textContent = 0
    await clearWords()
    await main()
}

document.addEventListener("DOMContentLoaded", async function(event) {
    /*
    // Mobile handling (WIP)
    const isMobile = navigator.userAgentData.mobile;
    if (isMobile) {
        var input = document.createElement("input");
        input.setAttribute('id','input');
    }
    window.onclick = e => {
        if (isMobile) {
            document.getElementById("input").focus();
            document.getElementById("input").click();
        }
    } 
    */
    await main()
})