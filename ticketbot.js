const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');


// Change this to your data !

const CONFIG = {
    TOKEN: 'TOKEN_HERE',
    GUILD_ID: 'GUILD_ID_HERE',
    STAFF_ROLE_ID: 'STAFF_ROLE_ID_HERE',
    TICKET_CATEGORY_ID: 'ticket-category-id-here', // Optional
    TICKET_LOGS_CHANNEL_ID: 'TICKET_LOGS_CHANNEL_ID_HERE', // Optional
    TICKET_CHANNEL_ID: 'TICKET_CHANNEL_ID_HERE' // The channel where the ticket panel will be sent
};

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});


const activeTickets = new Map(); 
const userTicketCategories = new Map();

async function ensureLogsDirectory() {
    try {
        await fs.access('./ticket-logs');
    } catch {
        await fs.mkdir('./ticket-logs', { recursive: true });
    }
}

client.once('ready', async () => {
    console.log(`✅ ${client.user.tag} is online!`);
    await ensureLogsDirectory();
    
    const guild = client.guilds.cache.get(CONFIG.GUILD_ID);
    const channel = guild.channels.cache.get(CONFIG.TICKET_CHANNEL_ID);
    
    if (channel) {
        await sendTicketEmbed(channel);
    }
});


async function sendTicketEmbed(channel) {
    const embed = new EmbedBuilder()
        .setTitle('🎫 Support Tickets')
        .setDescription('Need help? Create a support ticket by selecting a category below!')
        .setColor(0x5865F2)
        .addFields(
            { name: '🛠️ Support', value: 'Technical issues, bugs, or general help', inline: true },
            { name: '💬 Chat', value: 'General questions or discussions', inline: true },
            { name: '💡 Ideas', value: 'Suggestions or feature requests', inline: true }
        )
        .setFooter({ text: 'Click a button below to create a ticket!' })
        .setTimestamp();

    const row1 = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('ticket_support')
                .setLabel('Support')
                .setEmoji('🛠️')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('ticket_chat')
                .setLabel('Chat')
                .setEmoji('💬')
                .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
                .setCustomId('ticket_ideas')
                .setLabel('Ideas')
                .setEmoji('💡')
                .setStyle(ButtonStyle.Success)
        );

    await channel.send({ embeds: [embed], components: [row1] });
}

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const { customId, user, guild } = interaction;

    if (customId.startsWith('ticket_')) {
        const category = customId.split('_')[1];
        await handleTicketCreation(interaction, category);
    } else if (customId === 'close_ticket') {
        await handleTicketClose(interaction);
    }
});

async function handleTicketCreation(interaction, category) {
    const { user, guild } = interaction;
    
    
    const userCategories = userTicketCategories.get(user.id) || new Set();
    if (userCategories.has(category)) {
        return interaction.reply({
            content: `❌ You already have an active **${category}** ticket! Please close it before creating a new one.`,
            ephemeral: true
        });
    }

    try {
      
        const channelName = `${category}-${user.username}`;
        const ticketChannel = await guild.channels.create({
            name: channelName,
            type: ChannelType.GuildText,
            parent: CONFIG.TICKET_CATEGORY_ID || null,
            permissionOverwrites: [
                {
                    id: guild.roles.everyone.id,
                    deny: [PermissionFlagsBits.ViewChannel]
                },
                {
                    id: user.id,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                },
                {
                    id: CONFIG.STAFF_ROLE_ID,
                    allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory]
                }
            ]
        });

  
        activeTickets.set(user.id, {
            channelId: ticketChannel.id,
            category: category,
            lastStaffResponse: Date.now(),
            messages: [],
            createdAt: new Date()
        });


        if (!userTicketCategories.has(user.id)) {
            userTicketCategories.set(user.id, new Set());
        }
        userTicketCategories.get(user.id).add(category);




        const ticketEmbed = new EmbedBuilder()
            .setTitle(`🎫 ${category.charAt(0).toUpperCase() + category.slice(1)} Ticket`)
            .setDescription(`Hello ${user}! Thank you for creating a ticket.\n\nPlease describe your ${category === 'support' ? 'issue' : category === 'chat' ? 'question' : 'idea'} in detail and our staff will assist you shortly.`)
            .setColor(category === 'support' ? 0x3498db : category === 'chat' ? 0x95a5a6 : 0x2ecc71)
            .setFooter({ text: 'Staff have been notified!' })
            .setTimestamp();

        const closeButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('close_ticket')
                    .setLabel('Close Ticket')
                    .setEmoji('🔒')
                    .setStyle(ButtonStyle.Danger)
            );


        const staffRole = `<@&${CONFIG.STAFF_ROLE_ID}>`;
        await ticketChannel.send({
            content: `${user} ${staffRole}`,
            embeds: [ticketEmbed],
            components: [closeButton]
        });

        await interaction.reply({
            content: `✅ Your **${category}** ticket has been created! Check ${ticketChannel}`,
            ephemeral: true
        });

    } catch (error) {
        console.error('Error creating ticket:', error);
        await interaction.reply({
            content: '❌ There was an error creating your ticket. Please try again later.',
            ephemeral: true
        });
    }
}

