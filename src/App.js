import logo from './logo.svg';
import './App.css';
import CyranoTextArea from "./components/CyranoTextArea";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h1>
          Cyrano
        </h1>
      </header>
	  <body className="App-body">
        {/*Main input field (CyranoTextField)*/}
	    <CyranoTextArea />
      </body>
    </div>
  );
}

export default App;
