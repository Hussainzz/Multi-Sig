import React, { useState } from "react";
import { ethers } from "ethers";
import ButtonWithLoader from "./ButtonWithLoader";
import { toast } from "react-toastify";
import useContractW from "../hooks/useContractW";
import MultiSigABI from "../contracts/MultiSig.json";
import useFetchContract from "../hooks/useFetchContract";

const ContractExplorer = ({selectedWallet}) => {
  const {getContractFromApi} = useFetchContract();
  const [contractFunctions, setContractFunctions] = useState(null);
  const [contract, setContract] = useState(null);
  const [functionInputData, setFunctionInputData] = useState([]);
  const [addressFetch, setAddressFetch] = useState('');

  const multiSigAddr =
  selectedWallet?.multiSigAddress || ethers.constants.AddressZero;
  const { write: submitP, isLoading } = useContractW({
    abi:  MultiSigABI.abi,
    cAddr: multiSigAddr,
    funcName: "submitProposal",
    txnSuccess: async (d) => {
      console.log(d);
      toast.success("Proposal submitted successfully")
    },
    txnError: (e) => {
      console.log(e);
    }
  });


  const validateFuncValue = (type, value) => {
    let val = null;
    switch (type) {
        case "array":
            try {
                val = JSON.parse(value);
            } catch (error) {
                //console.log(error)
            }
            break;
        case "address":
            if(ethers.utils.isAddress(value)){
                val = value;
            }
            break;
        case "uint256":
            val = value;
            break; 
        case "bytes":
            if(ethers.utils.isHexString(value)){
                val = value;
            }
            break;
    }
    return val
  }

  const proposeHandler = (func) => {
    if(!contract) return;
    if(func){
        const toExecuteAddress = contract?.address;
        const fName = func[1].name;
        const data = functionInputData.filter(f => f.inputName.split("_")[0] === fName)
        if(data.length){
            let args = [];

            let payable =  func[1].payable ?? false;

            let valueInTxn = ethers.utils.parseEther("0");
            if(payable){
              let valueTxn = functionInputData.find(f => fName === f.name)
              valueTxn = valueTxn["value"] ?? "0"
              if(valueTxn === "0"){
                toast.error(`Invalid arguments ${fName}`);return;
              }
              valueInTxn = ethers.utils.parseEther(valueTxn);
            } 

            let fInputs =  func[1].inputs;
            for(let i = 0; i < fInputs.length; i++){
                const a = data.find(d => d.name === fInputs[i].name);
                if(a){
                    let val = validateFuncValue(fInputs[i].baseType, a.value)
                    if(val == null){break};
                        args[i] = val;
                }
            }
            if(args.length !== fInputs.length){
                toast.error(`Invalid arguments ${fName}`);
                return;
            }
      
            const callData = contract.interface.encodeFunctionData(
                fName,
                args
              );

            const submitArgs = [
                `${fName} - Proposal`,
                toExecuteAddress,
                valueInTxn,
                callData,
            ];
          
            submitP({
                recklesslySetUnpreparedArgs: submitArgs,
            });
        }
    }
  }

  const onInputChangeHandler = (input, event) =>{
    event.preventDefault();
    event.persist();

    let dataIndex = functionInputData.findIndex(d => d.name === input.name);

    let oldData = [...functionInputData]

    let inputVal = event.target.value;

    const inpObj = {
        name: input.name,
        baseType: input.baseType,
        value: inputVal,
        inputName: event.target.name
    }

    if(dataIndex !== -1){
        oldData[dataIndex] =  inpObj
        setFunctionInputData(oldData)
    }else{
        setFunctionInputData(prev => {
            return [
                ...prev,
                {
                    ...inpObj
                }
            ]
        })
    }
  }

  const getH = async () => {
    if(!ethers.utils.isAddress(addressFetch)){
        toast.error("Invalid Address");
        return;
    }
    await getContract(addressFetch)
  };

  const getContract = async (addressToFetch) => {
    const verifiedContract = await getContractFromApi(addressToFetch);
    if (verifiedContract) {
      let contractFunctions = verifiedContract.interface.functions;
      contractFunctions = Object.entries(contractFunctions).filter(
        (f, i) =>
          f[1]["type"] === "function" &&
          f[1]["stateMutability"] !== "view" &&
          f[1]["stateMutability"] !== "pure"
      );
      console.log(contractFunctions)
      setContractFunctions(contractFunctions);
      setContract(verifiedContract);
    }else{
        toast.info("Contract not verified");
    }
  };

  const getFunctionInput = (funcName, input) => {
    let inputJsx = "";
    
    inputJsx = <input
        type="text"
        name={`${funcName}_${input.name}`}
        placeholder={`${input.type} ${input.name}`}
        className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-xs border-0 shadow outline-none focus:outline-none focus:ring min-w-full"
        onChange={(e)=>{onInputChangeHandler(input, e)}}
      />
    return inputJsx;
  }

  if(!selectedWallet){
    return <></>
  }

  return (
    <div>
      <div className="p-4">
        <p className="mt-3 mb-3 italic text-gray-600 text-xs"> Try this test address: 0x70B3822A36313446562d31b26Ed0da2cF9CC8a0D</p>
        <input
            type="text"
            placeholder={`Verified Polygon Mumbai Contract Address`}
            className="px-3 py-3 placeholder-slate-500 text-slate-900 relative rounded text-xs border-0 shadow-lg shadow-indigo-600/40 outline-none focus:outline-none focus:ring min-w-full"
            onChange={(e)=>{setAddressFetch(e.target.value)}}
            value={addressFetch}
        />
        <ButtonWithLoader btnColor="bg-black mt-4" btnTxt={"fetch"} onClickHandler={getH} />
      </div>
      <ul className={`divide-y-2 divide-gray-100`}>
        {contractFunctions &&
          contractFunctions.map((c, cidx) => (
           c[1].inputs.length ? (
                <li key={cidx} className="mt-2 p-3 bg-cyan-100">
                    <div className="col-start-1 col-end-3">
                    <span className="font-bold">{c[1].name}</span>
                    <ul className={`divide-y-2 divide-gray-100`}>
                        {c[1].inputs.map((input, idx) => (
                            <li key={idx} className="mt-2">
                                {getFunctionInput(c[1].name, input)}
                            </li>
                        ))}
                    </ul>
                    {c[1].payable && <input
                        type="number"
                        placeholder={`(Payable) Value 💸`}
                        className="px-3 py-3 placeholder-slate-400 text-slate-900 relative bg-grey bg-grey rounded text-xs border-0 shadow outline-none focus:outline-none focus:ring min-w-full mt-2"
                        min={0}
                        name={`${c[1].name}_payable_val`}
                        onChange={(e)=>{onInputChangeHandler(c[1], e)}}
                    />}
                    <ButtonWithLoader btnTxt={"Propose"} btnColor="bg-black mt-3" onClickHandler={()=>{proposeHandler(c)}} isLoading={isLoading}/>
                    </div>
                </li>
            ):""
          ))}
      </ul>
    </div>
  );
};

export default ContractExplorer;
