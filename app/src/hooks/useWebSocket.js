// hooks/useWebSocket.js
import { useEffect, useRef, useState } from 'react';

export const useWebSocket = (conversationId) => {
    const [messages, setMessages] = useState([]);
    const [isConnected, setIsConnected] = useState(false);
    const ws = useRef(null);

    useEffect(() => {
        const connect = () => {
            ws.current = new WebSocket(`ws://localhost:8000/ws/chat/${conversationId}/`);
            
            ws.current.onopen = () => setIsConnected(true);
            ws.current.onclose = () => setIsConnected(false);
            ws.current.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.type === 'llm_token') {
                    // Handle streaming tokens
                    setMessages(prev => updateLastMessage(prev, data.token));
                } else if (data.type === 'llm_done') {
                    // Finalize message
                    setMessages(prev => finalizeLastMessage(prev, data.message_id));
                }
            };
        };

        connect();

        return () => {
            ws.current?.close();
        };
    }, [conversationId]);

    const sendMessage = (content) => {
        if (ws.current && isConnected) {
            ws.current.send(JSON.stringify({
                type: 'user_message',
                content,
                timestamp: new Date().toISOString()
            }));
        }
    };

    return { messages, sendMessage, isConnected };
};