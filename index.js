require('dotenv').config();
const ethers = require('ethers');
const contractDetails = require('./contract.json');
const claims = require("./claims.json");
const fs = require("fs")
const csv = require("csv-parser")
const privateKey = process.env.PRIVATE_KEY;

const provider = new ethers.providers.JsonRpcProvider('https://rpc.ankr.com/eth_sepolia');
const wallet = new ethers.Wallet(privateKey, provider);

const contract = new ethers.Contract(contractDetails.address, contractDetails.abi, wallet);

const overrides = {
  gasLimit: 9999999,
}


const readCSVFile = async (filePath) => {
  return new Promise((resolve, reject) => {
    const addressBalPair = {};
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        const balanceWithoutCommas = row.Balance.replace(/,/g, '');
        const balanceBigNumber = ethers.utils.parseUnits(balanceWithoutCommas, 18);
        
        addressBalPair[row.HolderAddress] = balanceBigNumber._hex.slice(2);
      })
      .on('end', () => {
        const jsonData = JSON.stringify(addressBalPair, null, 2);
        fs.writeFileSync('example.json', jsonData);
        console.log("Generated json file")
        resolve({ addressBalPair });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
};

const claim = async()=>{
  const claimData =claims.res.claims[wallet.address];
  try {
     const transaction = await contract.claim(claimData.index,wallet.address,ethers.BigNumber.from(claimData.amount),claimData.proof,overrides)
    const receipt = await transaction.wait();
    console.log(receipt)
  } catch (error) {
    console.log("ERROR===",error.reason)
  }
}

const main = async()=>{await readCSVFile(
  "./data.csv"
) 
}
// claim()
main()



