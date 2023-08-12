require("@nomiclabs/hardhat-ethers");

module.exports = {
  defaultNetwork: "sepolia", 

  solidity: "0.8.19",  

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  networks: {
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

    sepolia: {
      url: "https://sepolia.infura.io/v3/4c6918964dde4f6e80dcaf01fcbbe3fe",
      accounts: {
        mnemonic: "panel endorse core chaos food tired ankle funny decide input ahead sunset"
      },
      chainId: 11155111,
      gasPrice: 20000000000,   
      gas: 9500000            
    },  // Added missing comma

    optimism_goerli: {
      url: 'https://optimism-goerli.infura.io/v3/4c6918964dde4f6e80dcaf01fcbbe3fe',
      accounts: {
        mnemonic: "panel endorse core chaos food tired ankle funny decide input ahead sunset"
      },
      gasPrice: 15000000, // This is a fixed value for Optimism currently
      ovm: true, // This ensures you are compiling with the OVM version of the Solidity compiler
    }
  },

  ovm: {
    solcVersion: "0.8.19", 
  },

  typechain: {
    outDir: "typechain",
    target: "hardhat"
  },

  mocha: {
    timeout: 40000 
  }
};
