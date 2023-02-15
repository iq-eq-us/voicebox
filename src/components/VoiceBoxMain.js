import React, {useEffect, useState} from "react";
import './VoiceBoxMain.css';
import {
	TextareaAutosize, RadioGroup, Radio, FormControlLabel, Autocomplete, TextField
} from "@mui/material";
import queue from "queue";

const stopChars = [".", "!", "?", ";", ":", "\n"];
const defaultLanguage = "en-US";

/*
TODO
====
✓ Start focus on input box and make next tab index toggling read type
✓ Typing anywhere should focus on input box
✓ Support multiple languages
- Support multiple voices
- Support read speed
- Rate limiting
- Google form popup
- Save readOn setting to local storage
 */

export default function VoiceBoxMain(callback, deps) {
	const [apiKey, setApiKey] = useState("");
	const [language, setLanguage] = useState(defaultLanguage);
	const [availableLanguages, setAvailableLanguages] = useState([]);
	const [inputText, setInputText] = useState("");
	const [readText, setReadText] = useState("");
	const [readOnComma, setReadOnComma] = useState(true);
	const [readOnSpace, setReadOnSpace] = useState(false);
	const audioQueue = queue({autostart: false, concurrency: 1});
	const inputArea = document.getElementById("inputArea");

	useEffect(() => {
		if (!apiKey) {
			return;
		}

		// Get available languages from voices:list endpoint
		let langs = [];
		const url = "https://texttospeech.googleapis.com/v1/voices?key=" + apiKey;
		fetch(url).then(response => response.json()).then(data => {
			langs = data.voices.map(voice => voice.languageCodes[0]);

			// Remove duplicates and sort
			langs = [...new Set(langs)].sort();
			console.log("Available languages: " + langs);
		}).catch(error => {
			console.log("Error getting available languages: " + error);
		}).finally(() => {
			setAvailableLanguages(langs);
		});
	}, [apiKey]);

	// Get settings from local storage
	useEffect(() => {
		console.log("VoiceBoxMain useEffect called");
		// Get API key from local storage
		const key = localStorage.getItem("apiKey");
		if (key) {
			setApiKey(key);
		}

		// Get language from local storage
		const lang = localStorage.getItem("language");
		if (lang) {
			setLanguage(lang);
		}

		// TODO: Get readOn settings from local storage
		// const readOnSetting = localStorage.getItem("readOn");
		// setReadOnComma(true);
		// setReadOnSpace(false);
		// if (readOnSetting === "sentence") {
		// 	setReadOnComma(true);
		// } else if (readOnSetting === "space") {
		// 	setReadOnSpace(true);
		// }

		// Set right radio button
		// if (readOnSetting === "sentence") {
		// 	document.getElementById("readOnSentence").checked = true;
		// }
		// if (readOnSetting === "comma") {
		// 	document.getElementById("readOnComma").checked = true;
		// }
		// if (readOnSetting === "space") {
		// 	document.getElementById("readOnSpace").checked = true;
		// }
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

	function onInputTextChange(event) {
		setInputText(event.target.value);

		// If last character is newline or period, call API on last input
		if (stopChars.includes(event.target.value.slice(-1)) || (readOnComma && event.target.value.slice(-1) === ",") || (readOnSpace && event.target.value.slice(-1) === " ")) {
			console.log(`API call on: ${event.target.value} with API key: ${apiKey} and language: ${language}`);

			// Move input text to read text
			if (readText === "") {
				setReadText(event.target.value);
			} else {
				setReadText(readText + "\n" + event.target.value);
			}
			setInputText("");

			// Call Google TTS API
			const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;
			const body = JSON.stringify({
				"input": {
					"text": event.target.value
				}, "voice": {
					"languageCode": language, "name": "en-US-Wavenet-A", "ssmlGender": "FEMALE"
				}, "audioConfig": {
					"audioEncoding": "MP3"
				}
			});
			const options = {
				method: "POST", body
			};
			fetch(url, options).then(r => r.json()).then(data => {
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
				audioQueue.start();
			}).catch(e => console.error(e));
		}
	}

	function onApiKeyChange(event) {
		setApiKey(event.target.value);
		localStorage.setItem("apiKey", event.target.value);
		console.log("API key set to: " + event.target.value);
	}

	return (<div>
		<form>
			<TextareaAutosize
				className="notaninput"
				minRows={15}
				style={{
					caretColor: "transparent", height: 200
				}}
				value={readText}
			/>
			<TextareaAutosize
				minRows={15}
				style={{
					height: 100
				}}
				placeholder="Start typing here..."
				value={inputText}
				onChange={onInputTextChange}
				id={"inputArea"}
				autoFocus
			/>
			<RadioGroup row aria-label="readOn" name="readOn" defaultValue="comma">
				<label>
					Read on: &nbsp;
					<FormControlLabel id="readOnSentence" value="sentence" control={<Radio/>} label="sentence"
					                  onChange={() => {
						                  setReadOnComma(false);
						                  setReadOnSpace(false);
						                  localStorage.setItem("readOn", "sentence");
					                  }}/>
					<FormControlLabel id="readOnComma" value="comma" control={<Radio/>} label="comma" onChange={() => {
						setReadOnComma(true);
						setReadOnSpace(false);
						localStorage.setItem("readOn", "comma");
					}}/>
					<FormControlLabel id="readOnSpace" value="space" control={<Radio/>} label="space" onChange={() => {
						setReadOnComma(false);
						setReadOnSpace(true);
						localStorage.setItem("readOn", "space");
					}}/>
				</label>
			</RadioGroup>
			<Autocomplete id="languageSelect" options={availableLanguages}
			              renderInput={(params) => <TextField {...params} label="Language" variant="outlined"/>}
			              onChange={(e, v) => {
				              setLanguage(v);
				              localStorage.setItem("language", v || '');
			              }} value={language} defaultValue={defaultLanguage}/>
			<label>
				API Key: &nbsp;
				<input type="password" value={apiKey} onChange={onApiKeyChange}/>
			</label>
		</form>
		<p>&#169; 2023 <a href={"https://charachorder.com"}>CharaChorder Inc.</a></p>
	</div>);
}
