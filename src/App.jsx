import { useState } from 'react';
import { ConnectClient } from '@unicitylabs/sphere-sdk/connect';
import { PostMessageTransport } from '@unicitylabs/sphere-sdk/connect/browser';

const WALLET_URL = 'https://sphere.unicity.network';

function App() {
  const [status, setStatus] = useState('Not connected');
  const [address, setAddress] = useState(null);

  async function connectWallet() {
  setStatus('Opening wallet...');
  try {
    const popup = window.open(
      `${WALLET_URL}/connect?origin=${encodeURIComponent(window.location.origin)}`,
      'SphereConnect',
      'width=420,height=640'
    );

    // Wait for the popup to actually finish loading before talking to it
    await new Promise((resolve) => {
      const check = setInterval(() => {
        if (popup.document && popup.document.readyState === 'complete') {
          clearInterval(check);
          resolve();
        }
      }, 200);
      // safety fallback in case readyState check can't access cross-origin popup
      setTimeout(() => { clearInterval(check); resolve(); }, 2500);
    });

    const transport = PostMessageTransport.forClient({
      target: popup,
      targetOrigin: WALLET_URL,
    });

    const client = new ConnectClient({
      transport,
      dapp: {
        name: 'Hex Miner',
        description: 'Tap to mine hex tiles on Unicity testnet',
        url: window.location.origin,
        network: 'testnet2',
      },
    });

    setStatus('Waiting for approval...');
    const { identity } = await client.connect();
    setAddress(identity.directAddress);
    setStatus('Connected! Signing...');

    await client.intent('sign_message', {
      message: `Sign in to Hex Miner at ${new Date().toISOString()}`,
    });

    setStatus('Connected and signed ✅');
  } catch (err) {
    console.error(err);
    setStatus('Failed: ' + err.message);
  }
  }

      const transport = PostMessageTransport.forClient({
        target: popup,
        targetOrigin: WALLET_URL,
      });

      const client = new ConnectClient({
  transport,
  dapp: {
    name: 'Hex Miner',
    description: 'Tap to mine hex tiles on Unicity testnet',
    url: window.location.origin,
    network: 'testnet2',
  },
});

      setStatus('Waiting for approval...');
      const { identity } = await client.connect();
      setAddress(identity.directAddress);
      setStatus('Connected! Signing...');

      await client.intent('sign_message', {
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
