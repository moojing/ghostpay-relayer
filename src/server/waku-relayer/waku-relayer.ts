import { JsonRpcPayload, JsonRpcResult } from '@walletconnect/jsonrpc-types';
import debug from 'debug';
import { BigNumber } from 'ethers';
import { Wallet } from '@railgun-community/lepton/dist/wallet';
import { bytes } from '@railgun-community/lepton/dist/utils';
import { WakuApiClient, WakuRelayMessage } from '../networking/waku-api-client';
import { transactMethod } from './methods/transact-method';
import { NetworkChainID } from '../config/config-chain-ids';
import { configuredNetworkChainIDs } from '../chains/network-chain-ids';
import { getAllUnitTokenFeesForChain } from '../fees/calculate-token-fee';
import { delay } from '../../util/promise-utils';
import configDefaults from '../config/config-defaults';
import { contentTopics } from './topics';
import { getRailgunWalletPubKey } from '../wallets/active-wallets';
import { WakuMessage } from './waku-message';

export const WAKU_TOPIC = '/waku/2/default-waku/proto';
export const RAILGUN_TOPIC = '/railgun/1/relayer/proto';

export type FeeMessageData = {
  fees: MapType<string>;
  feeExpiration: number;
  feesID: string;
  pubkey: string;
  signingKey: string;
};

export type FeeMessage = {
  data: string, // hex encoded FeeMessageData
  signature: string; // hex encoded signature
};

type JsonRPCMessageHandler = (
  params: any,
  id: number,
  logger: debug.Debugger,
) => Promise<Optional<JsonRpcResult<string>>>;

export enum WakuMethodNames {
  Transact = 'transact',
}

export type WakuRelayerOptions = {
  topic: string;
  feeExpiration: number;
};

export class WakuRelayer {
  client: WakuApiClient;

  dbg: debug.Debugger;

  topic: string;

  allContentTopics: string[];

  walletPublicKey: string;

  options: WakuRelayerOptions;

  wallet: Wallet;

  methods: MapType<JsonRPCMessageHandler> = {
    [WakuMethodNames.Transact]: transactMethod,
  };

  constructor(client: WakuApiClient, wallet: Wallet, options: WakuRelayerOptions) {
    const chainIDs = configuredNetworkChainIDs();
    this.client = client;
    this.options = options;
    this.dbg = debug('relayer:waku:relayer');
    this.topic = options.topic;
    this.allContentTopics = [
      contentTopics.default(),
      ...chainIDs.map((chainID) => contentTopics.fees(chainID)),
      ...chainIDs.map((chainID) => contentTopics.transact(chainID)),
    ];
    this.wallet = wallet;
    this.walletPublicKey = getRailgunWalletPubKey();
    this.dbg(this.allContentTopics);
  }

  static async init(
    client: WakuApiClient,
    wallet: Wallet,
    options: WakuRelayerOptions,
  ): Promise<WakuRelayer> {
    const relayer = new WakuRelayer(client, wallet, options);
    await relayer.client.subscribe([options.topic]);
    return relayer;
  }

  async publish(
    payload: Optional<JsonRpcPayload<string>> | object,
    contentTopic: string,
  ) {
    const msg = WakuMessage.fromUtf8String(JSON.stringify(payload), contentTopic);
    await this.client.publish(msg, this.topic).catch((e) => {
      this.dbg('Error publishing message', e.message);
    });
  }

  static decode(payload: Uint8Array): string {
    return Buffer.from(payload).toString('utf8');
  }

  async handleMessage(message: WakuRelayMessage) {
    const { payload, contentTopic, timestamp } = message;

    try {
      const decoded = WakuRelayer.decode(payload);
      const request = JSON.parse(decoded);
      const { method, params, id } = request;

      if (method in this.methods) {
        const age = Date.now() / 1000 - timestamp;
        this.dbg(`handling message on ${contentTopic} (${age}s old)`);
        const rpcResultResponse = await this.methods[method](
          params,
          id,
          this.dbg,
        );
        await this.publish(rpcResultResponse, contentTopic);
      }
    } catch (e) {
      this.dbg('Caught error', e);
    }
  }

  private createFeeBroadcastData = async (
    fees: MapType<BigNumber>,
    feeCacheID: string,
  ): Promise<FeeMessage> => {
    const tokenAddresses = Object.keys(fees);
    const feesHex: MapType<string> = {};
    tokenAddresses.forEach((tokenAddress) => {
      feesHex[tokenAddress] = fees[tokenAddress].toHexString();
    });
    const data: FeeMessageData = {
      fees: feesHex,
      // client can't rely on message timestamp to calculate expiration
      feeExpiration: Date.now() + this.options.feeExpiration,
      feesID: feeCacheID,
      pubkey: this.walletPublicKey,
      signingKey: await this.wallet.edNode.getPublicKey(),
    };
    const message = bytes.fromUTF8String(JSON.stringify(data));
    const signature = bytes.hexlify(await this.wallet.edNode.sign(message));
    return {
      data: message,
      signature,
    };
  };

  async broadcastFeesForChain(chainID: NetworkChainID) {
    // Map from tokenAddress to BigNumber hex string
    const { fees, feeCacheID } = getAllUnitTokenFeesForChain(chainID);
    const feeBroadcastData = await this.createFeeBroadcastData(fees, feeCacheID);
    this.dbg(`Broadcasting fees for chain ${chainID}: `, fees);
    const contentTopic = contentTopics.fees(chainID);
    const result = await this.publish(feeBroadcastData, contentTopic);
    this.dbg(`Result: ${result}`);
  }

  async broadcastFeesOnInterval(interval: number = 1000 * 30) {
    await delay(interval);
    const chainIDs = configuredNetworkChainIDs();
    const broadcastPromises: Promise<void>[] = chainIDs.map((chainID) =>
      this.broadcastFeesForChain(chainID),
    );
    await Promise.all(broadcastPromises);
    this.broadcastFeesOnInterval(interval);
  }

  async poll(frequency: number = 5000) {
    const messages = await this.client
      .getMessages(this.topic, this.allContentTopics)
      .catch((e) => {
        this.dbg(e.message);
        return [];
      });
    await Promise.all(messages.map((message) => this.handleMessage(message)));
    await delay(frequency);
    this.poll(frequency);
  }
}
