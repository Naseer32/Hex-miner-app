import { useState } from 'react';
import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';
import { getCoinIdBySymbol } from '@unicitylabs/sphere-sdk';

const WALLET_URL = 'https://sphere.unicity.network';
const MINT_AMOUNT = '1000000'; // 1 UCT per tap (UCT has 6 decimals)

function App() {
  const [status, setStatus] = useState('Not connected');
  const [address, setAddress] = useState(null);
  const [client, setClient] = useState(null);
  const [taps, setTaps] = useState(0);
  const [balance, setBalance] = useState(null);
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
      setStatus('Connected! Signing...');

      await result.client.intent('sign_message', {
        message: `Sign in to Hex Miner at ${new Date().toISOString()}`,
      });

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
      const uct = bal.find((b) => b.symbol === 'UCT');
      setBalance(uct ? uct.amount : '0');
    } catch (err) {
      console.error('Balance fetch failed', err);
    }
  }

  async function mineTap() {
    if (!client || mining) return;
    setMining(true);
    try {
      const coinId = getCoinIdBySymbol('UCT');
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

  const uctDisplay = balance !== null ? (Number(balance) / 1_000_000).toFixed(4) + ' UCT' : '...';

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
          <p style={{ fontSize: 20 }}>Balance: {uctDisplay}</p>
          <p>Taps mined: {taps}</p>

          <div
            onClick={mineTap}
            style={{
              width: 160,
              height: 184,
              margin: '30px auto',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: mining
                ? 'linear-gradient(135deg, #f59e0b, #d97706)'
                : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              userSelect: 'none',
              fontWeight: 'bold',
              color: '#fff',
              fontSize: 18,
              transition: 'transform 0.1s',
              transform: mining ? 'scale(0.95)' : 'scale(1)',
            }}
          >
            {mining ? 'Mining...' : 'TAP'}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
