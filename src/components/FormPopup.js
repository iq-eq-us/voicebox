import React from 'react';
import {Slide, Snackbar, Button} from "@mui/material";
import {ThemeProvider, createTheme} from "@mui/material/styles";

function SlideTransition(props) {
	return <Slide {...props} direction="down"/>;
}

const lightTheme = createTheme({
	palette: {
		mode: 'light',
		secondary: {
			main: '#999999',
		}
	},
});

export default function FormPopup(props) {

	const handleClick = () => {
		window.open(props.formURL, '_blank');
		props.handleClose();
	};

	return (
		<div>
			<Snackbar
				anchorOrigin={{vertical: 'top', horizontal: 'center'}}
				open={props.open}
				message="Have feedback or want the occasional update about VoiceBox?"
				action={
					<ThemeProvider theme={lightTheme}>
						<Button onClick={handleClick}>YES</Button>
						<Button color="secondary" onClick={props.handleClose}>NO</Button>
					</ThemeProvider>}
				TransitionComponent={SlideTransition}
			/>
		</div>
	);
}