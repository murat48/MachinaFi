/**
 * MachineNet Contract Deployer
 * 
 * Bu script machinenet-payment.clar kontratını Stacks testnet'e deploy eder.
 * 
 * Kullanım:
 *   node deploy.mjs
 * 
 * Gereksinimler:
 *   - Deployer adresinde en az 1 STX olması gerekiyor
 *   - Faucet: https://explorer.hiro.so/sandbox/deploy?chain=testnet
 *             https://faucet.stacks.co
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const { makeContractDeploy, broadcastTransaction, AnchorMode, PostConditionMode } =
  await import('@stacks/transactions');
const { STACKS_TESTNET } = await import('@stacks/network');

const walletSdk = await import('@stacks/wallet-sdk');

// ---------------------------------------------------------------------------
// Deployer wallet (auto-generated — testnet only, no real value)
// ---------------------------------------------------------------------------
const MNEMONIC =
  'seven spot range garment maximum mosquito auction wheat tiny empty upset ivory best laugh weird vague promote fuel kick husband witness crane final magnet';

const STACKS_API = 'https://api.testnet.hiro.so';

async function main() {
  // 1. Derive private key from mnemonic
  const wallet = await walletSdk.generateWallet({ secretKey: MNEMONIC, password: '' });
  const account = wallet.accounts[0];
  const privateKey = account.stxPrivateKey;

  const { getAddressFromPrivateKey } = await import('@stacks/transactions');
  const deployerAddress = getAddressFromPrivateKey(privateKey, STACKS_TESTNET);
  console.log(`\n🔑 Deployer: ${deployerAddress}`);

  // 2. Check balance
  const balRes = await fetch(`${STACKS_API}/v2/accounts/${deployerAddress}`);
  const balData = await balRes.json();
  const balance = parseInt(balData.balance || '0x0', 16);
  console.log(`💰 Balance: ${balance / 1_000_000} STX`);

  if (balance < 100_000) {
    console.error('\n❌ Insufficient balance. Please fund the deployer address first:');
    console.error(`   Address : ${deployerAddress}`);
    console.error('   Faucet  : https://explorer.hiro.so/sandbox/deploy?chain=testnet');
    console.error('             (Testnet STX → address alanına yapıştır, Request STX butonuna bas)');
    process.exit(1);
  }

  // 3. Read contract source
  const contractSource = readFileSync(
    join(__dirname, 'contracts', 'machinenet-payment.clar'),
    'utf8'
  );

  // 4. Get nonce
  const nonceRes = await fetch(`${STACKS_API}/v2/accounts/${deployerAddress}`);
  const nonceData = await nonceRes.json();
  const nonce = nonceData.nonce;

  // 5. Build deploy transaction
  const txOptions = {
    contractName: 'machinenet-payment',
    codeBody: contractSource,
    senderKey: privateKey,
    network: STACKS_TESTNET,
    anchorMode: AnchorMode.Any,
    postConditionMode: PostConditionMode.Allow,
    fee: 20000n,
    nonce: BigInt(nonce),
  };

  console.log('\n📦 Building deployment transaction...');
  const tx = await makeContractDeploy(txOptions);

  // 6. Broadcast
  console.log('📡 Broadcasting to Stacks testnet...');
  const result = await broadcastTransaction({ transaction: tx, network: STACKS_TESTNET });

  if (result.error) {
    console.error('\n❌ Broadcast failed:', result.error, result.reason);
    process.exit(1);
  }

  const txId = result.txid;
  const contractAddress = `${deployerAddress}.machinenet-payment`;

  console.log('\n✅ Contract deployed successfully!');
  console.log('─'.repeat(60));
  console.log(`TX ID    : ${txId}`);
  console.log(`Contract : ${contractAddress}`);
  console.log(`Explorer : https://explorer.hiro.so/txid/${txId}?chain=testnet`);
  console.log('─'.repeat(60));
  console.log('\n📝 Şimdi şu dosyaları güncelle:');
  console.log('');
  console.log('frontend/.env.local:');
  console.log(`  NEXT_PUBLIC_CONTRACT_ADDRESS=${deployerAddress}`);
  console.log(`  NEXT_PUBLIC_PAYMENT_RECEIVER=${deployerAddress}`);
  console.log('');
  console.log('backend/.env:');
  console.log(`  PAYMENT_RECEIVER_ADDRESS=${deployerAddress}`);
  console.log('');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
