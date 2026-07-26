import { useState } from 'react';
import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';

const WALLET_URL = 'https://sphere.unicity.network';

function App() {
  const [status, setStatus] = useState('Not connected');
  const [address, setAddress] = useState(null);

  async function connectWallet() {
    setStatus('Connecting...');
    try {
      const result = await autoConnect({
        dapp: {
          name: 'Hex Miner',
          description: 'Tap to mine hex tiles on Unicity testnet',
          url: window.location.origin,
        },
        walletUrl: WALLET_URL,
        network: SPHERE_NETWORKS.testnet2,
      });

      setAddress(result.connection.identity.directAddress);
      setStatus('Connected! Signing...');

      await result.client.intent('sign_message', {
        message: `Sign in to Hex Miner at ${new Date().toISOString()}`,
      });

      setStatus('Connected and signed ✅');
    } catch (err) {
      console.error(err);
      setStatus('Failed: ' + err.message);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Hex Miner</h1>
      <p>Status: {status}</p>
      {address && <p style={{ fontSize: 12, wordBreak: 'break-all' }}>{address}</p>}
      <button onClick={connectWallet} style={{ fontSize: 18, padding: '12px 24px' }}>
        Connect Wallet
      </button>
    </div>
  );
}

export default App;
