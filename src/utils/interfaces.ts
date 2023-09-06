import { ApiPromise } from '@polkadot/api';

export interface I_ChainConnection {
  api: ApiPromise;
  sudoAccount: any;
}
