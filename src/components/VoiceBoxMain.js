import React, {useEffect, useState} from "react";
import './VoiceBoxMain.css';
import {
	Autocomplete, Box, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField
} from "@mui/material";
import queue from "queue";

const defaultReadOn = " ,.!?;:";
const defaultLanguage = "en-US";
const defaultGender = "FEMALE";
const defaultNoBreakPhrases = true;
const defaultSmoothRead = true;
const defaultFixCCPuncAutoappend = true;
const rateLimit = 500; // characters per request
const chordDelay = 10; // milliseconds
const ENV_API_KEY = process.env.REACT_APP_VOICEBOX_API_KEY || "";

/*
TODO
====
- Realtime mode
- Google form popup
- Save output to local storage, clear button
- Click to view API key, error red API field if invalid
- Support read speed
 */

function vbLog(message) {
	if (process.env.NODE_ENV !== "production") console.log("VoiceBox: " + message);
}

export default function VoiceBoxMain() {
	const [apiKey, setApiKey] = useState(ENV_API_KEY);
	const [language, setLanguage] = useState(defaultLanguage);
	const [availableLanguages, setAvailableLanguages] = useState([]);
	const [gender, setGender] = useState(defaultGender);
	const [availableVoices, setAvailableVoices] = useState([]);
	const [voice, setVoice] = useState("");
	const [readText, setReadText] = useState("");
	const [readOn, setReadOn] = useState(defaultReadOn);
	const [noBreakPhrases, setNoBreakPhrases] = useState(defaultNoBreakPhrases);
	const [smoothRead, setSmoothRead] = useState(defaultSmoothRead);
	const [fixCCPuncAutoappend, setFixCCPuncAutoappend] = useState(defaultFixCCPuncAutoappend);
	const [timerRunning, setTimerRunning] = useState(false);
	const audioQueue = useState(queue({autostart: true, concurrency: 1}))[0];
	const inputArea = document.getElementById("inputArea");
	const outputArea = document.getElementById("outputArea");

	// Get available languages from voices:list endpoint
	useEffect(() => {
		if (!apiKey) {
			return;
		}
		let langs = [];
		const url = "https://texttospeech.googleapis.com/v1/voices?key=" + apiKey;
		fetch(url).then(response => response.json()).then(data => {
			langs = data.voices.map(voice => voice.languageCodes[0]);

			// Remove duplicates and sort
			langs = [...new Set(langs)].sort();
			vbLog("Available languages: " + langs);
		}).catch(error => {
			vbLog("Error getting available languages: " + error);
		}).finally(() => {
			setAvailableLanguages(langs);
		});
	}, [apiKey]);

	// Get available voices from voices:list endpoint
	useEffect(() => {
		if (!apiKey || !language) {
			return;
		}
		let voices = [];
		const url = "https://texttospeech.googleapis.com/v1/voices?languageCode=" + language + "&key=" + apiKey;
		fetch(url).then(response => response.json()).then(data => {
			voices = data.voices.filter(voice => voice.ssmlGender === gender && !voice.name.includes("Studio")).map(voice => voice.name);
			voices.sort();
			vbLog("Available voices: " + voices);
		}).catch(error => {
			vbLog("Error getting available voices: " + error);
		}).finally(() => {
			setAvailableVoices(voices);
		});
	}, [apiKey, language, gender]);

	// Get settings from local storage
	useEffect(() => {
		vbLog("VoiceBoxMain useEffect called");

		// API key
		const key = localStorage.getItem("apiKey");
		if (key) {
			setApiKey(key);
		}

		// Language
		const lang = localStorage.getItem("language");
		if (lang) {
			setLanguage(lang);
		}

		// Voice
		const voice = localStorage.getItem("voice");
		if (voice) {
			setVoice(voice);
		}

		// Read on chars
		const readOnSetting = localStorage.getItem("readOn");
		if (readOnSetting) {
			setReadOn(readOnSetting);
		}

		// Whether to break phrases
		const noBreakChordsSetting = localStorage.getItem("noBreakPhrases");
		if (noBreakChordsSetting) {
			setNoBreakPhrases(noBreakChordsSetting === "true");
		}

		// Whether to fix CharaChorder punctuation auto-append
		const fixCCPuncAutoappendSetting = localStorage.getItem("fixCCPuncAutoappend");
		if (fixCCPuncAutoappendSetting) {
			setFixCCPuncAutoappend(fixCCPuncAutoappendSetting === "true");
		}

		// Whether to read smoothly
		const smoothReadSetting = localStorage.getItem("smoothRead");
		if (smoothReadSetting) {
			setSmoothRead(smoothReadSetting === "true");
		}
	}, []);

	// Focus on inputArea if any input key is pressed
	useEffect(() => {
		function handleKeyDown(e) {
			// Don't handle if any inputs are focused
			if (!document.activeElement.classList.contains("notaninput") && document.activeElement.type !== "radio" && (document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
				return;
			}
			if (e.key !== "Tab" && e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta") {
				inputArea.focus();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return function cleanup() {
			document.removeEventListener('keydown', handleKeyDown);
		}
	}, [inputArea]);

	function callAPI(text) {
		if (fixCCPuncAutoappend) { // Fix CharaChorder punctuation auto-append
			if (text.length === 2 && readOn.includes(text[0]) && text[1] === " ") {
				text = text.slice(0, -2); // don't speak ^[punctuation][space]$
			} else if (text[text.length - 2] === " " && readOn.includes(text[text.length - 1])) {
				text = text.slice(0, -2) + text[text.length - 1] + " "; // manually swap .*[space][punctuation]$
			}
		}

		// Clear input text
		inputArea.value = "";

		// Don't call API if text is empty
		if (text === "") {
			return;
		}

		// Move input text to read text
		if (readText === "") {
			setReadText(text);
		} else {
			setReadText(readText + "\n" + text);
		}

		// Call Google TTS API
		vbLog(`API call on: ${text} with API key: ${apiKey} and language: ${language}`);
		const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;
		const body = JSON.stringify({
			"input": {
				"text": text
			}, "voice": {
				"languageCode": language, "name": voice, "ssmlGender": gender
			}, "audioConfig": {
				"audioEncoding": "MP3"
			}
		});
		const options = {
			method: "POST", body
		};
		fetch(url, options).then(r => r.json()).then(data => {

			// Scroll to bottom of output area - do this here to give new text time to render
			outputArea.scrollTop = outputArea.scrollHeight;

			const audio = new Audio("data:audio/wav;base64," + data.audioContent);
			if (!audio) {
				console.error("No audio returned from API");
			}
			audioQueue.push(() => {
				return new Promise((resolve, reject) => {
					audio.onended = resolve;
					audio.onerror = reject;
					audio.play();
				});
			});
		}).catch(e => console.error(e));
	}

	function onInputTextChange(event) {
		// Limit input to rate limit
		if (event.target.value.length > 500) {
			event.target.value = event.target.value.slice(0, rateLimit);
		} else if (event.target.value === "") {
			return;
		}

		if (timerRunning) {
			return;
		}

		// If last character is newline or period, call API on last input
		if ((readOn + "\n").includes(event.target.value.slice(-1))) {
			if (noBreakPhrases) { // delay to allow for chord detection
				setTimerRunning(true);
				setTimeout(() => {
					callAPI(event.target.value);
					setTimerRunning(false);
				}, chordDelay);
			} else {
				callAPI(event.target.value);
			}
		}
	}

	function onApiKeyChange(event) {
		setApiKey(event.target.value);
		localStorage.setItem("apiKey", event.target.value);
		vbLog("API key set to: " + event.target.value);
	}

	return (<div>
		<form>
			<TextField
				className="notaninput io"
				rows={10}
				style={{caretColor: "transparent"}}
				value={readText}
				id="outputArea"
				multiline
			/>
			<TextField
				className="io"
				maxRows={10}
				placeholder="Start typing here..."
				onChange={onInputTextChange}
				id="inputArea"
				autoFocus
				multiline
			/>
			<Box className="fit-center" sx={{border: 1, borderColor: "grey.700", borderRadius: 1}}>
				<FormControl className="flex-center" style={{margin: "0.5em 0.5em 0 0.5em"}}>
					<TextField id="readOnLabel" label="Read on" variant="outlined" value={readOn} onChange={(e) => {
						setReadOn(e.target.value);
						localStorage.setItem("readOn", e.target.value);
					}} style={{marginRight: "0.5em"}} sx={{
						'.MuiInputBase-input': {fontFamily: "monospace"},
					}} size="small"/>
					<FormControlLabel checked={noBreakPhrases} control={<Checkbox onChange={(e) => {
						setNoBreakPhrases(e.target.checked);
						localStorage.setItem("noBreakPhrases", e.target.checked);
					}}/>} label="Don't break phrases"/>
					<FormControlLabel checked={smoothRead} control={<Checkbox onChange={(e) => {
						setSmoothRead(e.target.checked);
						localStorage.setItem("smoothRead", e.target.checked);
					}}/>} label="Read smoothly"/>
				</FormControl>
				<FormControl className="flex-center" style={{margin: "0 0.5em 0.5em 0.5em"}}>
					<FormControlLabel checked={fixCCPuncAutoappend} control={<Checkbox onChange={(e) => {
						setFixCCPuncAutoappend(e.target.checked);
						localStorage.setItem("fixCCPuncAutoappend", e.target.checked);
					}}/>} label="Allow CharaChorder punctuation auto-append"/>
				</FormControl>
				<div className="flex-center" style={{margin: "0 0.5em 0.5em 0.5em"}}>
					<Autocomplete id="languageSelect" options={availableLanguages} sx={{minWidth: 150}}
					              renderInput={(params) => <TextField {...params} label="Language" variant="outlined"/>}
					              onChange={(e, v) => {
						              setLanguage(v);
						              localStorage.setItem("language", v || '');

						              // Clear voice
						              setVoice('');
						              localStorage.setItem("voice", '');
					              }} value={language} defaultValue={defaultLanguage} size="small"/>
					<FormControl>
						<InputLabel id="genderSelectLabel">Gender</InputLabel>
						<Select id="genderSelect" labelId={"genderSelectLabel"} label="Gender" onChange={(e) => {
							setGender(e.target.value);
							localStorage.setItem("gender", e.target.value || '');

							// Clear voice
							setVoice('');
							localStorage.setItem("voice", '');
						}} value={gender} defaultValue={defaultGender} style={{flexGrow: 1}} size="small">
							<MenuItem value={"FEMALE"}>Female</MenuItem>
							<MenuItem value={"MALE"}>Male</MenuItem>
						</Select>
					</FormControl>
					<Autocomplete id="voiceSelect" options={availableVoices} sx={{minWidth: 250}} size="small"
					              renderInput={(params) => <TextField {...params} label="Voice" variant="outlined"/>}
					              onChange={(e, v) => {
						              setVoice(v);
						              localStorage.setItem("voice", v || '');
					              }} value={voice} defaultValue={availableVoices[0]}/>
				</div>
				{!ENV_API_KEY &&
				<FormControl className="flex-center" style={{margin: "0.5em"}}>
					<TextField id="apiKey" type="password" label="API Key" variant="outlined"
				                            onChange={onApiKeyChange} value={apiKey} size="small"/>
				</FormControl>}
			</Box>
		</form>
	</div>);
}
