const ably = require('ably');
const chat = require('@ably/chat');

console.log('Ably keys:', Object.keys(ably));
console.log('Chat keys:', Object.keys(chat));

console.log('ChatClient exists in chat:', typeof chat.ChatClient !== 'undefined');
if (typeof chat.ChatClient !== 'undefined') {
    console.log('ChatClient is a:', typeof chat.ChatClient);
}

console.log('Chat exists in ably:', typeof ably.Chat !== 'undefined');
if (typeof ably.Chat !== 'undefined') {
    console.log('Ably.Chat keys:', Object.keys(ably.Chat));
}