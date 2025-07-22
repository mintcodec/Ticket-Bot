# Discord Ticket Bot

A feature-rich Discord ticket system bot that allows users to create support tickets through an interactive embed with category selection. The bot supports multiple ticket categories, automatic staff notifications, and generates transcripts when tickets are closed.

## Features

- **Multiple Ticket Categories**: Support, Chat, and Ideas tickets
- **Interactive Embed Interface**: Clean button-based ticket creation
- **Category Restrictions**: Users can only have one active ticket per category
- **Staff Notifications**: Automatic pings when users respond in tickets
- **Transcript Generation**: Automatic ticket logs saved locally and sent to users
- **Permission Management**: Proper channel permissions for ticket privacy
- **Auto-cleanup**: Channels are automatically deleted after closure

## Prerequisites

Before setting up the bot, make sure you have:

- [Node.js](https://nodejs.org/) (version 16.9.0 or higher)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- A Discord account and server with Administrator permissions
- A Discord application/bot token

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/discord-ticket-bot.git
   cd discord-ticket-bot
   ```

2. **Install dependencies**
   ```bash
   npm install discord.js
   ```

3. **Configure the bot**
   Edit the `CONFIG` object in the main file with your server details:
   ```javascript
   const CONFIG = {
       TOKEN: 'your-bot-token-here',
       GUILD_ID: 'your-server-id-here',
       STAFF_ROLE_ID: 'your-staff-role-id-here',
       TICKET_CATEGORY_ID: 'your-ticket-category-id-here', // Optional
       TICKET_LOGS_CHANNEL_ID: 'your-logs-channel-id-here', // Optional
       TICKET_CHANNEL_ID: 'your-ticket-panel-channel-id-here'
   };
   ```

## Discord Bot Setup

### 1. Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the sidebar
4. Click "Add Bot" and confirm
5. Copy the bot token for your config

### 2. Set Bot Permissions

In the "Bot" section, enable the following permissions:
- Send Messages
- Use Slash Commands
- Manage Channels
- Manage Roles
- Read Message History
- View Channels
- Add Reactions

### 3. Generate Invite Link

1. Go to the "OAuth2" > "URL Generator" section
2. Select "bot" scope
3. Select the same permissions as above
4. Copy the generated URL and invite the bot to your server

## Server Setup

### 1. Get Required IDs

Enable Developer Mode in Discord (User Settings > Advanced > Developer Mode), then:

- **Server ID**: Right-click your server name → "Copy Server ID"
- **Staff Role ID**: Right-click your staff role → "Copy Role ID"
- **Channel IDs**: Right-click channels → "Copy Channel ID"

### 2. Create Necessary Channels/Categories (Optional)

- Create a category for ticket channels (recommended)
- Create a channel for ticket logs (optional)
- Create or choose a channel for the ticket panel

### 3. Set Up Staff Role

Create a role for staff members who should have access to tickets. This role will be mentioned when new tickets are created and users respond.

## Configuration Options

| Setting | Description | Required |
|---------|-------------|----------|
| `TOKEN` | Your Discord bot token | ✅ |
| `GUILD_ID` | Your Discord server ID | ✅ |
| `STAFF_ROLE_ID` | ID of the role that can access tickets | ✅ |
| `TICKET_CHANNEL_ID` | Channel where the ticket panel will be posted | ✅ |
| `TICKET_CATEGORY_ID` | Category where ticket channels will be created | ❌ |
| `TICKET_LOGS_CHANNEL_ID` | Channel for logging ticket closures | ❌ |

## Running the Bot

1. **Start the bot**
   ```bash
   node index.js
   ```

2. **Verify setup**
   - The bot should log "✅ [BotName] is online!" when started
   - The ticket panel should appear in your configured channel
   - Test ticket creation to ensure everything works

## Usage

### For Users
1. Click one of the category buttons in the ticket panel
2. A private ticket channel will be created
3. Describe your issue/question/idea in the channel
4. Staff will be automatically notified
5. Use the "Close Ticket" button when resolved

### For Staff
- Access any ticket channel created in your server
- Respond to user messages (they'll be notified if you haven't responded recently)
- Close tickets using the "Close Ticket" button
- Transcripts are automatically generated and saved

## File Structure

```
discord-ticket-bot/
├── index.js              # Main bot file
├── ticket-logs/          # Auto-created directory for transcripts
├── package.json          # Node.js dependencies
└── README.md            # This file
```

## Ticket Categories

The bot comes with three pre-configured categories:

- **🛠️ Support**: Technical issues, bugs, or general help
- **💬 Chat**: General questions or discussions  
- **💡 Ideas**: Suggestions or feature requests

You can modify these in the `sendTicketEmbed()` function.

## Troubleshooting

**Bot doesn't respond to button clicks:**
- Verify the bot has proper permissions in your server
- Check that the bot token is correct
- Ensure the bot is online and the console shows no errors

**Ticket channels aren't created:**
- Verify `GUILD_ID` and `STAFF_ROLE_ID` are correct
- Check that the bot has "Manage Channels" permission
- Ensure the ticket category exists (if specified)

**Users can't see ticket channels:**
- Verify the bot has permission to manage channel permissions
- Check that the staff role ID is correct

**Transcripts aren't generated:**
- Ensure the bot has write permissions in its directory
- Check console for any file system errors

## Support

If you encounter issues:
1. Check the console for error messages
2. Verify all IDs in your configuration are correct
3. Ensure the bot has all required permissions
4. Make sure you're running Node.js 16.9.0 or higher

## License

This project is licensed under the MIT License - see the LICENSE file for details.
