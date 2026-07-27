import { useState, useEffect, useRef } from 'react';
import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';

const WALLET_URL = 'https://sphere.unicity.network';
const UCT_COIN_ID = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';
const UCT_DECIMALS = 18;
const MINT_AMOUNT = '1000000000000000000'; // 1 UCT per tap
const COOLDOWN_MS = 1500;

function App() {
  const [status, setStatus] = useState('Not connected');
  const [address, setAddress] = useState(null);
  const [client, setClient] = useState(null);
  const [taps, setTaps] = useState(0);
  const [balance, setBalance] = useState(null);
  const [mining, setMining] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [burst, setBurst] = useState(false);
  const [leaderboard, setLeaderboard] = useState([]);
  const cooldownTimer = useRef(null);

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
    if (!client || mining || cooldown) return;
    setMining(true);
    try {
      await client.intent('mint', { coinId: UCT_COIN_ID, amount: MINT_AMOUNT });
      const newTaps = taps + 1;
      setTaps(newTaps);
      await refreshBalance(client);
      setStatus('Connected ✅');

      // visual burst
      setBurst(true);
      setTimeout(() => setBurst(false), 300);

      // update local session leaderboard
      setLeaderboard((prev) => {
        const short = address.slice(0, 18) + '...';
        const others = prev.filter((p) => p.name !== short);
        return [...others, { name: short, taps: newTaps }].sort((a, b) => b.taps - a.taps);
      });

      // cooldown to prevent spam-clicking
      setCooldown(true);
      cooldownTimer.current = setTimeout(() => setCooldown(false), COOLDOWN_MS);
    } catch (err) {
      console.error(err);
      setStatus('Mint failed: ' + err.message);
    } finally {
      setMining(false);
    }
  }

  useEffect(() => {
    return () => clearTimeout(cooldownTimer.current);
  }, []);

  const uctDisplay =
    balance !== null ? (Number(balance) / 10 ** UCT_DECIMALS).toFixed(4) + ' UCT' : '...';

  const hexLabel = mining ? 'Mining...' : cooldown ? 'Cooling down' : 'TAP';

  return (
    <div style={{ padding: 40, fontFamily: 'sans-serif', textAlign: 'center', background: '#111', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ letterSpacing: 1 }}>⬡ Hex Miner</h1>
      <p style={{ color: '#aaa' }}>Status: {status}</p>

      {!client ? (
        <button
          onClick={connectWallet}
          style={{ fontSize: 18, padding: '12px 24px', borderRadius: 8, border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 'bold' }}
        >
          Connect Wallet
        </button>
      ) : (
        <>
          <p style={{ fontSize: 12, wordBreak: 'break-all', color: '#666' }}>{address}</p>
          <p style={{ fontSize: 22, fontWeight: 'bold' }}>{uctDisplay}</p>
          <p style={{ color: '#aaa' }}>Taps mined: {taps}</p>

          <div style={{ position: 'relative', width: 180, height: 208, margin: '30px auto' }}>
            {burst && (
              <div
                style={{
                  position: 'absolute',
                  inset: -20,
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)',
                  animation: 'pulse 0.3s ease-out',
                  pointerEvents: 'none',
                }}
              />
            )}
            <div
              onClick={mineTap}
              style={{
                width: 180,
                height: 208,
                clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                background: mining
                  ? '#d97706'
                  : cooldown
                  ? '#7c5a1e'
                  : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: cooldown ? 'not-allowed' : 'pointer',
                userSelect: 'none',
                fontWeight: 'bold',
                color: '#fff',
                fontSize: 18,
                transition: 'transform 0.1s, background 0.2s',
                transform: mining ? 'scale(0.95)' : 'scale(1)',
              }}
            >
              {hexLabel}
            </div>
          </div>

          {leaderboard.length > 0 && (
            <div style={{ marginTop: 20, textAlign: 'left', maxWidth: 300, marginInline: 'auto' }}>
              <h3 style={{ color: '#f59e0b', marginBottom: 8 }}>Session Leaderboard</h3>
              {leaderboard.map((p, i) => (
                <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #333' }}>
                  <span>{i + 1}. {p.name}</span>
                  <span>{p.taps} taps</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(0.5); }
          100% { opacity: 0; transform: scale(1.5); }
        }
      `}</style>
    </div>
  );
}

export default App;
