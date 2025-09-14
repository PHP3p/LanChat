const Ably = require('ably');

// 创建Ably Realtime客户端
const ablyClient = new Ably.Realtime({
    key: "gKBpjg._VtU5w:LsMU5sXzmPha_OFgm5rqk2oBBawgASoMVXEOmjC18pQ",
    clientId: "ably-chat-test"
});

// 监听连接状态变化
ablyClient.connection.on('connected', () => {
    console.log('已连接到Ably服务器');
    
    // 获取频道
    const channel = ablyClient.channels.get('test-channel');
    
    // 订阅消息
    channel.subscribe('message', (message) => {
        console.log('收到消息:', message.data);
    });
    
    // 发送测试消息
    channel.publish('message', 'Hello from Node.js!', (err) => {
        if (err) {
            console.error('发送消息失败:', err);
        } else {
            console.log('消息发送成功');
        }
    });
    
    // 5秒后关闭连接
    setTimeout(() => {
        ablyClient.close();
        console.log('连接已关闭');
    }, 5000);
});

ablyClient.connection.on('failed', (err) => {
    console.error('连接失败:', err);
});

console.log('正在连接到Ably服务器...');