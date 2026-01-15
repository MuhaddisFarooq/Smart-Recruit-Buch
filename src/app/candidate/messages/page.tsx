
"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Send, User, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Message = {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    created_at: string;
    is_read: number;
    job_id?: number | null;
};

type Conversation = {
    user: {
        id: number;
        name: string;
        avatar_url?: string;
        role: string;
    };
    lastMessage?: {
        message: string;
        is_read: number;
        sender_id: number;
    };
};

export default function CandidateMessagesPage() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedUser, setSelectedUser] = useState<Conversation["user"] | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedUser) {
            fetchMessages(selectedUser.id);
            // Poll for new messages every 5 seconds
            const interval = setInterval(() => fetchMessages(selectedUser.id, true), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedUser]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const res = await fetch("/api/messages");
            if (res.ok) {
                const data = await res.json();
                setConversations(data);
                if (data.length > 0 && !selectedUser) {
                    setSelectedUser(data[0].user);
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (userId: number, background = false) => {
        if (!background) setLoading(true);
        try {
            const res = await fetch(`/api/messages?user_id=${userId}`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data);
            }
        } catch (error) {
            console.error("Failed to fetch messages", error);
        } finally {
            if (!background) setLoading(false);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUser) return;

        setSending(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiver_id: selectedUser.id,
                    message: newMessage.trim(),
                }),
            });

            if (res.ok) {
                setNewMessage("");
                fetchMessages(selectedUser.id, true);
                fetchConversations(); // Update last message in sidebar
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            toast.error("Error sending message");
        } finally {
            setSending(false);
        }
    };

    if (loading && conversations.length === 0) {
        return <div className="p-8 flex justify-center"><div className="animate-spin h-8 w-8 border-2 border-[#238740] rounded-full border-t-transparent"></div></div>;
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-[#E6E6E6] h-[calc(100vh-140px)] flex overflow-hidden">
            {/* Sidebar */}
            <div className="w-1/3 border-r border-[#E6E6E6] flex flex-col">
                <div className="p-4 border-b border-[#E6E6E6] flex items-center justify-between bg-gray-50">
                    <h2 className="font-semibold text-gray-800">Messages</h2>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 text-sm">
                            <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-20" />
                            <p>No conversations yet</p>
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.user.id}
                                onClick={() => setSelectedUser(conv.user)}
                                className={cn(
                                    "p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors flex items-center gap-3",
                                    selectedUser?.id === conv.user.id ? "bg-[#F0FDF4] border-l-4 border-l-[#238740]" : "border-l-4 border-l-transparent"
                                )}
                            >
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={conv.user.avatar_url} />
                                    <AvatarFallback>{conv.user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">{conv.user.name}</h3>
                                    <p className={cn(
                                        "text-xs truncate",
                                        conv.lastMessage?.is_read === 0 && conv.lastMessage?.sender_id === conv.user.id ? "font-bold text-gray-900" : "text-gray-500"
                                    )}>
                                        {conv.lastMessage?.message || "No messages"}
                                    </p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col">
                {selectedUser ? (
                    <>
                        {/* Header */}
                        <div className="p-4 border-b border-[#E6E6E6] flex items-center gap-3 bg-white">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={selectedUser.avatar_url} />
                                <AvatarFallback>{selectedUser.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                                <h3 className="font-semibold text-gray-900">{selectedUser.name}</h3>
                                <p className="text-xs text-gray-500 capitalize">{selectedUser.role.replace('_', ' ')}</p>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA]">
                            {messages.map((msg) => {
                                const isMe = msg.sender_id == (session?.user as any)?.id;
                                return (
                                    <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[70%] rounded-lg px-4 py-2 text-sm",
                                            isMe ? "bg-white border border-gray-200 text-gray-800 rounded-br-none" : "bg-blue-50 border border-blue-100 text-gray-800 rounded-bl-none shadow-sm"
                                        )}>
                                            <p>{msg.message}</p>
                                            <p className={cn(
                                                "text-[10px] mt-1 text-right",
                                                isMe ? "text-gray-400" : "text-gray-400"
                                            )}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <div className="p-4 bg-white border-t border-[#E6E6E6]">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1"
                                />
                                <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-[#b9d36c] hover:bg-[#a6bd61] text-white">
                                    <Send className="h-4 w-4 text-white" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50">
                        <MessageCircle className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg font-medium">Select a conversation to start chatting</p>
                    </div>
                )}
            </div>
        </div>
    );
}
