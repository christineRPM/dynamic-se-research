# Dynamic.xyz Demo

**Live Demo: [www.zurikai.com](https://www.zurikai.com)**

Demo addressing concerns about Dynamic's wallet infrastructure for USDC transactions and secure authentication.

## Quick Start

```bash
npm install
npm run dev
# Visit http://localhost:3000
```

## Demo Solutions

### **1. USDC Transactions from Embedded Wallets**
- Send/receive USDC with Dynamic's embedded wallet
- No gas fees - account abstraction handles everything
- Pure stablecoin focus

### **2. Account Abstraction Simplified**
- ZeroDev integration abstracts away complexity
- Smart wallet wrapping with gas sponsorship
- Users don't need blockchain knowledge

### **3. Backend JWT Verification**
- Cryptographically verify Dynamic's JWTs using their JWKS endpoint
- Production-ready authentication for enterprise apps
- Simple Next.js API integration

## Environment Setup

```env
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your_environment_id
```

## Documentation Links

- **Dynamic Documentation**: https://www.dynamic.xyz/docs/introduction/welcome
- **Account Abstraction Guide**: https://www.dynamic.xyz/docs/smart-wallets/add-smart-wallets
- **Embedded Wallets**: https://www.dynamic.xyz/docs/wallets/embedded-wallets/mpc/setup
- **Cookie Authentication**: https://www.dynamic.xyz/docs/authentication-methods/cookie-authentication
- **Auth Tokens**: https://www.dynamic.xyz/docs/authentication-methods/auth-tokens

## Key Benefits

- **Simple UX**: No blockchain complexity for users
- **Enterprise Security**: Cryptographic JWT verification
- **Production Ready**: Built with Next.js 15 and TypeScript

---

**Built for enterprise teams evaluating Dynamic.xyz**

