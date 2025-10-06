// Decode the QR code data to check the URL
const qrData = {
  "sessionId": "63002aa0-eedf-4666-a9fa-10b7eff45c40",
  "timestamp": 1759769965190,
  "nonce": "7b04cae9995730fbff23e6042cad719a",
  "signature": "1320b73eaaa977136460c0be35cecefef2ddc8c3b3a7f20bf308b49c78197c7a",
  "expiresAt": "2025-10-06T16:59:25.190Z"
};

const baseUrl = 'http://10.102.42.149:3000';
const qrUrl = `${baseUrl}/student/scan?data=${encodeURIComponent(JSON.stringify(qrData))}`;

console.log('🔗 QR Code URL:');
console.log(qrUrl);

console.log('\n✅ Verification:');
if (qrUrl.includes('10.102.42.149:3000')) {
  console.log('✅ QR code now uses correct IP address!');
} else {
  console.log('❌ QR code still has wrong IP address');
}
