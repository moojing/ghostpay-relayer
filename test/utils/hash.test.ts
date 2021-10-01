/* globals describe it */
import chai from 'chai';
import chaiAsPromised from 'chai-as-promised';

import utils from '../../src/utils';

chai.use(chaiAsPromised);
const { expect } = chai;

describe('Utils/Crypto', () => {
  it('Should perform sha256 hashes correctly', () => {
    const vectors = [
      {
        preimage: '',
        array: new Uint8Array([]),
        result: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      {
        preimage: '5241494c47554e',
        array: new Uint8Array([82, 65, 73, 76, 71, 85, 78]),
        result: 'b25e4f3027088a658fa918eb93fd905969be8f455adb942987aa866013c9f836',
      },
      {
        preimage: '50524956414359202620414e4f4e594d495459',
        array: new Uint8Array([
          80, 82, 73, 86, 65, 67, 89,
          32, 38, 32, 65, 78, 79, 78,
          89, 77, 73, 84, 89,
        ]),
        result: '947fa99dc47b17d91b3aceec798dcee836744c68423e9b41b9d1b7ffba8fdc8c',
      },
    ];

    vectors.forEach((vector) => {
      // Test hex string hash
      expect(
        utils.hash.sha256(vector.preimage),
      ).to.equal(vector.result);

      // Test bytes array hash
      expect(
        utils.hash.sha256(vector.array),
      ).to.equal(vector.result);
    });
  });

  it('Should perform sha512 hashes correctly', () => {
    const vectors = [
      {
        preimage: '',
        array: new Uint8Array([]),
        result: 'cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e',
      },
      {
        preimage: '5241494c47554e',
        array: new Uint8Array([82, 65, 73, 76, 71, 85, 78]),
        result: 'ff66fdbf6b51995a981aa4400645a04067d0293863ba961b8b84527f07450f7b513e266aa9e6b25727be754bfe96b7e99c01ac4db2220f8f2ae4d057248ab204',
      },
      {
        preimage: '50524956414359202620414e4f4e594d495459',
        array: new Uint8Array([
          80, 82, 73, 86, 65, 67, 89,
          32, 38, 32, 65, 78, 79, 78,
          89, 77, 73, 84, 89,
        ]),
        result: 'f2c5c93699191d322d21f23656d91e35a3313f429c17760378d79e4974b178d22d7d4d9c2426e3f3b7e2d2e1c3e9544a136551063def4a38b82420ca6e3a4679',
      },
    ];

    vectors.forEach((vector) => {
      // Test hex string hash
      expect(
        utils.hash.sha512(vector.preimage),
      ).to.equal(vector.result);

      // Test bytes array hash
      expect(
        utils.hash.sha512(vector.array),
      ).to.equal(vector.result);
    });
  });

  it('Should perform keccak256 hashes correctly', () => {
    const vectors = [
      {
        preimage: '',
        array: new Uint8Array([]),
        result: 'c5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470',
      },
      {
        preimage: '5241494c47554e',
        array: new Uint8Array([82, 65, 73, 76, 71, 85, 78]),
        result: 'ef0394c8ea7550db58adcb1b8ffb98f76fca939554a4084889b6bffa01aac296',
      },
      {
        preimage: '50524956414359202620414e4f4e594d495459',
        array: new Uint8Array([
          80, 82, 73, 86, 65, 67, 89,
          32, 38, 32, 65, 78, 79, 78,
          89, 77, 73, 84, 89,
        ]),
        result: '5c7d261b35e3b58c6ca6663e44b736a7fbbc0e2265cd050959f4976f8667d306',
      },
    ];

    vectors.forEach((vector) => {
      // Test hex string hash
      expect(
        utils.hash.keccak256(vector.preimage),
      ).to.equal(vector.result);

      // Test bytes array hash
      expect(
        utils.hash.keccak256(vector.array),
      ).to.equal(vector.result);
    });
  });

  it('Should perform sha512 HMAC hashes correctly', () => {
    const vectors = [
      {
        preimage: '',
        array: new Uint8Array([]),
        key: 'aa',
        keyArray: [170],
        result: '4e9f386d58475d4e030c55c47f54ab3e2e5790d2aaaedc2f4465b5665a5307da3416778a481a09a2f18e1db63c26d741aa0a82af5a38a893bf9793fb7dea031e',
      },
      {
        preimage: '5241494c47554e',
        array: new Uint8Array([82, 65, 73, 76, 71, 85, 78]),
        key: 'bb',
        keyArray: [187],
        result: '206aca0dd9a7d87873692ff48a91f0c495ab896c488c4af5e7062774e8841298ddc9eee9699a6930b545aebf6dd3504bcef331231368318da26bb3783fdcc086',
      },
      {
        preimage: '50524956414359202620414e4f4e594d495459',
        array: new Uint8Array([
          80, 82, 73, 86, 65, 67, 89,
          32, 38, 32, 65, 78, 79, 78,
          89, 77, 73, 84, 89,
        ]),
        key: 'cc',
        keyArray: [204],
        result: 'b3513bb5230d933d8dc2cf28eddfa566bb76f49aa9bdf6f2475df0405feaaab4782d9d7a177ee9e32aa1e0af0ca0bb93a3c0312aa18788c7944a24f761bdcc1a',
      },
    ];

    vectors.forEach((vector) => {
      // Test hex string hash
      expect(
        utils.hash.sha512HMAC(vector.key, vector.preimage),
      ).to.equal(vector.result);

      // Test bytes array hash
      expect(
        utils.hash.sha512HMAC(vector.keyArray, vector.array),
      ).to.equal(vector.result);
    });
  });
});