require("/Users/gintarasmisiunas/Superhack/Ethereum-Credit-Bureau/node_modules/@nomicfoundation/hardhat-toolbox");

module.exports = {
  // Specify the version of Solidity you're using
  solidity: "0.8.19",

  // Paths for Hardhat to use
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  // Network configuration
  networks: {
    // Configuration for hardhat network (local development)
    hardhat: {
      chainId: 1337,
      gasPrice: 20000000000,
      gas: 9500000,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk"
      },
      blockGasLimit: 9500000,
      allowUnlimitedContractSize: false,
      hardfork: "london",
      loggingEnabled: false
    },

    // If you want to deploy to other networks like Rinkeby, Ropsten, etc., 
    // you'd add configurations here. Example:
    /*
    rinkeby: {
      url: "https://rinkeby.infura.io/v3/YOUR_INFURA_KEY",
      accounts: ["YOUR_PRIVATE_KEY"]
    }
    */
  },

  // Optional: If you're using Hardhat with TypeScript
  typechain: {
    outDir: "typechain",
    target: "hardhat"
  },

  // Any other plugins or configurations can be added here as well.
};