client.on('messageCreate', async message => {
    if (message.author.bot) return;


    const ticketData = [...activeTickets.values()].find(ticket => ticket.channelId === message.channel.id);
    if (!ticketData) return;

    const ticketOwner = [...activeTickets.entries()].find(([userId, data]) => data.channelId === message.channel.id)?.[0];
    if (!ticketOwner) return;


    ticketData.messages.push({
        author: message.author.tag,
        authorId: message.author.id,
        content: message.content,
        timestamp: new Date(),
        attachments: message.attachments.map(att => att.url)
    });

    const member = message.member;
    const isStaff = member && member.roles.cache.has(CONFIG.STAFF_ROLE_ID);

    if (isStaff) {
        ticketData.lastStaffResponse = Date.now();
    } else if (message.author.id === ticketOwner) {

        const timeSinceLastStaffResponse = Date.now() - ticketData.lastStaffResponse;
        const shouldPing = timeSinceLastStaffResponse > 60000; 

        if (shouldPing) {
            await message.channel.send(`<@&${CONFIG.STAFF_ROLE_ID}> ${message.author} sent a message in this ticket.`);
            ticketData.lastStaffResponse = Date.now(); 
        }
    }
});

async function handleTicketClose(interaction) {
    const { user, channel, guild } = interaction;
    
    const ticketEntry = [...activeTickets.entries()].find(([userId, data]) => data.channelId === channel.id);
    if (!ticketEntry) {
        return interaction.reply({ content: '❌ This is not a valid ticket channel.', ephemeral: true });
    }

    const [ticketOwnerId, ticketData] = ticketEntry;
    const member = interaction.member;
    const isStaff = member && member.roles.cache.has(CONFIG.STAFF_ROLE_ID);
    const isOwner = user.id === ticketOwnerId;

    if (!isStaff && !isOwner) {
        return interaction.reply({ content: '❌ Only the ticket owner or staff can close this ticket.', ephemeral: true });
    }

    try {
        await interaction.deferReply();

        const transcript = await generateTranscript(ticketData, guild, ticketOwnerId);
        
        const ticketOwner = await guild.members.fetch(ticketOwnerId).catch(() => null);
        let leftServer = false;

        if (ticketOwner) {
            try {
                const transcriptEmbed = new EmbedBuilder()
                    .setTitle('🎫 Ticket Transcript')
                    .setDescription(`Your **${ticketData.category}** ticket has been closed.`)
                    .setColor(0x95a5a6)
                    .setTimestamp();

                await ticketOwner.send({ 
                    embeds: [transcriptEmbed],
                    files: [{ attachment: Buffer.from(transcript, 'utf8'), name: `ticket-${ticketData.category}-${ticketOwnerId}.txt` }]
                });
            } catch (error) {
                console.log('Could not send transcript to user via DM');
            }
        } else {
            leftServer = true;
        }

        const filename = `ticket-${ticketData.category}-${ticketOwnerId}-${Date.now()}.txt`;
        await fs.writeFile(path.join('./ticket-logs', filename), transcript);

        activeTickets.delete(ticketOwnerId);
        const userCategories = userTicketCategories.get(ticketOwnerId);
        if (userCategories) {
            userCategories.delete(ticketData.category);
            if (userCategories.size === 0) {
                userTicketCategories.delete(ticketOwnerId);
            }
        }

        const closeEmbed = new EmbedBuilder()
            .setTitle('🔒 Ticket Closed')
            .setDescription(`Ticket closed by ${user}${leftServer ? '\n⚠️ **Note:** User left the server while ticket was open.' : ''}`)
            .setColor(0xe74c3c)
            .setTimestamp();

        await interaction.editReply({ embeds: [closeEmbed] });

        setTimeout(async () => {
            try {
                await channel.delete();
            } catch (error) {
                console.error('Error deleting channel:', error);
            }
        }, 5000);

    } catch (error) {
        console.error('Error closing ticket:', error);
        await interaction.editReply({ content: '❌ There was an error closing the ticket.' });
    }
}

async function generateTranscript(ticketData, guild, ticketOwnerId) {
    const ticketOwner = await guild.members.fetch(ticketOwnerId).catch(() => null);
    const ownerTag = ticketOwner ? ticketOwner.user.tag : 'Unknown User';
    
    let transcript = `TICKET TRANSCRIPT\n`;
    transcript += `==========================================\n`;
    transcript += `Category: ${ticketData.category.toUpperCase()}\n`;
    transcript += `Ticket Owner: ${ownerTag} (${ticketOwnerId})\n`;
    transcript += `Created: ${ticketData.createdAt.toLocaleString()}\n`;
    transcript += `Closed: ${new Date().toLocaleString()}\n`;
    transcript += `Total Messages: ${ticketData.messages.length}\n`;
    transcript += `==========================================\n\n`;

    for (const msg of ticketData.messages) {
        transcript += `[${msg.timestamp.toLocaleString()}] ${msg.author}: ${msg.content}\n`;
        if (msg.attachments.length > 0) {
            transcript += `   Attachments: ${msg.attachments.join(', ')}\n`;
        }
    }

    return transcript;
}

client.on('error', console.error);
process.on('unhandledRejection', error => {
    console.error('Unhandled promise rejection:', error);
});

client.login(CONFIG.TOKEN);
