<div align="center">

# 🔒 Secure File Vault

**Encrypted File Storage System**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blueviolet.svg)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38bdf8.svg)](https://tailwindcss.com/)

[Features](#-features) • [Installation](#-installation) • [Usage](#-usage) • [Tech Stack](#-tech-stack) • [Disclaimer](#-disclaimer)

</div>

---

## 📖 Overview

**Secure File Vault** is a security-first file storage application designed to demonstrate robust encryption-at-rest implementation. It allows users to securely upload, store, and retrieve files with industry-standard encryption standards.

> [!WARNING]
> **PROTOTYPE STATUS**
> This project is a **PROTOTYPE** for educational and demonstration purposes. While it uses strong crypto primitives, key management in production requires HSMs or KMS.

Built with a **Node.js** backend and **React** frontend, it features a modern dark-mode interface and handles encryption transparently for the user.

## ✨ Features

- 🎨 **Modern Interface**: Professional UI built with React and Tailwind CSS.
- 🔒 **Encryption-at-Rest**: Files are encrypted using **AES-256-GCM**.
- 🔑 **Secure Key Management**: Unique Data Encryption Key (DEK) per file, wrapped with a Master Key.
- 👥 **Multi-User Support**: JWT-based authentication with isolation between users.
- ⚡ **Fast & Efficient**: Stream-optimized upload and download handling (memory storage for prototype).
- 🛡️ **Full Integrity**: Authenticated encryption ensures data hasn't been tampered with.

## 🛠 Tech Stack

- **Backend**: Node.js, Express, Prisma (SQLite), Crypto module
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React
- **Security**: AES-256-GCM, Bcrypt, JWT
- **Database**: SQLite (via Prisma ORM)

## 📦 Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

- Node.js (v18 or higher)
- npm

### 1. Clone the Repo

```bash
git clone https://github.com/yourusername/secure-file-vault.git
cd secure-file-vault
```

### 2. Install Dependencies

You can set up both client and server easily:

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Environment Setup

Create a `.env` file in the `server` directory:

```properties
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key"
MASTER_KEY="your-32-byte-hex-master-key"
PORT=3000
```

> **Tip**: Generate a secure master key using `openssl rand -hex 32`.

### 4. Database Migration

Initialize the database:

```bash
cd server
npx prisma migrate dev --name init
```

## 🚀 Usage

### Start Backend

```bash
cd server
npm run dev
```

### Start Frontend

```bash
cd client
npm run dev
```

Access the application at `http://localhost:5173`. Register an account and start uploading files securely!

## 🛡️ Security Architecture

1.  **File Upload**:
    - Random 32-byte **DEK** (Data Encryption Key) generated.
    - File content encrypted with DEK using **AES-256-GCM**.
2.  **Key Wrapping**:
    - DEK is encrypted with **Master Key** using AES-256-GCM.
    - Encrypted DEK is stored in database alongside file metadata.
3.  **Storage**:
    - Encrypted file blob stored on disk (`uploads/` directory).
    - Metadata (IV, AuthTags, File Info) stored in SQLite.

## ⚠️ Disclaimer

> [!NOTE]
> **EDUCATIONAL USE**
> 
> This tool is provided to demonstrate secure coding practices. Review code thoroughly before adapting for production use.

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
