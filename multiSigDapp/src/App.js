import React from 'react';
import './App.css';
import Header from './components/Header';
import MultiSigListing from './components/MultiSigListing';
function App() {
  return (
    <>
      <div className="container mx-auto px-5 2xl:px-0">
        <Header/>
        <MultiSigListing/>
      </div>
    </>
  );
}
export default App;
