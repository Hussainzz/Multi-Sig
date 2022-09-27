import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { isMobile } from "react-device-detect";
import walletImg from "./wallet.jpg";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { WagmiConfig, createClient, configureChains, chain } from "wagmi";

import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { MetaMaskConnector } from "wagmi/connectors/metaMask";
// import { getNetwork, JsonRpcProvider } from '@ethersproject/providers';
// import { ethers } from 'ethers';

// Configure chains & providers with the Alchemy provider.
// Two popular providers are Alchemy (alchemy.com) and Infura (infura.io)
const { chains, provider, webSocketProvider } = configureChains(
  [chain.polygonMumbai],
  [
    alchemyProvider({ apiKey: process.env.REACT_ALCHEMY_API_KEY }),
    publicProvider(),
  ]
);

// Set up client
const client = createClient({
  autoConnect: true,
  connectors: [new MetaMaskConnector({ chains })],
  provider,
  webSocketProvider,
});

//---- Localhost setup ------
// const ethProvider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545/", 31337)
// const connector = new MetaMaskConnector({chains: [chain.hardhat]});
// const client = createClient({
//     autoConnect: true,
//     provider: ethProvider,
//     connectors: [connector],
// });

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    {!isMobile ? (
      <WagmiConfig client={client}>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          closeOnClick={false}
          draggable={false}
        />
        <App />
      </WagmiConfig>
    ) : (
      <div className="container px-5 2xl:px-0 font-extrabold flex h-screen">
        <div className="m-auto">
          <img className="object-cover h-48 w-96 mb-4" src={walletImg}/>
          <span className="mt-4">Wallet Demo Works Great In Browser 😁</span>
        </div>
       
      </div>
    )}
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
