import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Send, MessageCircle } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
}

interface ChatUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  profileImageUrl: string | null;
  role: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const userRole = user?.role || 'client';

  // Get list of users to chat with
  const { data: chatUsers = [] } = useQuery({
    queryKey: ['/api/chat/users'],
    enabled: !!user?.id,
  });

  // Find superadmins for direct contact
  const superAdmins = chatUsers.filter((chatUser: ChatUser) => chatUser.role === 'superadmin');

  // Get messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ['/api/chat/messages', selectedUser],
    enabled: !!selectedUser && !!user?.id,
  });

  // Expose function to open SuperAdmin chat
  useEffect(() => {
    const chatWidget = document.querySelector('[data-chat-widget]');
    if (chatWidget) {
      (chatWidget as any).openSuperAdminChat = () => {
        if (superAdmins.length > 0) {
          setSelectedUser(superAdmins[0].id);
          setIsOpen(true);
        }
      };
    }
  }, [superAdmins]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (data: { receiverId: string; content: string }) => {
      return apiRequest("POST", '/api/chat/messages', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      setNewMessage("");
    },
  });

  // Setup WebSocket connection
  useEffect(() => {
    if (!user?.id) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
      setSocket(ws);
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'message') {
        queryClient.invalidateQueries({ queryKey: ['/api/chat/messages'] });
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setSocket(null);
    };

    return () => {
      ws.close();
    };
  }, [user?.id, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedUser) return;

    sendMessageMutation.mutate({
      receiverId: selectedUser,
      content: newMessage.trim(),
    });
  };

  const getUserDisplayName = (chatUser: ChatUser) => {
    if (chatUser.firstName || chatUser.lastName) {
      return `${chatUser.firstName || ''} ${chatUser.lastName || ''}`.trim();
    }
    return chatUser.email;
  };

  const getUserInitials = (chatUser: ChatUser) => {
    if (chatUser.firstName || chatUser.lastName) {
      return `${chatUser.firstName?.[0] || ''}${chatUser.lastName?.[0] || ''}`.toUpperCase();
    }
    return chatUser.email[0]?.toUpperCase() || 'U';
  };

  const filteredChatUsers = Array.isArray(chatUsers) ? chatUsers.filter((chatUser: ChatUser) => {
    if (userRole === 'trainer') {
      // Trainers can chat with clients AND superadmins
      return chatUser.role === 'client' || chatUser.role === 'superadmin';
    } else if (userRole === 'client') {
      return chatUser.role === 'trainer';
    } else if (userRole === 'superadmin') {
      // SuperAdmins can chat with everyone
      return chatUser.role === 'trainer' || chatUser.role === 'client';
    }
    return false;
  }) : [];

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Users List */}
      <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
        <Card className="h-full rounded-none border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              {userRole === 'trainer' ? 'Clients & Support' : 
               userRole === 'superadmin' ? 'Users' : 'Trainers'}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="space-y-1">
              {filteredChatUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No users available to chat
                </div>
              ) : (
                filteredChatUsers.map((chatUser: ChatUser) => (
                  <Button
                    key={chatUser.id}
                    variant={selectedUser === chatUser.id ? "secondary" : "ghost"}
                    className="w-full justify-start p-3 h-auto"
                    onClick={() => setSelectedUser(chatUser.id)}
                  >
                    <Avatar className="w-8 h-8 mr-3">
                      <AvatarImage src={chatUser.profileImageUrl || undefined} />
                      <AvatarFallback>{getUserInitials(chatUser)}</AvatarFallback>
                    </Avatar>
                    <div className="text-left">
                      <div className="font-medium">{getUserDisplayName(chatUser)}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                        {chatUser.role}
                      </div>
                    </div>
                  </Button>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {Array.isArray(messages) && messages.length === 0 ? (
                  <div className="text-center text-gray-500 dark:text-gray-400">
                    No messages yet. Start the conversation!
                  </div>
                ) : (
                  Array.isArray(messages) && messages.map((message: Message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.senderId === user?.id ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.senderId === user?.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        <div className="text-sm">{message.content}</div>
                        <div
                          className={`text-xs mt-1 ${
                            message.senderId === user?.id
                              ? 'text-blue-100'
                              : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {format(new Date(message.createdAt), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  disabled={sendMessageMutation.isPending}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sendMessageMutation.isPending}
                  size="icon"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <MessageCircle className="w-12 h-12 mx-auto mb-4" />
              <p>Select a {userRole === 'trainer' ? 'client' : 'trainer'} to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}