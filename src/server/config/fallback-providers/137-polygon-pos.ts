import { FallbackProviderJsonConfig } from '@railgun-community/shared-models';

const config: FallbackProviderJsonConfig = {
  chainId: 137,
  providers: [
    {
      provider: 'https://polygon-rpc.com',
      priority: 2,
      weight: 2,
      stallTimeout: 2500,
      disableBatching: true,
    },
    {
      provider: 'https://rpc.ankr.com/polygon',
      priority: 2,
      weight: 1,
      disableBatching: true,
    },
    {
      provider: 'https://rpc-mainnet.maticvigil.com',
      priority: 3,
      weight: 1,
      disableBatching: true,
    },
  ],
};

export default config;
