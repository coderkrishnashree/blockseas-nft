// utils/initUmi.ts
import { createUmi } from '@metaplex-foundation/umi-bundle-defaults';
import { mplCandyMachine } from '@metaplex-foundation/mpl-candy-machine';

export const initUmi = (rpcEndpoint: string) => {
  return createUmi(rpcEndpoint).use(mplCandyMachine());
};
