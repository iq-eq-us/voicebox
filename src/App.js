import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import './App.css';
import VoiceBoxMain from "./components/VoiceBoxMain";
import React from "react";

const darkTheme = createTheme({
	palette: {
		mode: 'dark',
	},
});

const iqeqLink = "https://iq-eq.us/";

function App() {
	return (<ThemeProvider theme={darkTheme}>
		<CssBaseline enableColorScheme/>
		<div className="App">
			<header className="App-header">
				<a href={iqeqLink} target={"_blank"} rel="noopener"><img src="logo512.png" className="App-logo" alt="logo" /></a>
				<h1>
					VoiceBox
				</h1>
			</header>
			<div className="App-body">
				<VoiceBoxMain id={"VoiceBox-main"}/>
			</div>
		</div>
		<footer className="App-footer">
			<small>&copy; 2023 by <a href={iqeqLink} target={"_blank"} rel="noopener">iq-eq</a></small>
		</footer>
	</ThemeProvider>);
}

export default App;
