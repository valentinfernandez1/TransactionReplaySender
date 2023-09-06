import { Int32, Long } from 'mongodb';
import mongoose from 'mongoose';

export interface I_TxData {
  _id?: string;
  index: number;
  blockNumber: BigInt;
  hash: string;
  from: string;
  to: string;
  gasPrice: BigInt;
  gasLimit: BigInt;
  value: BigInt;
  nonce: BigInt;
  data: string;
  v: BigInt;
  r: string;
  s: string;
  gasUsed: BigInt;
}

const TxDataShema = new mongoose.Schema(
  {
    index: Int32,
    blockNumber: Long,
    hash: String,
    from: String,
    to: String,
    gasPrice: Long,
    gasLimit: Long,
    value: Long,
    nonce: Long,
    data: String,
    v: Long,
    r: String,
    s: String,
    gasUsed: Long,
  },
  { collection: 'TxData' }
);

export default mongoose.model('TxData', TxDataShema);
