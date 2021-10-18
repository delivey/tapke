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
    const wpm = Math.round((keystrokes / 5) / minutes, 3)
    return wpm
}

function displayStats(seconds) {
    document.getElementById("time").textContent = seconds
    const wpm = calculateWPM(seconds)
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

async function placeWords() {
    const words = await readWords();
    const selectedWords = getRandom(words, WORD_AMOUNT)
    for (let i=0; i<selectedWords.length; ++i) {
        const wordElement = document.createElement("p");
        wordElement.classList.add("word")
        wordElement.textContent = selectedWords[i]
        document.getElementById('words').appendChild(wordElement);  
    }
}

async function clearWords() {
    var words = document.getElementById("words")
    while (words.firstChild) {
        words.removeChild(words.lastChild);
      }
}

async function main() {
    await placeWords();
    const input = document.getElementById("input")
    var firstInput = false; 
    const timer = new easytimer.Timer();
    input.oninput = function(){
        if (!firstInput) {
            log("timer started")
            timer.start({ precision: "secondTenths" });
            firstInput = true;
        }
        const text = input.value
        const wLeft = wordsLeft()
        const currentWord = getCurrentWord()
        if (wLeft > 1 && text === currentWord.textContent+" ") wordWritten(currentWord)
        if (wLeft === 1 && text === currentWord.textContent) {
            wordWritten(currentWord)
            const time = timer.getTimeValues()
            const totalSeconds = time.seconds + time.secondTenths / 10
            displayStats(totalSeconds)
        }
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