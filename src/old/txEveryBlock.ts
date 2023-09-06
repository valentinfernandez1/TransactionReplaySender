import { ApiPromise } from '@polkadot/api';
const { blake2AsHex } = require('@polkadot/util-crypto');

const timeout = 1000;
export const txEveryBlock = async (api: ApiPromise, account: any) => {
  let skippedBlocks = 0;
  let currentBlock = 0;
  let exit = false;

  let expectedRemarks: string[] = [];
  while (!exit) {
    const blockNumber = parseInt(
      (
        (await api.rpc.chain.getBlock()).toHuman() as unknown as I_Block
      ).block.header.number.replace(',', '')
    );

    if (blockNumber != currentBlock) {
      currentBlock = blockNumber;

      console.log(
        `📦 Block ${blockNumber}: sending batch extrinsic - skipped blocks ${skippedBlocks} - Txs in the pool ${
          ((await api.rpc.author.pendingExtrinsics()).toHuman() as Array<any>).length
        }`
      );

      checkRemarkValue(api, expectedRemarks)
        .then((response) => {
          response.blockSkipped ? skippedBlocks++ : null;
          expectedRemarks = response.updatedRemaks;
        })
        .catch((err) => {
          console.log(err);
          exit = true;
          return;
        });

      //Get next nonce
      const nextSudoNonce = await api.rpc.system.accountNextIndex(account.address);

      //Send remark
      let remark = `this is a remark for testing purposes for block ${blockNumber}`;
      api.tx.system.remarkWithEvent(remark).signAndSend(account, { nonce: nextSudoNonce });

      //Add remark to list of expected remarks
      expectedRemarks.push(blake2AsHex(remark));
    }

    await new Promise((resolve) => setTimeout(resolve, Number(timeout)));
  }
};

const checkRemarkValue = async (api: ApiPromise, data: string[]): Promise<I_CheckRemarkValue> => {
  const blockHash = (await api.rpc.chain.getBlockHash()).toHuman() as string;
  const at = await api.at(blockHash);

  let events: I_Event[] = (await at.query.system.events()).toHuman() as unknown as I_Event[];
  events = events.filter((eventObject) => {
    if (eventObject.event.method == 'Remarked') {
      return true;
    } else {
      return false;
    }
  });

  if (events.length == 0) {
    return {
      updatedRemaks: data,
      blockSkipped: !events.length,
    };
  }

  let updatedRemaks = data;
  if (events[0].event.data.hash_ == data[0]) {
    updatedRemaks = data.slice(1);
  } else {
    throw new Error('The order of the received remarks is wrong');
  }

  //Allows to mark a block as skipped
  //meaning that there was no remarks in the block
  return {
    updatedRemaks,
    blockSkipped: !events.length,
  };
};

interface I_Block {
  block: {
    header: {
      number: string;
    };
  };
}

interface I_Event {
  event: {
    method: string;
    data: {
      sender: string;
      hash_: string;
    };
  };
}

interface I_CheckRemarkValue {
  updatedRemaks: string[];
  blockSkipped: boolean;
}
