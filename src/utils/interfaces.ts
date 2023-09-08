import { ApiPromise } from '@polkadot/api';
import { Option, Text, Enum } from '@polkadot/types';

export interface I_ChainConnection {
  api: ApiPromise;
  sudoAccount: any;
}

export interface I_Transaction {
  index: number;
  from: string;
  nonce: number;
  gasPrice: BigInt;
  gasLimit: BigInt;
  action: Option<Text>;
  value: BigInt;
  input: string;
  v: BigInt;
  r: string;
  s: string;
}
