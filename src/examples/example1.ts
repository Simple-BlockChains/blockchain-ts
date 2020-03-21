import { Blockchain, Transaction} from "../blockchain";
import { ec as EC} from "elliptic";
import { keys } from "../keygenerator";
const ec = new EC("secp256k1");

let Bitcoin = new Blockchain();

const originTx = new Transaction(null, keys.publicKey, 50);
Bitcoin.pendingTransactions.push(originTx);

Bitcoin.minePendingTransactions(keys.publicKey);

const tx1 = new Transaction(keys.publicKey, "address2", 50);
tx1.signTransaction(keys.keyObj);
Bitcoin.addTransaction(tx1);

Bitcoin.minePendingTransactions(keys.publicKey);

console.log(`Your balance: ${Bitcoin.getBalanceOfAddress(keys.publicKey)}`);
console.log(Bitcoin.chain)
 