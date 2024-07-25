// components/UploadAndMint.tsx
import React, { useState, useEffect } from 'react';
import Dropzone from 'react-dropzone';
import { WebBundlr } from '@bundlr-network/client';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection } from '@solana/web3.js';
import axios from 'axios';
import axiosRetry from 'axios-retry';
import { mintNFT } from '../utils/mintNFT';

axiosRetry(axios, { retries: 3 });

const UploadAndMint: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [metadata, setMetadata] = useState({ title: '', description: '', symbol: '' });
  const [bundlr, setBundlr] = useState<WebBundlr | null>(null);
  const wallet = useWallet();
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  useEffect(() => {
    if (wallet.connected && wallet.publicKey) {
      initializeBundlr(wallet);
    }
  }, [wallet.connected, wallet.publicKey]);

  const onDrop = (acceptedFiles: File[]) => setFile(acceptedFiles[0]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setMetadata((prev) => ({ ...prev, [name]: value }));
  };

  const initializeBundlr = (wallet: WalletContextState) => {
    const bundlr = new WebBundlr(
      'https://node1.bundlr.network',
      'solana',
      wallet,
      { providerUrl: 'https://api.devnet.solana.com' }
    );
    bundlr.ready().then(() => setBundlr(bundlr));
  };

  const uploadToBundlr = async (data: ArrayBuffer) => {
    if (!bundlr) {
      throw new Error('Bundlr is not initialized');
    }
    try {
      const buffer = Buffer.from(data); // Convert ArrayBuffer to Buffer
      const tx = await bundlr.upload(buffer, { tags: [{ name: 'Content-Type', value: 'image/png' }] });
      return `https://arweave.net/${tx.id}`;
    } catch (error) {
      console.error('Error uploading to Bundlr:', error);
      throw error;
    }
  };

  const handleMint = async () => {
    if (!file || !metadata.title || !metadata.description || !metadata.symbol) {
      alert('Please fill in all fields and upload an image.');
      return;
    }

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = async () => {
      const arrayBuffer = reader.result as ArrayBuffer;

      // Upload to Bundlr
      try {
        const imageUrl = await uploadToBundlr(arrayBuffer);
        if (imageUrl) {
          // Mint the NFT using the connected wallet
          await mintNFT({
            connection,
            wallet,
            imageUrl,
            name: metadata.title,
            symbol: metadata.symbol,
            description: metadata.description,
          });
        }
      } catch (error) {
        console.error('Failed to upload image and mint NFT:', error);
      }
    };
  };

  return (
    <div>
      <Dropzone onDrop={onDrop} accept="image/*">
        {({ getRootProps, getInputProps }) => (
          <div {...getRootProps()} className="dropzone">
            <input {...getInputProps()} />
            {file ? <p>{file.name}</p> : <p>Drop your QR code image here or click to select</p>}
          </div>
        )}
      </Dropzone>
      <input type="text" name="title" value={metadata.title} onChange={handleInputChange} placeholder="Title" />
      <input type="text" name="symbol" value={metadata.symbol} onChange={handleInputChange} placeholder="Symbol" />
      <input type="text" name="description" value={metadata.description} onChange={handleInputChange} placeholder="Description" />
      <button onClick={handleMint} disabled={!wallet.connected}>Mint NFT</button>
    </div>
  );
};

export default UploadAndMint;
