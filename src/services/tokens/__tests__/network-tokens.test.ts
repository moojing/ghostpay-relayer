/* globals describe it beforeEach, afterEach */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { NetworkChainID } from '../../../config/config-chain-ids';
import configTokens from '../../../config/config-tokens';
import { allTokenAddressesForNetwork } from '../network-tokens';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('network-tokens', () => {
  beforeEach(() => {
    configTokens[NetworkChainID.Ethereum] = {
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
        symbol: 'WETH',
        decimals: 18,
      },
    };
  });

  it('Should have correct number of tokens', () => {
    const tokenAddresses = allTokenAddressesForNetwork(NetworkChainID.Ethereum);
    expect(tokenAddresses.length).to.equal(1);
  });

  it('Should return WETH token address', () => {
    const tokenAddresses = allTokenAddressesForNetwork(NetworkChainID.Ethereum);
    expect(tokenAddresses).to.contain(
      '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    );
  });
}).timeout(240000);