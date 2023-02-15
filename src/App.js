import {ThemeProvider, createTheme} from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import logo from './CharaChorder_logo_dark_black.webp';
import './App.css';
import VoiceBoxMain from "./components/VoiceBoxMain";

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
				<br/>
				<img src={logo} className="App-logo" alt="logo"/>
				<h1>
					CharaChorder VoiceBox
				</h1>
			</header>
			<div className="App-body">
				{/*Main input field (VoiceBoxTextField)*/}
				<VoiceBoxMain id={"VoiceBox-main"}/>
			</div>
		</div>
	</ThemeProvider>);
}

export default App;
