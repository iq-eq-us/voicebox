import React, {useCallback, useEffect, useState} from "react";
import './VoiceBoxMain.css';
import FormPopup from "./FormPopup";
import {
	Autocomplete, Box, Checkbox, FormControl, FormControlLabel, InputLabel, MenuItem, Select, TextField, Tooltip
} from "@mui/material";
import queue from "queue";

const DEFAULT_READ_ON = "., !?;:";
const DEFAULT_LANG = "en-US";
const DEFAULT_GENDER = "FEMALE"; // I'm gender equal, the default is alphabetically first
const DEFAULT_NO_BREAK_PHRASES = true;
const DEFAULT_SMOOTH_READ = true;
const DEFAULT_TRANSLATE = false;
const DEFAULT_FIX_CC_PUNC_AUTOAPPEND = true;
const RATE_LIMIT = 500; // characters per request
const CHORD_DELAY = 10; // milliseconds
const FORM_POPUP_CALL_COUNT = 10;
const TTS_ENDPOINT = process.env.REACT_APP_VOICEBOX_TTS_ENDPOINT || "https://texttospeech.googleapis.com/v1/";
const TRANSLATE_ENDPOINT = process.env.REACT_APP_VOICEBOX_TRANSLATE_ENDPOINT || "https://translation.googleapis.com/language/translate/v2/";
const ENV_API_KEY = process.env.REACT_APP_VOICEBOX_API_KEY || "";
const FORM_URL = process.env.REACT_APP_FORM_URL || "";
const MAGIC_DEBUG_STRING = process.env.REACT_APP_VOICEBOX_MAGIC_DEBUG_STRING || "";

/*
TODO
====
- Make realtime mode work
- Save output to local storage, clear button
- Click to view API key, error red API field if invalid
- Support read speed
 */

