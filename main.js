log = console.log;

const REFRESH_KEY = "Tab";
const WORD_AMOUNT = 10;
var keystrokes = 0;
var mistakes = 0;

async function readWords() {
	const response = await fetch("./words.txt");
	const words = await response.text();
	const wordList = words.split("\n");
	return wordList.map((word) => word.replace("\r", "").toLowerCase());
}

function wordsLeft() {
	const elements = document.getElementById("words").children;
	return [...elements].reduce(
		(prev, curr) =>
			curr.classList.contains("written-word") ? prev : ++prev,
		0
	);
}

function getCurrentWord() {
	const elements = document.getElementById("words").children;
	return [...elements].find((e) => !e.classList.contains("written-word"));
}

function wordWritten(currentWord) {
	keystrokes += currentWord.textContent.length;
	currentWord.classList.add("written-word");
}

function calculateWPM(time) {
	const wpm = keystrokes / 5 / (time / 60);
	return wpm;
}

function displayStats(seconds, raw_wpm, accuracy, wpm) {
	document.getElementsByClassName("words-i")[0].textContent = "10/10";
	document.getElementsByClassName("accuracy-i")[0].textContent = accuracy;
	document.getElementsByClassName("wpm-i")[0].textContent = Math.round(
		wpm,
		2
	);
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

// Creates a "word" div in the "words" div, places an array of letters (p) in it to allow easy mistake highlighting.
async function placeWords() {
	const words = await readWords();
	const selectedWords = getRandom(words, WORD_AMOUNT);
	for (let i = 0; i < selectedWords.length; ++i) {
		const wordElement = document.createElement("div");
		wordElement.classList.add("word");
		for (let j = 0; j < selectedWords[i].length; ++j) {
			const letterElement = document.createElement("p");
			letterElement.textContent = selectedWords[i][j];
			wordElement.appendChild(letterElement);
		}
		document.getElementById("words").appendChild(wordElement);
	}
}

// Clears all of the words on the screen
async function clearWords() {
	var words = document.getElementById("words");
	while (words.firstChild) {
		words.removeChild(words.lastChild);
	}
}

function calculateAccuracy() {
	const total = document.getElementsByTagName("p").length;
	mistakes = total - mistakes;
	return Math.round((mistakes / total) * 100, 1);
}

async function endGame(timer, currentWord) {
	wordWritten(currentWord);
	text = "";
	const time = timer.getTimeValues();
	const totalSeconds = time.seconds + time.secondTenths / 10;
	const raw_wpm = calculateWPM(totalSeconds);
	const accuracy = calculateAccuracy();
	const wpm = raw_wpm * (accuracy / 100);
	keystrokes = 0;
	mistakes = 0;
	displayStats(totalSeconds, raw_wpm, accuracy + "%", wpm);
}

function showStats(timer) {
	const time = timer.getTimeValues();
	const totalSeconds = time.seconds + time.secondTenths / 10;
	const raw_wpm = calculateWPM(totalSeconds);
	const accuracy = calculateAccuracy();
	const wpm = raw_wpm * (accuracy / 100);
	/*
	console.log(wpm, accuracy);
	document.getElementsByClassName("wpm-i")[0].innerHTML = Math.round(wpm, 2);
	document.getElementsByClassName("words-i")[0].innerHTML = "0/25";
	document.getElementsByClassName("accuracy-i")[0].innerHTML = Math.round(
		accuracy,
		2
	);
    */
}

function isLetter(str) {
	return str.length === 1 && str.match(/[a-z]/i);
}

async function main() {
	await placeWords();
	var firstInput = false;
	const timer = new easytimer.Timer();
	var fullText = "";
	var text = "";
	document.onkeydown = async function (e) {
		console.log("Updating stats");
		showStats(timer);
		if (e.key === REFRESH_KEY) {
			text = "";
			e.preventDefault();
			await refresh();
		}
		if (isLetter(e.key) || e.key === " ") {
			e.preventDefault();
			text += e.key;
			fullText += e.key;
		}
		if (!firstInput) {
			timer.start({ precision: "secondTenths" });
			firstInput = true;
		}
		const wLeft = wordsLeft();
		var currentWord = getCurrentWord();

		// Backspace functionality
		if (e.key === "Backspace") {
			fullText = fullText.slice(0, -1);
			if (fullText.charAt(fullText.length - 1) === " ") {
				fullText = fullText.slice(0, -2);
			}
			textTemp = fullText.split(" ").filter((i) => i);
			text = textTemp[textTemp.length - 1];

			const lastLetters = document.getElementsByClassName("written");
			const lastLetter = lastLetters[lastLetters.length - 1];
			lastLetter.className = "";
			currentWord = getCurrentWord();
		} else {
			if (text[text.length - 1] === " ") {
				// Word skipped
				var elements = currentWord.children;
				for (
					let i = text.length - 1;
					i < currentWord.textContent.length;
					++i
				) {
					const m = elements[i];
					m.classList.add("typo");
				}
				wordWritten(currentWord);
				text = "";
				fullText += " ";
				if (wLeft === 1) await endGame(timer, currentWord);
			}

			if (wLeft > 1 && text === currentWord.textContent + " ") {
				// Checks if word was fully typed
				text = "";
				fullText += " ";
				wordWritten(currentWord);
			}
			if (wLeft === 1 && text === currentWord.textContent)
				await endGame(timer, currentWord);

			// Typo check (to allow for mistakes)
			if (
				currentWord.textContent[text.length - 1] !==
				text[text.length - 1]
			) {
				var elements = currentWord.children;
				const m = elements.item(text.length - 1);
				if (m) {
					++mistakes;
					m.className = "typo written";
				}
			} else {
				// Letter typed
				var elements = currentWord.children;
				const m = elements.item(text.length - 1);
				if (m) m.className = "written";
			}
		}
	};
}

async function refresh() {
	document.getElementsByClassName("words-i")[0].textContent = "0/10";
	document.getElementsByClassName("accuracy-i")[0].textContent = 0;
	document.getElementsByClassName("wpm-i")[0].textContent = 0;
	await clearWords();
	await main();
}

document.addEventListener("DOMContentLoaded", async function (event) {
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
	await main();
});
