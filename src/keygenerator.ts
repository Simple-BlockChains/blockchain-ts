import { ec as EC } from "elliptic";
const ec = new EC("secp256k1");

let key = ec.genKeyPair();
let publicKey = key.getPublic("hex");
let privateKey = key.getPrivate("hex");

export const keys = {
    keyObj: key,
    publicKey: publicKey,
    privateKey: privateKey
};