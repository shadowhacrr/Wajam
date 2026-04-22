module.exports = {
    // ═══════════════════════════════════════════════════
    //  🤖  BOT CONFIGURATION
    // ═══════════════════════════════════════════════════
    
    mainToken: '8637346209:AAFDnQhKc4NWdlD6aqFvdO1_NGyOVJZRjXM', // Bot Token Here 
    
    S7: 'SHDOW', // Owner Name
    
    adminId: '8627624927', // Owner Chat ID (control /addresell, /delresell)
    
    bot: 'SHADOW', // Bot Display Name
    
    logo: './SY/Loves.jpg', // Bot logo path or URL
    
    // ═══════════════════════════════════════════════════
    //  🔗  SOCIAL LINKS (For Verification System)
    // ═══════════════════════════════════════════════════
    
    channel: 'https://t.me/ssbugchannel', // Telegram Channel (Required to Join)
    
    group: 'https://t.me/+ZVEczsZmiWFkNTBl', // Telegram Group (Required to Join)
    
    youtube: 'https://youtube.com/@shadowhere.460?si=v8hdJUHkhhM-or9N', // YouTube Channel (Required to Join)
    // 👆 CHANGE THIS TO YOUR REAL YOUTUBE CHANNEL LINK
    
    whatsapp: 'https://whatsapp.com/channel/0029VbD54jxEgGfIqPaPSK24', // WhatsApp Channel (Required to Join)
    // 👆 CHANGE THIS TO YOUR REAL WHATSAPP CHANNEL LINK
    
    // ═══════════════════════════════════════════════════
    //  💰  PRICING & MESSAGES
    // ═══════════════════════════════════════════════════
    
    prices: {
        permanent: 15,      // $ Permanent Access
        resell: 30,         // $ Permanent Resell
        script: 100         // $ Full Source Code
    },
    
    currency: '$', // Currency symbol
    
    // ═══════════════════════════════════════════════════
    //  ⚙️  BOT SETTINGS
    // ═══════════════════════════════════════════════════
    
    settings: {
        maxBotsPerUser: 5,      // Max extra bots a user can add
        verifyRequired: true,   // Force verification before using bot
        premiumOnly: true,      // true = Only premium can use bug commands
        welcomeAnimation: true, // Show loading animation on verify
        notifyOnPremium: true   // Notify user when premium added/removed
    },
    
    // ═══════════════════════════════════════════════════
    //  🎨  UI CUSTOMIZATION
    // ═══════════════════════════════════════════════════
    
    ui: {
        theme: 'dark',          // dark / light
        animations: true,       // Enable animated messages
        fancyText: true,        // Enable stylish fonts
        showStatus: true        // Show user status in menu
    },
    
    // ═══════════════════════════════════════════════════
    //  📢  MESSAGES
    // ═══════════════════════════════════════════════════
    
    messages: {
        notVerified: '🚫 Please verify yourself first! Use /start',
        notPremium: '🔒 Premium access required! Contact admin to buy.',
        notAuthorized: '⛔ You are not authorized to use this command.',
        welcomeVerified: '✅ Welcome! You have been verified successfully.',
        premiumAdded: '⭐ Congratulations! Your account has been upgraded to PREMIUM!',
        premiumRemoved: '💔 Your premium access has been revoked.'
    }
};
