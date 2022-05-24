import { zeroXUpdatePricesByAddresses } from '../api/0x/0x-price';
import { coingeckoUpdatePricesByAddresses } from '../api/coingecko/coingecko-price';
import { allTokenAddressesForNetwork } from '../tokens/network-tokens';
import {
  cacheTokenPriceForNetwork,
  TokenPrice,
  TokenPriceSource,
  TokenPriceUpdater,
} from '../tokens/token-price-cache';
import { NetworkChainID } from './config-chain-ids';
import configNetworks from './config-networks';

export type TokenPriceRefresher = {
  refreshDelayInMS: number;
  refresher: (
    chainID: NetworkChainID,
    tokenAddresses: string[],
  ) => Promise<void>;
};

export const updateTestNetworkDefaultPrices = (
  chainID: NetworkChainID,
  updater: TokenPriceUpdater,
): void => {
  // Assigns simple values for test nets without
  // price lookups available (eg. Ropsten, HardHat).
  const network = configNetworks[chainID];
  const tokenAddresses = allTokenAddressesForNetwork(chainID);
  tokenAddresses.forEach((tokenAddress) => {
    updater(tokenAddress, {
      price: 2000.0, // Every token price.
      updatedAt: Date.now(),
    });
  });
  updater(network.gasToken.wrappedAddress, {
    price: 2000.0, // Gas price.
    updatedAt: Date.now(),
  });
};

const tokenPriceRefresherCoingecko = (
  chainID: NetworkChainID,
  tokenAddresses: string[],
): Promise<void> => {
  const updater: TokenPriceUpdater = (
    tokenAddress: string,
    tokenPrice: TokenPrice,
  ) =>
    cacheTokenPriceForNetwork(
      TokenPriceSource.CoinGecko,
      chainID,
      tokenAddress,
      tokenPrice,
    );

  const network = configNetworks[chainID];
  const { coingeckoNetworkId } = network;
  if (!coingeckoNetworkId) {
    if (network.isTestNetwork) {
      updateTestNetworkDefaultPrices(chainID, updater);
    }
    return Promise.resolve();
  }

  return coingeckoUpdatePricesByAddresses(
    coingeckoNetworkId,
    tokenAddresses,
    updater,
  );
};

const tokenPriceRefresherZeroX = (
  chainID: NetworkChainID,
  tokenAddresses: string[],
): Promise<void> => {
  const network = configNetworks[chainID];
  if (network.isTestNetwork) {
    return Promise.resolve();
  }

  const updater: TokenPriceUpdater = (
    tokenAddress: string,
    tokenPrice: TokenPrice,
  ) =>
    cacheTokenPriceForNetwork(
      TokenPriceSource.ZeroX,
      chainID,
      tokenAddress,
      tokenPrice,
    );

  return zeroXUpdatePricesByAddresses(chainID, tokenAddresses, updater);
};

export default {
  tokenPriceRefreshers: {
    [TokenPriceSource.CoinGecko]: {
      /**
       * Refresh token prices through CoinGecko every 30 seconds.
       * Note that free Coingecko API tier only allows 50 requests per minute.
       */
      refreshDelayInMS: 30 * 1000,
      refresher: tokenPriceRefresherCoingecko,
    },
    [TokenPriceSource.ZeroX]: {
      /**
       * Kick off a token price refresh serially through 0x every minute.
       * Note that 0x API only allows 40 requests per minute, and 3 requests per second.
       * https://docs.0x.org/0x-api-swap/advanced-topics/rate-limiting
       * So, we automatically look up 20-40 tokens per minute through 0x API, depending on request latency.
       * Requests must be processed serially because of the 0x API rate limit.
       * If a refresh is ongoing, we will skip the next request for a refresh.
       */
      refreshDelayInMS: 60 * 1000,
      refresher: tokenPriceRefresherZeroX,
    },
  },
} as { tokenPriceRefreshers: MapType<TokenPriceRefresher> };