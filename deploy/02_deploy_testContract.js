const { network } = require("hardhat");
const { developmentChains } = require("../helper-hardhat");


module.exports = async ({getNamedAccounts, deployments}) => {
    const {deployer} = await getNamedAccounts();
    const {deploy} = deployments;

    const TestContract = await deploy("TestStorage",{
        from: deployer,
        args: [],
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1
    });

     //verify contract
     if (!developmentChains.includes(network.name) && process.env.POLYSCAN_API_KEY) {
        log("Verifying...")
        await verify(TestContract.address, [])
    }
}

module.exports.tags = ["TestStorage"];