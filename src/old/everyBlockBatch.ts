import { ApiPromise } from '@polkadot/api';
const { blake2AsHex } = require('@polkadot/util-crypto');

const timeout = 500;
const batchingLimit = Math.floor(10922 / 1.5);
export const everyBlockBatch = async (api: ApiPromise, account: any) => {
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
        `📦 Block ${blockNumber}: sending new extrinsic - skipped blocks ${skippedBlocks} - Txs in the pool ${
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
      let remarkExtrinsic = api.tx.system.remarkWithEvent(remark);
      const remarks = new Array(batchingLimit).fill(remarkExtrinsic);

      api.tx.utility.batchAll(remarks).signAndSend(account, { nonce: nextSudoNonce });

      //Add remark to list of expected remarks
      expectedRemarks.push(blake2AsHex(remark));
    }

    await new Promise((resolve) => setTimeout(resolve, Number(timeout)));
  }
};

const checkRemarkValue = async (api: ApiPromise, data: string[]): Promise<I_CheckRemarkValue> => {
  const blockHash = (await api.rpc.chain.getBlockHash()).toHuman() as string;
  const at = await api.at(blockHash);

  let result: I_CheckRemarkValue = {
    updatedRemaks: data,
    blockSkipped: true,
  };

  let events: I_Event[] = (await at.query.system.events()).toHuman() as unknown as I_Event[];

  let batchEvents: I_Event[] = [];
  let remarkEvents: I_Event[] = [];

  for (let event of events) {
    let modifiedEvent: I_Event = {
      event: {
        data: event.event.data,
        method: event.event.method,
      },
    };
    if (modifiedEvent.event.method == 'BatchCompleted') {
      batchEvents.push(modifiedEvent);
    } else if (modifiedEvent.event.method == 'Remarked') {
      remarkEvents.length == 0
        ? remarkEvents.push(modifiedEvent)
        : remarkEvents[0].event.data.hash_ != modifiedEvent.event.data.hash_
        ? remarkEvents.push(modifiedEvent)
        : null;
    }
  }

  if (batchEvents.length === 0) {
    return result;
  }

  result.blockSkipped = false;

  console.log(batchEvents, remarkEvents);
  if (batchEvents.length > 1 || remarkEvents.length > 1) {
    throw new Error('More than one tx in the block');
  }

  if (remarkEvents[0].event.data.hash_ == data[0]) {
    result.updatedRemaks = data.slice(1);
  } else {
    throw new Error('The order of the received remarks is wrong');
  }

  //Allows to mark a block as skipped
  //meaning that there was no remarks in the block
  return result;
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
