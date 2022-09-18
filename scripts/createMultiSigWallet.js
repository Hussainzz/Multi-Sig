const { copyFileSync } = require("fs");
const { getNamedAccounts, ethers } = require("hardhat");


const createMultiSigWallet = async() => {
    const {deployer, user1, user2} = await getNamedAccounts();

    const MultiSigFactory = await ethers.getContract("MultiSigFactory");

    console.log(`MultiSigFactory ----> ${MultiSigFactory.address}`);

    //createNewMultiSigWallet(string memory _walletName, address[] memory _owners, uint256 _totalApprovals)
    const walletName = "new wallet";
    const owners = [deployer, user1];
    const totalApprovals = 1;

    console.log("---------------------------------------");
    console.log("--- Creating new multiSig wallet ---");
    console.log("---------------------------------------");

    const txn = await MultiSigFactory.createNewMultiSigWallet(walletName, owners, totalApprovals);
    const receipt = await txn.wait(1);

    const newWalletEvent = receipt.events.find(e => e.event === "NewWalletCreated");

    if(newWalletEvent){
        const newWAddress = newWalletEvent.args.contractAddress;
        console.log(`New Wallet --> ${newWAddress}`);

        // let multiSigWallet = await ethers.getContractFactory("MultiSig");
        // multiSigWallet = multiSigWallet.attach(newWAddress);

        // //submitProposal(string memory _name, address _to, uint256 _value, bytes memory _data, bytes[] memory _signatures)
        // const methodName = "addNewOwnerProposal";
        // const args = [user2];
        // let callData = multiSigWallet.interface.encodeFunctionData(methodName, args);
        // const toExecuteAddress = newWAddress

        // let newProposal = await multiSigWallet.submitProposal("add new signer", toExecuteAddress, ethers.utils.parseEther("0"), callData)
        // await newProposal.wait(1);

        // console.log(await multiSigWallet.isOwner(user2));

        // const appTx = await multiSigWallet.approveTransaction(0);
        // await appTx.wait(1);

        // const exeTx = await multiSigWallet.executeProposal(0);
        // await exeTx.wait(1);

        // console.log(await multiSigWallet.isOwner(user2));
    }

}



createMultiSigWallet().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
})