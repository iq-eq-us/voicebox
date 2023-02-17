import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import logo from './iq-eq_logo.png';
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
				<a href={iqeqLink} target={"_blank"} rel="noopener"><img src={logo} className="App-logo" alt="logo" /></a>
				<h1>
					VoiceBox
				</h1>
			</header>
			<div className="App-body">
				{/*Main input field (VoiceBoxTextField)*/}
				<VoiceBoxMain id={"VoiceBox-main"}/>
			</div>
		</div>
		<footer className="App-footer">
			<small>&copy; 2023 by <a href={iqeqLink} target={"_blank"} rel="noopener">iq-eq</a></small>
		</footer>
	</ThemeProvider>);
}

export default App;
