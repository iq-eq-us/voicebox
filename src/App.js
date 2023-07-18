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
				<a href={iqeqLink} target={"_blank"} rel="noopener"><img src="logo512.png" className="App-logo"
				                                                         alt="logo"/></a>
				<h1>
					VoiceBox
				</h1>
			</header>
			<div className="App-body">
				<VoiceBoxMain id={"VoiceBox-main"}/>
			</div>
		</div>
		<footer>
			<div className="App-footer">
				<small>&copy; 2023 by <a href={iqeqLink} target={"_blank"} rel="noopener">iq-eq</a></small>
			</div>
			<div className="App-footer">
				<img src="white-short.svg" alt="Translated by Google"/>
			</div>
			<div className="Disclaimer">
				<small>
					This service may contain translations powered by Google. iq-eq and Google disclaim all warranties
					related to the translations, express or implied, including any warranties of accuracy, reliability,
					and any implied warranties of merchantability, fitness for a particular purpose and noninfringement.
				</small>
			</div>
		</footer>
	</ThemeProvider>);
}

export default App;
