import * as crypto from "crypto";
import { ec } from "elliptic";

const EC = new ec("secp256k1");

export class Block {

    public timestamp: number;
    public transactions: Transaction[];
    public previousHash: string;
    public nonce: number;
    public hash: string;

    constructor(timestamp: number, transactions: Transaction[], previousHash: string){
        this.previousHash = previousHash;
        this.transactions = transactions;
        this.timestamp = timestamp;
        this.nonce = 0;
        this.hash = this.calculateHash();
    }

    /**
     * Returns the SHA256 of this block.
     */
    calculateHash(): string{
        return crypto.createHash("sha256").update(
            this.previousHash +
            this.timestamp +
            JSON.stringify(this.transactions) + 
            this.nonce
        ).digest("hex");
    }  

    /**
     * Starts the mining process on the block.
     */
    mineBlock(difficulty: number): void{
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")){
            this.nonce++
            this.hash = this.calculateHash();
        }

        console.log(`Block Mined : ${this.hash}`);
    }

    hasValidTransactions(): boolean{
        for(const tx of this.transactions){
            if(!tx.isValid()){
                return false;
            }
        }
        return true;
    }
}

export class Blockchain {
    public chain: Block[];
    public difficulty: number;
    public pendingTransactions: Transaction[];
    public miningReward: number;

    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 2;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    /**
     * Creates the first block of the chain.
     */
    createGenesisBlock(): Block {
        return new Block(Date.parse("2020-03-07"), [], "0");
    }

    /**
     * Returns the latest block on our chain.
     */
    getLatestBlock(): Block {
        return this.chain[this.chain.length - 1];
    }

    /**
     * Takes all the pending transactions, puts them in a Block and starts the
     * mining process.
     */
    minePendingTransactions(miningRewardAddress: string): void {
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
        this.pendingTransactions.push(rewardTx);

        const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);

        console.log(`Block successfully mined`);
        this.chain.push(block);

        this.pendingTransactions = [];
    }

    /**
     * Add a new transaction to the list of pending transactions
     */
    addTransaction(transaction: Transaction): void {
        if(!transaction.isValid()) {
            throw new Error('Cannot add invalid transaction to chain');
        }

        if(transaction.amount <= 0) {
            throw new Error('Transaction amount should be higher than 0');
        }

        if(this.getBalanceOfAddress(transaction.fromAddress) < transaction.amount) {
            throw new Error('Not enough balance');
        }

        this.pendingTransactions.push(transaction);
        console.log(`Transaction Added: ${transaction}`);
    }

    /**
     * Returns a list of all transactions that happened
     * to and from the given wallet address.
     */
    getBalanceOfAddress(address: string): number {
        let balance = 0;

        for(let block of this.chain) {
            for(let tx of block.transactions) {
                if(tx.fromAddress === address) {
                    balance -= tx.amount;
                }

                if(tx.toAddress === address) {
                    balance += tx.amount;
                }
            }
        }

        return balance;
    }

    /**
     * Returns a list of all transactions that happened
     * to and from the given wallet address.
     */
    getAllTransactionsForWallet(address: string): Transaction[] {
        let txs: Transaction[] = [];

        for(let block of this.chain) {
            for(let tx of block.transactions) {
                if(tx.fromAddress === address || tx.toAddress === address) {
                    txs.push(tx);
                }
            }
        }

        return txs;
    }

    isChainValid(): boolean {
        let realGenesis = JSON.stringify(this.createGenesisBlock());

        if(realGenesis !== JSON.stringify(this.chain[0])) {
            return false
        }

        for(let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];

            if(!currentBlock.hasValidTransactions()){
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash()){
                return false;
            }
        }

        return true;
    }
}

export class Transaction {

    public fromAddress: string;
    public toAddress: string;
    public amount: number;
    public timestamp: number;
    public signature: string;

    constructor(fromAddress: string, toAddress: string, amount: number) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    /**
     * Creates a SHA256 hash of transactions
     */
    calculateHash(): string {
        return crypto.createHash("sha256").update(
            this.fromAddress + 
            this.toAddress + 
            this.amount + 
            this.timestamp
        ).digest("hex");
    }

    /**
     * Signs a transaction
     */
    signTransaction(signingKey: ec.KeyPair): void {
        if(signingKey.getPublic("hex") !== this.fromAddress) {
            throw new Error('You cannot sign transactions for other wallets!');
        }

        let hashTx = this.calculateHash();
        let sig = signingKey.sign(hashTx, "base64");

        this.signature = sig.toDER("hex");
    }

    /**
     * Checks if the signature is valid
     */
    isValid(): boolean {
        if(this.fromAddress === null) return true;

        if(!this.signature || this.signature.length === 0) {
            throw new Error('No signature in this transaction');
        }

        let publicKey = EC.keyFromPublic(this.fromAddress, "hex");
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}