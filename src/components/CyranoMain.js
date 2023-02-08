import React, {useEffect, useState} from "react";
import {TextareaAutosize, RadioGroup, Radio, FormControlLabel} from "@mui/material";
import queue from "queue";

const stopChars = [".", "!", "?", ";", ":", "\n"];

/*
TODO
====
✓ Start focus on input box and make next tab index toggling read type
✓ Typing anywhere should focus on input box
- Support multiple languages
- Support multiple voices
- Support read speed
 */

export default function CyranoMain() {
	const [apiKey, setApiKey] = useState("");
	const [inputText, setInputText] = useState("");
	const [readText, setReadText] = useState("");
	const [readOnComma, setReadOnComma] = useState(true);
	const [readOnSpace, setReadOnSpace] = useState(false);
	const audioQueue = queue({autostart: false, concurrency: 1});
	const inputArea = document.getElementById("inputArea");

	useEffect(() => {

		function handleKeyDown(e) {
			// Don't handle if any inputs are focused
			if (!document.activeElement.classList.contains("notaninput") &&
				document.activeElement.type !== "radio" &&
				(document.activeElement.tagName === "INPUT" || document.activeElement.tagName === "TEXTAREA")) {
				return;
			}
			// Focus on inputArea if any input key is pressed
			if (e.key !== "Tab" && e.key !== "Shift" && e.key !== "Control" && e.key !== "Alt" && e.key !== "Meta") {
				inputArea.focus();
			}
		}

		document.addEventListener('keydown', handleKeyDown);
		return function cleanup() {
			document.removeEventListener('keydown', handleKeyDown);
		}
	}, [inputArea]);

	function onChange(event) {
		setInputText(event.target.value);

		// If last character is newline or period, call API on last input
		if (stopChars.includes(event.target.value.slice(-1)) ||
			(readOnComma && event.target.value.slice(-1) === ",") ||
			(readOnSpace && event.target.value.slice(-1) === " ")) {
			console.log(`API call on: ${event.target.value} with API key: ${apiKey}`);

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
					"languageCode": "en-US", "name": "en-US-Wavenet-A", "ssmlGender": "FEMALE"
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

	return (<div>
		<form>
			<TextareaAutosize
				class="notaninput"
				minRows={15}
				style={{
					width: 500,
					height: 200,
					display: "flex",
					flexDirection: "column",
					overflowY: "scroll",
					caretColor: "transparent",
					backgroundColor: "black",
					color: "white"
				}}
				value={readText}
				caretColor={"transparent"}
			/>
			<TextareaAutosize
				minRows={15}
				style={{
					width: 500,
					height: 100,
					display: "flex",
					flexDirection: "column",
					overflowY: "scroll",
					backgroundColor: "black",
					color: "white"
				}}
				placeholder="Start typing here..."
				value={inputText}
				onChange={onChange}
				id={"inputArea"}
				autoFocus
			/>
			<RadioGroup row aria-label="readOn" name="readOn" defaultValue="comma">
				<label>
					Read on: &nbsp;
					<FormControlLabel value="sentence" control={<Radio/>} label="sentence" onChange={() => {
						setReadOnComma(false);
						setReadOnSpace(false);
					}}/>
					<FormControlLabel value="comma" control={<Radio/>} label="comma" onChange={() => {
						setReadOnComma(true);
						setReadOnSpace(false);
					}}/>
					<FormControlLabel value="space" control={<Radio/>} label="space" onChange={() => {
						setReadOnComma(true);
						setReadOnSpace(true);
					}}/>
				</label>
			</RadioGroup>
			<label>
				API Key: &nbsp;
				<input type="password" value={apiKey} onChange={(event) => setApiKey(event.target.value)}
				       style={{
					       backgroundColor: "black", color: "white"
				       }}/>
			</label>
		</form>
		<p>Copyright 2023 <a href={"https://raymond.li"}>Raymond Li</a>. Made with ❤️ on <a href={"https://github.com/Raymo111/cyrano"}>GitHub</a></p>
	</div>);
}
