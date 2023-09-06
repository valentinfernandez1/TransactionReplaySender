import TxData, { I_TxData } from './models/TxData';
import config from '../config.json';
import { I_ChainConnection } from './utils/interfaces';
import { ApiPromise } from '@polkadot/api';

export const migrationWorker = async (api: ApiPromise, sudoAccount: any) => {
  //let transactions: I_TxData[] = await TxData.find({ index: { gte: config.startingIndex } }).lean();
  let transactions: I_TxData[] = Array(20000).fill(0);

  let done = false;
  while (!done) {
    try {
      const availablePoolSpace: number = await checkTxPool(api);

      availablePoolSpace
        ? await sendTransactions(transactions, availablePoolSpace, api, sudoAccount)
        : console.log('🔵 Transaction pool full');
    } catch (err) {
      console.log(err);
      break;
    }
    await new Promise((r) => setTimeout(r, config.timeout));
  }
};

const sendTransactions = async (
  transactions: I_TxData[],
  sendAmount: number,
  api: ApiPromise,
  sudoAccount: any
) => {
  console.log(`🟢 Sending ${sendAmount} transactions`);
  const nextSudoNonce = (await api.rpc.system.accountNextIndex(sudoAccount.address)).toNumber();

  let transactionPromises: Promise<any>[] = [];

  for (let txIndex = 0; txIndex < sendAmount; txIndex++) {
    let nonce = nextSudoNonce + txIndex;
    sendStoreTx(transactions[txIndex], api, sudoAccount, nonce);
  }

  await Promise.all(transactionPromises);
};

//TODO: use storeTx extrinsic
const sendStoreTx = async (tx: I_TxData, api: ApiPromise, sudoAccount: any, nonce: number) => {
  //TODO: format data for sending storeTX
  //const args = formatData()

  //TODO: Replace inside call with storeTx extrinsic
  //api.tx.sudo.sudo(api.tx.evmTxReplay.storeTx(args));
  let remark = new TextEncoder().encode('this is a remark for testing purposes');
  await api.tx.sudo.sudo(api.tx.system.remarkWithEvent(remark)).signAndSend(sudoAccount, { nonce });
};

const checkTxPool = async (api: ApiPromise): Promise<number> => {
  const txPoolAmount: number = ((await api.rpc.author.pendingExtrinsics()).toHuman() as Array<any>)
    .length;

  //Obtain available space taking into account a buffer just in case
  let availablePoolSpace = config.poolLimit - txPoolAmount - config.poolBuffer;

  if (availablePoolSpace < 0) return 0;

  return availablePoolSpace;
};
