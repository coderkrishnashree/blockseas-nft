// utils/mintNFT.ts
import { Connection, PublicKey } from '@solana/web3.js';
import { Metaplex, walletAdapterIdentity, bundlrStorage } from '@metaplex-foundation/js';
import { WalletContextState } from '@solana/wallet-adapter-react';

interface MintNFTParams {
  connection: Connection;
  wallet: WalletContextState;
  imageUrl: string;
  name: string;
  symbol: string;
  description: string;
}

export async function mintNFT({ connection, wallet, imageUrl, name, symbol, description }: MintNFTParams): Promise<void> {
  try {
    if (!wallet.publicKey) throw new Error('Wallet not connected');

    const metaplex = Metaplex.make(connection)
      .use(walletAdapterIdentity(wallet)) // Use the connected wallet for signing
      .use(bundlrStorage());

    console.log(`Minting NFT with metadata: ${name}, ${symbol}, ${description}, ${imageUrl}`);
    const { nft } = await metaplex
      .nfts()
      .create({
        uri: imageUrl,
        name,
        symbol,
        sellerFeeBasisPoints: 500,
        creators: [{ address: new PublicKey(wallet.publicKey.toBase58()), share: 100 }],
        isMutable: false,
      }, { commitment: 'finalized' });

    console.log(`Minted NFT: https://explorer.solana.com/address/${nft.address}?cluster=devnet`);
  } catch (error) {
    console.error('Error minting NFT:', error);
  }
}

