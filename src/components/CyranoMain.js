import React, { useState } from "react";
import {TextareaAutosize} from "@mui/material";

export default function CyranoMain() {
	const [apiKey, setApiKey] = useState("");
	const [inputText, setInputText] = useState("");

	function onChange(event) {
		setInputText(event.target.value);
		// If last character is newline or period, call API on last input
		if (event.target.value.endsWith("\n") || event.target.value.endsWith(".")) {
			console.log(`API call on: ${event.target.value} with API key: ${apiKey}`);
		}
	}

	return (
		<form>
			<label>
				API Key:
				<input type="text" value={apiKey} onChange={(event) => setApiKey(event.target.value)} />
			</label>
			<TextareaAutosize
				minRows={15}
				style={{ width: 500 }}
				placeholder="Start typing here..."
				value={inputText}
				onChange={onChange}
			/>
		</form>
	);
}
