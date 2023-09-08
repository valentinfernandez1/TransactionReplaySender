import { Int32, Long } from 'mongodb';
import mongoose from 'mongoose';

export interface I_TxData {
    _id?: string;
    index: number;
    blockNumber: bigint;
    hash: string;
    from: string;
    to: string;
    gasPrice: bigint;
    gasLimit: bigint;
    value: bigint;
    nonce: bigint;
    data: string;
    v: number;
    r: string;
    s: string;
    gasUsed: bigint;
}

const TxDataShema = new mongoose.Schema(
    {
        index: Number,
        blockNumber: BigInt,
        hash: String,
        from: String,
        to: String,
        gasPrice: BigInt,
        gasLimit: BigInt,
        value: BigInt,
        nonce: BigInt,
        data: String,
        v: BigInt,
        r: String,
        s: String,
        gasUsed: BigInt,
    },
    { collection: 'ordered_txs' }
);

export default mongoose.model('TxData', TxDataShema);
