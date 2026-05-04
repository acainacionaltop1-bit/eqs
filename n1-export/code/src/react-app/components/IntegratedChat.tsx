import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, EyeOff } from 'lucide-react';
import { Button } from '@/react-app/components/ui/button';
import { Input } from '@/react-app/components/ui/input';
import { useAuth } from '@/react-app/hooks/useAuth';
import { toast } from '@/react-app/components/ui/toast';
import ChatMessageModal from './ChatMessageModal';

interface ChatMessage {
  id: number;
  user_email: string;
  user_name: string;
  message: string;
  admin_reply?: string;
  admin_name?: string;
  status: string;
  replied_at?: string;
  created_at: string;
}

const IntegratedChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHidden, setIsHidden] = useState(() => {
    const saved = localStorage.getItem('chat-hidden');
    return saved === null ? true : saved !== 'false'; // Sempre oculto por padrão na primeira visita
  });
  const [position, setPosition] = useState(() => {
    const saved = localStorage.getItem('chat-position');
    // Posição padrão no canto inferior direito, acima da barra de navegação mobile
    return saved ? JSON.parse(saved) : { 
      x: window.innerWidth - 80, 
      y: window.innerHeight - 160 
    };
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      fetchMessages();
      setHasNewMessage(false);
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/support/chat/messages', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Erro ao buscar mensagens:', error);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || loading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/support/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          message: message.trim(),
          name: user?.google_user_data?.name || user?.name || user?.email || 'Usuário',
          email: user?.email || '',
        }),
      });

      if (response.ok) {
        setMessage('');
        fetchMessages();
        toast.success('Mensagem enviada!');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao enviar mensagem');
      }
    } catch (error) {
      toast.error('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleHideChat = () => {
    setIsHidden(true);
    setIsOpen(false);
    localStorage.setItem('chat-hidden', 'true');
  };

  const handleShowChat = () => {
    setIsHidden(false);
    localStorage.setItem('chat-hidden', 'false');
  };

  const handleMessageClick = (msg: ChatMessage) => {
    setSelectedMessage(msg);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedMessage(null);
    setIsModalOpen(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    const newPosition = {
      x: Math.max(0, Math.min(window.innerWidth - 320, e.clientX - dragStart.x)),
      y: Math.max(0, Math.min(window.innerHeight - (isOpen ? 400 : 80), e.clientY - dragStart.y))
    };
    
    setPosition(newPosition);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      localStorage.setItem('chat-position', JSON.stringify(position));
    }
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  // Botão para mostrar chat quando oculto
  if (isHidden) {
    return (
      <div 
        className="fixed z-50"
        style={{ 
          right: '20px', 
          bottom: '100px' // Acima da barra de navegação mobile
        }}
      >
        <button
          onClick={handleShowChat}
          className="w-12 h-12 rounded-full bg-gray-800 hover:bg-gray-700 transition-all duration-300 flex items-center justify-center shadow-lg border border-gray-600"
          title="Mostrar chat"
        >
          <MessageCircle className="w-5 h-5 text-gray-400" />
        </button>
      </div>
    );
  }

  // Componente do ícone flutuante
  if (!isOpen) {
    return (
      <div 
        className="fixed z-50 cursor-move"
        style={{ 
          right: '20px', 
          bottom: '100px' // Posição fixa acima da barra de navegação mobile
        }}
        onMouseDown={handleMouseDown}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 rounded-full shadow-2xl hover:scale-110 transition-all duration-300 relative overflow-hidden drag-handle"
          style={{
            background: 'transparent',
            border: 'none'
          }}
        >
          <img 
            src="https://mocha-cdn.com/0199c426-7399-7717-b858-1c3c102a38ca/20251008_113514_0000.png"
            alt="Suporte"
            className="w-full h-full object-cover rounded-full pointer-events-none"
          />
          {hasNewMessage && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse border-2 border-white"></div>
          )}
        </button>
      </div>
    );
  }

  return (
    <div 
      className={`fixed z-50 transition-all duration-300 ${
        isMinimized ? 'h-14' : 'h-96'
      } w-80 max-w-[calc(100vw-2rem)] ${isDragging ? 'cursor-move' : ''}`}
      style={{ 
        right: '20px', 
        bottom: isMinimized ? '100px' : '100px' // Posição fixa acima da barra de navegação mobile
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header do Chat */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-t-2xl p-4 flex items-center justify-between shadow-lg drag-handle cursor-move">
        <div className="flex items-center gap-2 pointer-events-none">
          <MessageCircle className="w-5 h-5 text-white" />
          <span className="text-white font-semibold text-sm">Suporte</span>
          <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
        </div>
        
        <div className="flex items-center gap-2 pointer-events-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
            title="Minimizar"
          >
            <Minimize2 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHideChat}
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
            title="Ocultar chat"
          >
            <EyeOff className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/20 w-8 h-8 p-0"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Corpo do Chat */}
      {!isMinimized && (
        <div className="bg-gray-900 border-x border-gray-700 h-80 flex flex-col">
          {/* Área de mensagens */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-900/95 backdrop-blur-sm">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Olá! Como posso ajudar você?</p>
                <p className="text-xs mt-1">Digite sua mensagem abaixo</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="space-y-2">
                  {/* Mensagem do usuário */}
                  <div className="flex justify-end">
                    <div 
                      onClick={() => handleMessageClick(msg)}
                      className="bg-green-500 text-white rounded-lg rounded-br-none px-3 py-2 max-w-[80%] text-sm cursor-pointer hover:bg-green-600 transition-colors duration-200"
                      title="Clique para ver detalhes"
                    >
                      {msg.message.length > 100 ? `${msg.message.substring(0, 100)}...` : msg.message}
                    </div>
                  </div>
                  
                  {/* Resposta do admin */}
                  {msg.admin_reply && (
                    <div className="flex justify-start">
                      <div 
                        onClick={() => handleMessageClick(msg)}
                        className="bg-gray-700 text-white rounded-lg rounded-bl-none px-3 py-2 max-w-[80%] text-sm cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                        title="Clique para ver detalhes"
                      >
                        <div className="text-xs text-gray-400 mb-1">
                          {msg.admin_name || 'Suporte'}
                        </div>
                        {msg.admin_reply.length > 100 ? `${msg.admin_reply.substring(0, 100)}...` : msg.admin_reply}
                      </div>
                    </div>
                  )}
                  
                  {/* Status */}
                  {!msg.admin_reply && (
                    <div className="flex justify-end">
                      <div className="text-xs text-gray-400">
                        {msg.status === 'pending' ? 'Aguardando resposta...' : 'Enviado'}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input de mensagem */}
          <div className="p-3 border-t border-gray-700 bg-gray-800">
            <div className="flex gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                disabled={loading}
                className="flex-1 text-sm h-10"
                maxLength={500}
              />
              <Button
                onClick={sendMessage}
                disabled={loading || !message.trim()}
                variant="nextfund"
                size="sm"
                className="w-10 h-10 p-0"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
            {message.length > 0 && (
              <div className="text-xs text-gray-500 mt-1 text-right">
                {message.length}/500
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer se minimizado */}
      {isMinimized && (
        <div className="bg-gray-800 rounded-b-2xl p-2 border-x border-b border-gray-700 drag-handle cursor-move">
          <div className="text-xs text-gray-400 text-center pointer-events-none">Chat minimizado</div>
        </div>
      )}

      {/* Modal de detalhes da mensagem */}
      <ChatMessageModal
        message={selectedMessage}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
};

export default IntegratedChat;