export default function VoiceBoxMain() {
	const [apiKey, setApiKey] = useState(ENV_API_KEY);
	const [language, setLanguage] = useState(DEFAULT_LANG);
	const [availableLanguages, setAvailableLanguages] = useState([]);
	const [gender, setGender] = useState(DEFAULT_GENDER);
	const [availableVoices, setAvailableVoices] = useState([]);
	const [voice, setVoice] = useState("");
	const [readOn, setReadOn] = useState(DEFAULT_READ_ON);
	const [noBreakPhrases, setNoBreakPhrases] = useState(DEFAULT_NO_BREAK_PHRASES);
	const [smoothRead, setSmoothRead] = useState(DEFAULT_SMOOTH_READ);
	const [translate, setTranslate] = useState(DEFAULT_TRANSLATE);
	const [fixCCPuncAutoappend, setFixCCPuncAutoappend] = useState(DEFAULT_FIX_CC_PUNC_AUTOAPPEND);
	const [timerRunning, setTimerRunning] = useState(false);
	const [formPopupOpen, setFormPopupOpen] = useState(false);
	const [numAPICalls, setNumAPICalls] = useState(0);
	const [magicDebug, setMagicDebug] = useState(false);
	const audioQueue = useState(queue({autostart: true, concurrency: 1}))[0];
	const inputArea = document.getElementById("inputArea");
	const outputArea = document.getElementById("outputArea");

	// ------------- Debug logging stuff -------------
	const vbLog = useCallback((message) => {
		if (process.env.NODE_ENV !== "production" || magicDebug) {
			console.log("VoiceBox: " + message);
		}
		if (magicDebug) {
			document.getElementById('console').value += message + "\n";
		}
	}, [magicDebug]);
	// ------------------------------------------------

	// Get available languages from voices:list endpoint
	useEffect(() => {
		if (!apiKey) {
			return;
		}
		let langs = [];
		const url = TTS_ENDPOINT + "voices?key=" + apiKey;
		fetch(url).then(response => response.json()).then(data => {
			langs = data["voices"].map(voice => voice["languageCodes"][0]);

			// Remove duplicates and sort
			langs = [...new Set(langs)].sort();
			vbLog("Available languages: " + langs);
		}).catch(error => {
			vbLog("Error getting available languages: " + error);
		}).finally(() => {
			setAvailableLanguages(langs);
		});
	}, [apiKey, vbLog]);

	// Get available voices from voices:list endpoint
	useEffect(() => {
		if (!apiKey || !language) {
			return;
		}
		let voices = [];
		const url = TTS_ENDPOINT + "voices?languageCode=" + language + "&key=" + apiKey;
		fetch(url).then(r => r.json()).then(data => {
			voices = data["voices"].filter(voice =>
				voice.ssmlGender === gender && !voice.name.includes("Studio") && voice.name.startsWith(language)
			).map(voice => voice.name);
			voices.sort();
			vbLog("Available voices: " + voices);
		}).catch(error => {
			vbLog("Error getting available voices: " + error);
		}).finally(() => {
			setAvailableVoices(voices);
		});
	}, [apiKey, language, gender, vbLog]);

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

		// Gender
		const gender = localStorage.getItem("gender");
		if (gender) {
			setGender(gender);
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

		// Whether to translate
		const translateSetting = localStorage.getItem("translate");
		if (translateSetting) {
			setTranslate(translateSetting === "true");
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
			audioQueue.concurrency = (smoothReadSetting === "true") ? 1 : 3;
		}
	}, [vbLog, audioQueue]);

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

	function triggerFormPopup() {
		if (localStorage.getItem("formPopupShown") === "true") {
			return;
		}
		setFormPopupOpen(true);
		localStorage.setItem("formPopupShown", "true");
	}

	function callGoogleTTSAPI(text) {
		// Call Google TTS API
		vbLog(`API call on: ${text} with API key: ${apiKey} and language: ${language}`);
		const url = TTS_ENDPOINT + "text:synthesize?key=" + apiKey;
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
				vbLog("Error: No audio returned from API");
			}
			audioQueue.push(() => {
				return new Promise((resolve, reject) => {
					audio.onended = resolve;
					audio.onerror = reject;
					audio.play().catch(e => vbLog("Error playing audio: " + e));
				});
			});
		}).catch(e => vbLog("Error calling API: " + e));
	}

	function processText(text) {

		// Trim input text to last occurrence of any char in readOn
		// let text = inputArea.value;
		// if (text.length > 0) {
		// 	const lastReadOn = Math.max(...readOn.split("").map(char => text.lastIndexOf(char)));
		// 	if (lastReadOn !== -1) {
		// 		text = text.substring(0, lastReadOn + 1);
		// 	}
		// }

		if (fixCCPuncAutoappend) { // Fix CharaChorder punctuation auto-append
			if (text.length === 2 && readOn.includes(text[0]) && text[1] === " ") {
				text = text.slice(0, -2); // don't speak ^[punctuation][space]$
			} else if (text[text.length - 2] === " " && readOn.includes(text[text.length - 1])) {
				text = text.slice(0, -2) + text[text.length - 1] + " "; // manually swap .*[space][punctuation]$
			}
		}

		// Don't call API if text is empty or only whitespace
		if (text.trim() === "") {
			return false;
		}

		// Move input text to read text
		// inputArea.value = inputArea.value.substring(text.length);
		inputArea.value = "";
		if (outputArea.value === "") {
			outputArea.value = text;
		} else {
			outputArea.value += "\n" + text;
		}

		// Increment API call count
		setNumAPICalls(numAPICalls + 1);

		// Show form popup if target call count reached
		if (numAPICalls === FORM_POPUP_CALL_COUNT) {
			triggerFormPopup();
		}

		// Translate text
		if (translate) {
			vbLog(`Translating: ${text} to ${language}`);
			const url = TRANSLATE_ENDPOINT + "?format=text&q=" + text + "&target=" + language + "&key=" + apiKey;
			const options = {
				method: "POST"
			}
			fetch(url, options).then(r => r.json()).then(data => {
				vbLog(`Translated to: ${data["data"]["translations"][0]["translatedText"]}`);
				text = data["data"]["translations"][0]["translatedText"];
				outputArea.value += "\n[" + text + "]"; // add translated text to output area
				callGoogleTTSAPI(text);
			}).catch(error => {
				vbLog("Error translating: " + error);
			});
		} else {
			callGoogleTTSAPI(text);
		}

		// Check for and enable magic debug mode
		if (!magicDebug && text === MAGIC_DEBUG_STRING) {
			setMagicDebug(true);
		}
		return true;
	}

	function onInputTextChange(event) {

		// Limit input to rate limit
		if (event.target.value.length > RATE_LIMIT) {
			event.target.value = event.target.value.slice(0, RATE_LIMIT);
		}

		if (timerRunning || event.target.value === "") {
			return;
		}

		// If last character is newline or period, call API on last input
		if ((readOn + "\n").includes(event.target.value.slice(-1))) {
			if (noBreakPhrases) { // delay to allow for chord detection
				setTimerRunning(true);
				setTimeout(() => {
					processText(event.target.value);
					setTimerRunning(false);
				}, CHORD_DELAY);
			} else {
				processText(event.target.value);
			}
		}
	}

	function onApiKeyChange(event) {
		setApiKey(event.target.value);
		localStorage.setItem("apiKey", event.target.value);
		vbLog("API key set to: " + event.target.value);
	}

	function closeFormPopup() {
		setFormPopupOpen(false);
	}

	return (<div>
		<form>
			<TextField id="outputArea" className="notaninput io" rows={10} multiline
			           style={{caretColor: "transparent"}}/>
			<TextField id="inputArea" className="io" maxRows={10} onChange={onInputTextChange} autoFocus multiline
			           placeholder="Start typing here..."/>
			<Box className="fit-center" sx={{border: 1, borderColor: "grey.700", borderRadius: 1}}>
				<FormControl className="flex-center top-margin">
					<TextField id="readOnLabel" label="Read on" variant="outlined" value={readOn} size="small"
					           onChange={(e) => {
						           setReadOn(e.target.value);
						           localStorage.setItem("readOn", e.target.value);
					           }} style={{marginRight: "0.5em"}} sx={{'.MuiInputBase-input': {fontFamily: "monospace"}}}
					/>
					<FormControlLabel checked={noBreakPhrases} control={<Checkbox onChange={(e) => {
						setNoBreakPhrases(e.target.checked);
						localStorage.setItem("noBreakPhrases", e.target.checked);
					}}/>} label="Don't break phrases"/>
					<FormControlLabel checked={smoothRead} control={<Checkbox onChange={(e) => {
						setSmoothRead(e.target.checked);
						audioQueue.concurrency = e.target.checked ? 1 : 3;
						localStorage.setItem("smoothRead", e.target.checked);
					}}/>} label="Read smoothly"/>
				</FormControl>
				<FormControl className="flex-center bottom-margin">
					<FormControlLabel checked={translate} control={<Checkbox onChange={(e) => {
						setTranslate(e.target.checked);
						localStorage.setItem("translate", e.target.checked);

						// Remove space from readOn if translate is enabled
						if (e.target.checked) {
							setReadOn(readOn.replace(" ", ""));
							localStorage.setItem("readOn", readOn.replace(" ", ""));
						}
					}}/>} label="Translate with Google"/>
					<Tooltip title="Allow CharaChorder punctuation auto-append">
						<FormControlLabel checked={fixCCPuncAutoappend} control={<Checkbox onChange={(e) => {
							setFixCCPuncAutoappend(e.target.checked);
							localStorage.setItem("fixCCPuncAutoappend", e.target.checked);
						}}/>} label="CharaChorder punctuation"/>
					</Tooltip>
				</FormControl>
				<div className="flex-center bottom-margin">
					<Autocomplete id="languageSelect" options={availableLanguages} value={language} sx={{minWidth: 150}}
					              renderInput={(params) => <TextField {...params} label="Language" variant="outlined"/>}
					              onChange={(e, v) => {
						              setLanguage(v);
						              localStorage.setItem("language", v || '');

						              // Clear voice
						              setVoice('');
						              localStorage.setItem("voice", '');
					              }} defaultValue={DEFAULT_LANG} size="small"/>
					<FormControl>
						<InputLabel id="genderSelectLabel">Gender</InputLabel>
						<Select id="genderSelect" labelId={"genderSelectLabel"} label="Gender" onChange={(e) => {
							setGender(e.target.value);
							localStorage.setItem("gender", e.target.value || '');

							// Clear voice
							setVoice('');
							localStorage.setItem("voice", '');
						}} value={gender} defaultValue={DEFAULT_GENDER} style={{flexGrow: 1}} size="small">
							<MenuItem value={"FEMALE"}>Female</MenuItem>
							<MenuItem value={"MALE"}>Male</MenuItem>
						</Select>
					</FormControl>
					<Autocomplete id="voiceSelect" className="voice-select" options={availableVoices}
					              renderInput={(params) => <TextField {...params} label="Voice" variant="outlined"/>}
					              onChange={(e, v) => {
						              setVoice(v);
						              localStorage.setItem("voice", v || '');
					              }} value={voice} defaultValue={availableVoices[0]} size="small"/>
				</div>
				{!ENV_API_KEY && <FormControl className="flex-center" style={{margin: "0.5em"}}>
					<TextField id="apiKey" type="password" label="API Key" variant="outlined" value={apiKey}
					           onChange={onApiKeyChange} size="small"/>
				</FormControl>}
			</Box>
			{magicDebug && <TextField className="notaninput io" rows={10} id="console" multiline style={{
				caretColor: "transparent", backgroundColor: "darkred"
			}}/>}
		</form>
		{FORM_URL && <FormPopup formURL={FORM_URL} open={formPopupOpen} handleClose={closeFormPopup}/>}
	</div>);
}
