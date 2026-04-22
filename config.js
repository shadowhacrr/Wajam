module.exports = {
    // ═══════════════════════════════════════════════════
    //  🤖  BOT CONFIGURATION
    // ═══════════════════════════════════════════════════
    
    mainToken: '8637346209:AAFDnQhKc4NWdlD6aqFvdO1_NGyOVJZRjXM',
    
    S7: 'SHDOW',
    
    adminId: '8627624927',
    
    bot: 'SHADOW',
    
    logo: './SY/Loves.jpg',
    
    // ═══════════════════════════════════════════════════
    //  🔗  SOCIAL LINKS (For Verification System)
    // ═══════════════════════════════════════════════════
    
    // ⚠️ IMPORTANT: Bot ko in channels/groups mein ADMIN banana ZAROORI hai!
    
    channel: 'https://t.me/ssbugchannel',
    
    group: 'https://t.me/+ZVEczsZmiWFkNTBl',
    
    youtube: 'https://youtube.com/@shadowhere.460?si=v8hdJUHkhhM-or9N',
    
    whatsapp: 'https://whatsapp.com/channel/0029VbD54jxEgGfIqPaPSK24',
    
    // ═══════════════════════════════════════════════════
    //  🆔  CHAT IDs (Verification ke liye ZAROORI)
    // ═══════════════════════════════════════════════════
    
    // Bot ko admin banao, phir /start se yeh IDs auto-capture hongi
    // Ya manually @userinfobot se channel/group ki ID nikaalo
    
    channelId: '-1003740544433', // Yahan channel ki ID aayegi (-100... format mein)
    groupId: '-1003989785950',   // Yahan group ki ID aayegi
    
    // ═══════════════════════════════════════════════════
    //  💰  PRICING & MESSAGES
    // ═══════════════════════════════════════════════════
    
    prices: {
        permanent: 15,
        resell: 30,
        script: 100
    },
    
    currency: '$',
    
    // ═══════════════════════════════════════════════════
    //  ⚙️  BOT SETTINGS
    // ═══════════════════════════════════════════════════
    
    settings: {
        maxBotsPerUser: 5,
        verifyRequired: true,
        premiumOnly: true,
        welcomeAnimation: true,
        notifyOnPremium: true
    },
    
    // ═══════════════════════════════════════════════════
    //  🎨  UI CUSTOMIZATION
    // ═══════════════════════════════════════════════════
    
    ui: {
        theme: 'dark',
        animations: true,
        fancyText: true,
        showStatus: true
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
