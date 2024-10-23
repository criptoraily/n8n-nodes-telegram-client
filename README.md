# n8n-nodes-telegram-client

This is a comprehensive Telegram Client node for n8n that allows you to interact with Telegram as a regular user (not a bot). It provides access to advanced Telegram features that are not available through the regular bot API.

## Features

- 🔐 Full user authentication support
- 📝 Complete message operations (send, edit, delete, pin)
- 📸 Media handling (photos, videos, documents)
- 👥 Chat management (join, leave, history)
- 💾 Session management for persistent authentication
- ⚡ Real-time updates and notifications
- 🔒 Secure credential storage

## Installation

### In n8n:
1. Go to **Settings > Community Nodes**
2. Click on **Install a node from NPM**
3. Enter `n8n-nodes-telegram-client`
4. Click **Install**

### Manual Installation:
```bash
npm install n8n-nodes-telegram-client
```

## Configuration

### Prerequisites
1. Go to [my.telegram.org](https://my.telegram.org)
2. Log in and create an application
3. Note down your `api_id` and `api_hash`

### In n8n:
1. Go to **Credentials**
2. Click **Create New Credentials**
3. Select **Telegram Client API**
4. Fill in:
   - API ID (from my.telegram.org)
   - API Hash (from my.telegram.org)
   - Phone Number (international format)
   - 2FA Password (if enabled)

## First Use
1. When using the node for the first time, you'll be prompted for a verification code
2. Enter the code sent to your Telegram account
3. The session will be saved for future use

## Usage

### Available Operations

#### Message Operations
- `sendMessage`: Send text messages
- `replyToMessage`: Reply to existing messages
- `editMessage`: Edit sent messages
- `deleteMessages`: Delete messages
- `forwardMessages`: Forward messages
- `pinMessage`: Pin messages in chats

#### Media Operations
- `sendMedia`: Send photos, videos, or documents
- `sendAlbum`: Send multiple media files as an album
- `downloadMedia`: Download media from messages

#### Chat Operations
- `getChatHistory`: Get chat message history
- `joinChat`: Join channels or groups
- `leaveChat`: Leave channels or groups

### Example Usage

#### Send Message
```json
{
  "operation": "sendMessage",
  "chatId": "@username or chat_id",
  "messageText": "Hello from n8n!"
}
```

#### Send Media
```json
{
  "operation": "sendMedia",
  "chatId": "@username or chat_id",
  "filePath": "/path/to/file.jpg",
  "mediaType": "photo"
}
```

## Error Handling
The node includes comprehensive error handling:
- Authentication errors
- Network issues
- Invalid parameters
- API limitations

## Security
- Credentials are stored securely in n8n
- Session strings are encrypted
- 2FA support included
- No plaintext password storage

## Development

### Build
```bash
npm install
npm run build
```

### Test
```bash
npm test
```

### Lint
```bash
npm run lint
```

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License
MIT License - see LICENSE file for details

## Support
- Create an issue on GitHub
- Contact the maintainer

## Acknowledgments
- Telegram Client API
- n8n Community
- Contributors

