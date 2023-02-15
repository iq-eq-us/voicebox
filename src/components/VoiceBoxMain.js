import React, {useEffect, useState} from "react";
import './VoiceBoxMain.css';
import {
	TextareaAutosize,
	RadioGroup,
	Radio,
	FormControlLabel,
	Autocomplete,
	TextField,
	InputLabel,
	MenuItem,
	Select,
	FormControl,
	FormLabel,
	Box
} from "@mui/material";
import queue from "queue";

const stopChars = [".", "!", "?", ";", ":", "\n"];
const defaultLanguage = "en-US";
const defaultGender = "FEMALE";
const ENV_API_KEY = process.env.VOICEBOX_API_KEY || "";

/*
TODO
====
✓ Start focus on input box and make next tab index toggling read type
✓ Typing anywhere should focus on input box
✓ Support multiple languages
✓ Support multiple voices
- Rate limiting
- Google form popup
- Save readOn setting to local storage
- Use MUI for all input fields
- Support read speed
 */

function vbLog(message) {
	if ("production" !== process.env.NODE_ENV) console.log("VoiceBox: " + message);
}

export default function VoiceBoxMain() {
	const [apiKey, setApiKey] = useState(ENV_API_KEY);
	const [language, setLanguage] = useState(defaultLanguage);
	const [availableLanguages, setAvailableLanguages] = useState([]);
	const [gender, setGender] = useState(defaultGender);
	const [availableVoices, setAvailableVoices] = useState([]);
	const [voice, setVoice] = useState("");
	const [inputText, setInputText] = useState("");
	const [readText, setReadText] = useState("");
	const [readOn, setReadOn] = useState("comma");
	const audioQueue = queue({autostart: false, concurrency: 1});
	const inputArea = document.getElementById("inputArea");

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

		// Get voice from local storage
		const voice = localStorage.getItem("voice");
		if (voice) {
			setVoice(voice);
		}

		// Get readOn setting from local storage
		const readOnSetting = localStorage.getItem("readOn");
		if (readOnSetting) {
			setReadOn(readOnSetting);
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

	function onInputTextChange(event) {
		setInputText(event.target.value);

		// If last character is newline or period, call API on last input
		if (stopChars.includes(event.target.value.slice(-1)) || (readOn === "comma" && event.target.value.slice(-1) === ",") || (readOn === "space" && event.target.value.slice(-1) === " ")) {
			vbLog(`API call on: ${event.target.value} with API key: ${apiKey} and language: ${language}`);

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
					"languageCode": language, "name": voice, "ssmlGender": gender
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
		vbLog("API key set to: " + event.target.value);
	}

	return (<div>
		<form>
			<TextareaAutosize
				className="notaninput"
				minRows={15}
				style={{caretColor: "transparent", height: 200}}
				value={readText}
			/>
			<TextareaAutosize
				minRows={15}
				style={{height: 100}}
				placeholder="Start typing here..."
				value={inputText}
				onChange={onInputTextChange}
				id={"inputArea"}
				autoFocus
			/>
			<Box sx={{border: 1, borderColor: "white", borderRadius: 1}}>
				<FormControl
					style={{display: "flex", flexDirection: "row", justifyContent: "center", margin: "0.5em 0"}}>
					<FormLabel id="readOnLabel" sx={{fontSize: ""}}>Read on: &nbsp;</FormLabel>
					<RadioGroup row name="readOn"
					            aria-labelledby="readOnLabel" defaultValue="comma" value={readOn} onChange={(e) => {
						setReadOn(e.target.value);
						localStorage.setItem("readOn", e.target.value);
					}}>
						<FormControlLabel value="sentence" control={<Radio/>} label="sentence"/>
						<FormControlLabel value="comma" control={<Radio/>} label="comma"/>
						<FormControlLabel value="space" control={<Radio/>} label="space"/>
					</RadioGroup>
				</FormControl>
				<div style={{display: "flex", flexDirection: "row", justifyContent: "center"}}>
					<Autocomplete id="languageSelect" options={availableLanguages} sx={{minWidth: 150}}
					              renderInput={(params) => <TextField {...params} label="Language" variant="outlined"/>}
					              onChange={(e, v) => {
						              setLanguage(v);
						              localStorage.setItem("language", v || '');

						              // Clear voice
						              setVoice('');
						              localStorage.setItem("voice", '');
					              }} value={language} defaultValue={defaultLanguage}/>
					<FormControl>
						<InputLabel id="genderSelectLabel">Gender</InputLabel>
						<Select id="genderSelect" labelId={"genderSelectLabel"} label="Gender" onChange={(e) => {
							setGender(e.target.value);
							localStorage.setItem("gender", e.target.value || '');

							// Clear voice
							setVoice('');
							localStorage.setItem("voice", '');
						}} value={gender} defaultValue={defaultGender} style={{flexGrow: 1}}>
							<MenuItem value={"FEMALE"}>Female</MenuItem>
							<MenuItem value={"MALE"}>Male</MenuItem>
						</Select>
					</FormControl>
					<Autocomplete id="voiceSelect" options={availableVoices} sx={{minWidth: 250}}
					              renderInput={(params) => <TextField {...params} label="Voice" variant="outlined"/>}
					              onChange={(e, v) => {
						              setVoice(v);
						              localStorage.setItem("voice", v || '');
					              }} value={voice} defaultValue={availableVoices[0]}/>
				</div>
				{!ENV_API_KEY && <TextField id="readOnLabel" type="password" label="API Key" variant="outlined"
				                            onChange={onApiKeyChange} value={apiKey}/>}
			</Box>
		</form>
	</div>);
}
