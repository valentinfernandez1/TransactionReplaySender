import { ApiPromise } from '@polkadot/api';

const timeout = 25;
export const txPoolConcurrent = async (api: ApiPromise, account: any) => {
  let skippedBlocks = 0;
  let exit = true;
  while (exit) {
    //Check if txpool is empty
    const txPoolAmount: number = (
      (await api.rpc.author.pendingExtrinsics()).toHuman() as Array<any>
    ).length;
    if (txPoolAmount == 1) {
    } else if (txPoolAmount > 1) {
      exit = false;
      throw new Error('More than 1 transaction in the pool');
    } else {
      console.log(`📦 Tx pool empty - sending new extrinsic`);

      //get next index
      const nextSudoNonce = await api.rpc.system.accountNextIndex(account.address);
      let remark = new TextEncoder().encode('this is a remark for testing purposes');

      api.tx.system.remarkWithEvent(remark).signAndSend(account, { nonce: nextSudoNonce });
    }
    await new Promise((resolve) => setTimeout(resolve, Number(timeout)));
  }
};
