import React, {useState} from "react";
import {TextareaAutosize} from "@mui/material";

export default function CyranoMain() {
	const [apiKey, setApiKey] = useState("");
	const [inputText, setInputText] = useState("");

	function onChange(event) {
		setInputText(event.target.value);

		// If last character is newline or period, call API on last input
		if (event.target.value.endsWith("\n") || event.target.value.endsWith(".")) {
			console.log(`API call on: ${event.target.value} with API key: ${apiKey}`);

			// Call Google TTS API
			const url = "https://texttospeech.googleapis.com/v1/text:synthesize?key=" + apiKey;
			const body = JSON.stringify({
				"input": {
					"text": event.target.value
				},
				"voice": {
					"languageCode": "en-US",
					"name": "en-US-Wavenet-A",
					"ssmlGender": "FEMALE"
				},
				"audioConfig": {
					"audioEncoding": "MP3"
				}
			});
			const options = {
				method: "POST",
				body
			};
			fetch(url, options).then(r => r.json()).then(data => {
				// Play audio
				const audio = new Audio("data:audio/wav;base64," + data.audioContent);
				audio.play().then(r => console.log(r)).catch(e => console.log(e));
			}).catch(e => console.log(e));
		}
	}

	return (
		<form>
			<label>
				API Key:
				<input type="text" value={apiKey} onChange={(event) => setApiKey(event.target.value)}/>
			</label>
			<TextareaAutosize
				minRows={15}
				style={{width: 500}}
				placeholder="Start typing here..."
				value={inputText}
				onChange={onChange}
			/>
		</form>
	);
}
