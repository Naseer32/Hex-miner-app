import { useState } from 'react';
import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';
import { getCoinIdBySymbol } from '@unicitylabs/sphere-sdk';

const WALLET_URL = 'https://sphere.unicity.network';
const MINT_AMOUNT = '1000000';

function App() {
  const [status, setStatus] = useState('Not connected');
  const [address, setAddress] = useState(null);
  const [client, setClient] = useState(null);
  const [taps, setTaps] = useState(0);
  const [balance, setBalance] = useState(null);
  const [debug, setDebug] = useState('');
  const [mining, setMining] = useState(false);

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
        permissions: ['identity:read', 'balance:read', 'mint:request'],
      });

      setClient(result.client);
      setAddress(result.connection.identity.directAddress);
      setStatus('Connected ✅');
      refreshBalance(result.client);
    } catch (err) {
      console.error(err);
      setStatus('Failed: ' + err.message);
    }
  }

  async function refreshBalance(activeClient) {
    try {
      const bal = await (activeClient ?? client).query('sphere_getBalance');
      setDebug('Balance raw: ' + JSON.stringify(bal));
    } catch (err) {
      setDebug('Balance query error: ' + err.message);
    }
  }

  async function mineTap() {
    if (!client || mining) return;
    setMining(true);
    try {
      const coinId = getCoinIdBySymbol('UCT');
      setDebug('coinId = ' + JSON.stringify(coinId) + ' (type: ' + typeof coinId + ')');
      await client.intent('mint', { coinId, amount: MINT_AMOUNT });
      setTaps((t) => t + 1);
      await refreshBalance(client);
    } catch (err) {
      console.error(err);
      setStatus('Mint failed: ' + err.message);
    } finally {
      setMining(false);
    }
  }

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center' }}>
      <h1>Hex Miner</h1>
      <p>Status: {status}</p>

      {!client ? (
        <button onClick={connectWallet} style={{ fontSize: 18, padding: '12px 24px' }}>
          Connect Wallet
        </button>
      ) : (
        <>
          <p style={{ fontSize: 12, wordBreak: 'break-all', color: '#666' }}>{address}</p>
          <p>Taps mined: {taps}</p>

          <div
            onClick={mineTap}
            style={{
              width: 160, height: 184, margin: '30px auto',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: mining ? '#d97706' : '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontWeight: 'bold', color: '#fff', fontSize: 18,
            }}
          >
            {mining ? 'Mining...' : 'TAP'}
          </div>

          <pre style={{ fontSize: 11, textAlign: 'left', background: '#eee', padding: 10, whiteSpace: 'pre-wrap' }}>
            {debug}
          </pre>
        </>
      )}
    </div>
  );
}

export default App;
