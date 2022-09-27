import React, { useEffect } from "react";
import { toast } from "react-toastify";
import { useContractWrite, useWaitForTransaction } from "wagmi";

const useContractW = ({ abi, cAddr, funcName, txnSuccess, txnError }) => {
  const { data, write, isError, error } = useContractWrite({
    mode: "recklesslyUnprepared",
    addressOrName: cAddr,
    contractInterface: abi,
    functionName: funcName
  });

  const { isLoading } = useWaitForTransaction({
    hash: data?.hash,
    onSuccess: txnSuccess,
    onError: txnError
  });

  useEffect(() => {
    if (isError) {
      toast.error(error.reason);
    }
  }, [isError]);

  return {
    isLoading,
    write
  };
};

export default useContractW;
