import TxData, { I_TxData } from './models/TxData';
import config from '../config.json';
import { ApiPromise } from '@polkadot/api';
import { Option } from '@polkadot/types';

export const migrationWorker = async (api: ApiPromise, sudoAccount: any, startNonce: number) => {
    let nonce = startNonce;
    let transactions: I_TxData[] = await TxData.find({
        index: { $gte: config.startingIndex },
    }).lean();

    let done = false;
    while (!done) {
        try {
            const availablePoolSpace: number = await checkTxPool(api);

            if (!availablePoolSpace) {
                console.log('🔵 Transaction pool full');
                return;
            }
            nonce = await sendTransactions(
                transactions,
                availablePoolSpace,
                api,
                sudoAccount,
                nonce
            );
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
    sudoAccount: any,
    nonce: number
): Promise<number> => {
    console.log(`🟢 Sending ${sendAmount} transactions`);

    let transactionPromises: Promise<any>[] = [];

    for (let txIndex = 0; txIndex < sendAmount; txIndex++) {
        replayTx(transactions[txIndex], api, sudoAccount, nonce);
        nonce++;
    }

    await Promise.all(transactionPromises);
    return nonce;
};

//TODO: use storeTx extrinsic
const replayTx = async (tx: I_TxData, api: ApiPromise, sudoAccount: any, nonce: number) => {
    let action;
    tx.to == ''
        ? (action = new Option(api.registry, 'H160', null))
        : (action = new Option(api.registry, 'H160', tx.to));

    await api.tx.sudo
        .sudo(
            api.tx.evmTxReplay.replayTx(
                BigInt(tx.index), //index
                String(tx.from), //from
                BigInt(tx.nonce), //nonce
                BigInt(tx.gasPrice), //gasPrice
                BigInt(tx.gasLimit), //gasLimit
                action, //action
                BigInt(tx.value), //value
                String(tx.data), //input
                BigInt(tx.v), //v
                String(tx.r), //r
                String(tx.s) //s
            )
        )
        .signAndSend(sudoAccount, { nonce }, ({ events = [], status }) => {
            if (status.isFinalized) {
                console.log('Extrinsic finalized with block hash', status.asFinalized.toHex());
                /* 
                // Check for events emitted by the extrinsic
                events.forEach(({ event }) => {
                    console.log('Event:', event.section, event.method, event.data.toString());
                }); */
            }
        });
};

const checkTxPool = async (api: ApiPromise): Promise<number> => {
    const txPoolAmount: number = (
        (await api.rpc.author.pendingExtrinsics()).toHuman() as Array<any>
    ).length;

    //Obtain available space taking into account a buffer just in case
    let availablePoolSpace = config.poolLimit - txPoolAmount - config.poolBuffer;

    if (availablePoolSpace < 0) return 0;

    return availablePoolSpace;
};
