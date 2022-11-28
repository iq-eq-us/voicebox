import logo from './logo.svg';
import './App.css';
import CyranoMain from "./components/CyranoMain";

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
	    <CyranoMain />
      </body>
    </div>
  );
}

export default App;
