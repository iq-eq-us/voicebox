import React from "react";
import {TextareaAutosize} from "@mui/material";

export default function CyranoTextArea(value, onChange, ...props) {
	function onChange(event) {
		// If last character is newline or period, call API on last input
		if (event.target.value.endsWith("\n") || event.target.value.endsWith(".")) {
			console.log("API call");
		}
	}

	return (
		<TextareaAutosize
			minRows={15}
			style={{ width: 500 }}
			placeholder="Start typing here..."
			onChange={onChange}
		/>
	);
}
