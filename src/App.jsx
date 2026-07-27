import { useState } from 'react';
import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';

const WALLET_URL = 'https://sphere.unicity.network';
const UCT_COIN_ID = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';
const UCT_DECIMALS = 18;
const MINT_AMOUNT = '1000000000000000000'; // 1 UCT per tap (18 decimals)

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
      const uct = bal.find((b) => b.coinId === UCT_COIN_ID);
      setBalance(uct ? uct.totalAmount : '0');
    } catch (err) {
      console.error('Balance fetch failed', err);
    }
  }

  async function mineTap() {
    if (!client || mining) return;
    setMining(true);
    try {
      await client.intent('mint', { coinId: UCT_COIN_ID, amount: MINT_AMOUNT });
      setTaps((t) => t + 1);
      await refreshBalance(client);
      setStatus('Connected ✅');
    } catch (err) {
      console.error(err);
      setStatus('Mint failed: ' + err.message);
    } finally {
      setMining(false);
    }
  }

  const uctDisplay =
    balance !== null ? (Number(balance) / 10 ** UCT_DECIMALS).toFixed(4) + ' UCT' : '...';

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
              width: 160, height: 184, margin: '30px auto',
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
              background: mining ? '#d97706' : '#f59e0b',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', fontWeight: 'bold', color: '#fff', fontSize: 18,
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
