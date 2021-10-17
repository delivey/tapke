log = console.log

var keystrokes = 0;

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
    log(minutes)
    log(keystrokes)
    log(keystrokes / 5)
    log((keystrokes / 5) / minutes)

    const wpm = (keystrokes / 5) / minutes
    return wpm
}

function displayStats(seconds) {
    document.getElementById("time").textContent = seconds
    const wpm = calculateWPM(seconds)
    document.getElementById("wpm").textContent = wpm
}

document.addEventListener("DOMContentLoaded", function(event) {
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
});