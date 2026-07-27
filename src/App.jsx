import { useState, useRef, useEffect } from 'react';
import { autoConnect } from '@unicitylabs/sphere-sdk/connect/browser';
import { SPHERE_NETWORKS } from '@unicitylabs/sphere-sdk/connect';

const WALLET_URL = 'https://sphere.unicity.network';
const UCT_COIN_ID = 'f581d30f593e4b369d684a4563b5246f07b1d265f7178a2c0a82b81f39c24dc0';
const UCT_DECIMALS = 18;
const MINT_AMOUNT = '1000000000000000000';
const COOLDOWN_MS = 1500;

const TILES = [
  { id: 0, offset: 0 },
  { id: 1, offset: 1 },
  { id: 2, offset: 0 },
  { id: 3, offset: 1 },
  { id: 4, offset: 0 },
];

function playDing() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {}
}

function App() {
  const [status, setStatus] = useState('Not connected');
  const [address, setAddress] = useState(null);
  const [client, setClient] = useState(null);
  const [taps, setTaps] = useState(0);
  const [balance, setBalance] = useState(null);
  const [tileState, setTileState] = useState({});
  const [burstTile, setBurstTile] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const cooldownTimers = useRef({});
  const clientRef = useRef(null);

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

      clientRef.current = result.client;
      setClient(result.client);
      setAddress(result.connection.identity.directAddress);
      setStatus('Connected ✅');
      refreshBalance(result.client);

      // React to the wallet locking — the connection is no longer usable
      result.client.on('wallet:locked', () => {
        setStatus('Wallet locked — please reconnect');
        setClient(null);
        clientRef.current = null;
        setAddress(null);
        setBalance(null);
      });

      // React to the user switching accounts inside the wallet
      result.client.on('identity:changed', (newIdentity) => {
        setAddress(newIdentity.directAddress);
        setStatus('Account switched ✅');
        setTaps(0);
        setLeaderboard([]);
        refreshBalance(result.client);
      });
    } catch (err) {
      console.error(err);
      setStatus('Failed: ' + err.message);
    }
  }

  async function refreshBalance(activeClient) {
    try {
      const bal = await (activeClient ?? clientRef.current).query('sphere_getBalance');
      const uct = bal.find((b) => b.coinId === UCT_COIN_ID);
      setBalance(uct ? uct.totalAmount : '0');
    } catch (err) {
      console.error('Balance fetch failed', err);
    }
  }

  async function mineTap(tileId) {
    if (!client || tileState[tileId]) return;
    setTileState((s) => ({ ...s, [tileId]: 'mining' }));
    try {
      await client.intent('mint', { coinId: UCT_COIN_ID, amount: MINT_AMOUNT });
      const newTaps = taps + 1;
      setTaps(newTaps);
      await refreshBalance(client);
      setStatus('Connected ✅');

      playDing();
      setBurstTile(tileId);
      setTimeout(() => setBurstTile(null), 300);

      setLeaderboard((prev) => {
        const short = address.slice(0, 18) + '...';
        const others = prev.filter((p) => p.name !== short);
        return [...others, { name: short, taps: newTaps }].sort((a, b) => b.taps - a.taps);
      });

      setTileState((s) => ({ ...s, [tileId]: 'cooldown' }));
      cooldownTimers.current[tileId] = setTimeout(() => {
        setTileState((s) => ({ ...s, [tileId]: undefined }));
      }, COOLDOWN_MS);
    } catch (err) {
      console.error(err);
      setStatus('Mint failed: ' + err.message);
      setTileState((s) => ({ ...s, [tileId]: undefined }));
    }
  }

  useEffect(() => {
    return () => {
      Object.values(cooldownTimers.current).forEach(clearTimeout);
    };
  }, []);

  const uctDisplay =
    balance !== null ? (Number(balance) / 10 ** UCT_DECIMALS).toFixed(4) + ' UCT' : '...';

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

          <div style={{ display: 'flex', justifyContent: 'center', gap: 12, margin: '30px auto', flexWrap: 'wrap', maxWidth: 420 }}>
            {TILES.map((tile) => {
              const state = tileState[tile.id];
              return (
                <div key={tile.id} style={{ position: 'relative', width: 90, height: 104, marginTop: tile.offset ? 52 : 0 }}>
                  {burstTile === tile.id && (
                    <div style={{ position: 'absolute', inset: -14, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.5) 0%, transparent 70%)', animation: 'pulse 0.3s ease-out', pointerEvents: 'none' }} />
                  )}
                  <div
                    onClick={() => mineTap(tile.id)}
                    style={{
                      width: 90, height: 104,
                      clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                      background: state === 'mining' ? '#d97706' : state === 'cooldown' ? '#7c5a1e' : 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: state ? 'not-allowed' : 'pointer', userSelect: 'none',
                      fontWeight: 'bold', color: '#fff', fontSize: 12,
                      transition: 'transform 0.1s, background 0.2s',
                      transform: state === 'mining' ? 'scale(0.92)' : 'scale(1)',
                    }}
                  >
                    {state === 'mining' ? '...' : state === 'cooldown' ? '⏳' : 'TAP'}
                  </div>
                </div>
              );
            })}
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
