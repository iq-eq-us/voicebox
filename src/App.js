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

function App() {
	return (<ThemeProvider theme={darkTheme}>
		<CssBaseline/>
		<div className="App">
			<header className="App-header">
				<img src={logo} className="App-logo" alt="logo"/>
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
			<small>&copy; 2023 <a href={"https://charachorder.com"}>CharaChorder LLC</a></small>
		</footer>
	</ThemeProvider>);
}

export default App;
