
"use client";

import { useState, useEffect, useRef } from "react";
import { Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useSession } from "next-auth/react";

type Message = {
    id: number;
    sender_id: number;
    receiver_id: number;
    message: string;
    created_at: string;
    is_read: number;
    job_id?: number | null;
};

interface MessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    candidate: {
        user_id: number; // Candidate's user ID is needed for messaging, not application_id
        name: string;
        avatar_url?: string;
        application_id?: number;
    } | null;
    jobId?: number; // Optional context
}

export default function MessageDialog({ open, onOpenChange, candidate, jobId }: MessageDialogProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (open && candidate) {
            fetchMessages();
            const interval = setInterval(() => fetchMessages(true), 5000);
            return () => clearInterval(interval);
        }
    }, [open, candidate]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fetchMessages = async (background = false) => {
        if (!candidate) return;
        if (!background) setLoading(true);
        try {
            const res = await fetch(`/api/messages?user_id=${candidate.user_id}`);
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
        if (!newMessage.trim() || !candidate) return;

        setSending(true);
        try {
            const res = await fetch("/api/messages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    receiver_id: candidate.user_id,
                    message: newMessage.trim(),
                    job_id: jobId,
                }),
            });

            if (res.ok) {
                setNewMessage("");
                fetchMessages(true);
            } else {
                toast.error("Failed to send message");
            }
        } catch (error) {
            toast.error("Error sending message");
        } finally {
            setSending(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0 gap-0">
                <DialogHeader className="p-4 border-b border-[#E6E6E6]">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={candidate?.avatar_url} />
                            <AvatarFallback>{candidate?.name?.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                            <DialogTitle className="text-base font-semibold text-gray-900">{candidate?.name}</DialogTitle>
                            <DialogDescription className="text-xs">Messaging</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#FAFAFA]">
                    {loading && messages.length === 0 ? (
                        <div className="flex justify-center p-4">
                            <div className="animate-spin h-6 w-6 border-2 border-[#238740] rounded-full border-t-transparent"></div>
                        </div>
                    ) : messages.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">No messages yet. Start the conversation!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isMe = msg.sender_id == (session?.user as any)?.id;
                            return (
                                <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                    <div className={cn(
                                        "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                                        isMe ? "bg-white border border-gray-200 text-gray-800 rounded-br-none shadow-sm" : "bg-blue-50 border border-blue-100 text-gray-800 rounded-bl-none shadow-sm"
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
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-white border-t border-[#E6E6E6]">
                    <form onSubmit={handleSendMessage} className="flex gap-2">
                        <Input
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            placeholder="Type a message..."
                            className="flex-1"
                        />
                        <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-[#b9d36c] hover:bg-[#a6bd61] text-white">
                            <Send className="h-4 w-4 text-white" />
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
