import React from "react";
import axios from "axios";
import { ethers } from "ethers";
import { init } from "etherscan-api";
import { useSigner } from "wagmi";

const POLY_API = process.env.REACT_APP_POLY_API;
const POLYGON_API_KEY = process.env.REACT_APP_POLYGON_API_KEY;

const useFetchContract = () => {
  const { data: signer } = useSigner();
  const getContractFromApi = async (addressToFetch) => {
    try {
      const timeout = 10000;
      const client = axios.create({
        baseURL: POLY_API,
        timeout: timeout,
      });
      const eClient = init(POLYGON_API_KEY, "mumbai", timeout, client);
      const verifiedContract = await fetchABI(eClient, addressToFetch);
      return verifiedContract;
    } catch (error) {
      return null;
    }
  };

  const fetchABI = async (client, addressToFetch) => {
    if (!ethers.utils.isAddress(addressToFetch)) return null;
    let response;
    try {
      response = await client.contract.getabi(addressToFetch);
    } catch (e) {
      console.log(e);
      return null;
    }
    if (response.status !== "1") return null;
    const contractAbi = response.result;

    return new ethers.Contract(addressToFetch, contractAbi, signer);
  };

  return {
    getContractFromApi
  };
};

export default useFetchContract;
