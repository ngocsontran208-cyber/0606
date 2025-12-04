import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button, Input, Tooltip, Avatar } from "antd";
import {
  MessageOutlined,
  SendOutlined,
  CloseOutlined,
  BookOutlined,
  UserOutlined,
} from "@ant-design/icons";
import ReactMarkdown from "react-markdown";
import styled from "styled-components";

const CHATBOT_API_URL = "http://thuvien.cs2.ftu.edu.vn:5001/chat";
const FTU_BRAND_COLOR = "#A50034";
const USER_MESSAGE_COLOR = "#007AFF";
const TYPING_SPEED = 25;

const WidgetButton = styled(Button)`
  position: fixed;
  bottom: 26px;
  right: 26px;
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background-color: ${FTU_BRAND_COLOR};
  border-color: ${FTU_BRAND_COLOR};
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.25);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: 0.3s ease;

  .anticon {
    font-size: 22px;
  }

  &:hover {
    background-color: #8b002b;
    border-color: #8b002b;
    transform: scale(1.05);
  }
`;

const ChatWindow = styled.div`
  position: fixed;
  bottom: 95px;
  right: 25px;
  width: 90%;
  max-width: 380px;
  height: 65vh;
  max-height: 520px;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 10px 28px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform: ${(p) => (p.isOpen ? "translateY(0)" : "translateY(30px)")};
  opacity: ${(p) => (p.isOpen ? 1 : 0)};
  visibility: ${(p) => (p.isOpen ? "visible" : "hidden")};
  transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
`;

const Header = styled.div`
  background: #fff;
  color: ${FTU_BRAND_COLOR};
  padding: 14px 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  font-size: 16px;
  border-bottom: 1px solid #f1f1f1;

  .anticon {
    color: ${FTU_BRAND_COLOR};
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 12px 14px;
  overflow-y: auto;
  background-color: #fafafa;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 5px;
  }
  &::-webkit-scrollbar-thumb {
    background: #dcdcdc;
    border-radius: 3px;
  }
`;

const MessageRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  align-items: flex-end;
  justify-content: ${(p) => (p.sender === "user" ? "flex-end" : "flex-start")};
`;

const MessageBubble = styled.div`
  padding: 9px 14px;
  border-radius: 18px;
  max-width: 80%;
  font-size: 14.5px;
  line-height: 1.45;
  background: ${(p) =>
    p.sender === "user" ? USER_MESSAGE_COLOR : "#f1f1f1"};
  color: ${(p) => (p.sender === "user" ? "#fff" : "#222")};
  box-shadow: ${(p) =>
    p.sender === "user" ? "0 2px 4px rgba(0,0,0,0.15)" : "none"};

  border-bottom-right-radius: ${(p) =>
    p.sender === "user" ? "4px" : "18px"};
  border-bottom-left-radius: ${(p) =>
    p.sender === "user" ? "18px" : "4px"};

  p {
    margin: 3px 0;
  }

  ul, ol {
    margin: 4px 0;
    padding-left: 16px;
  }

  li {
    margin-bottom: 2px;
  }
`;

const StyledAvatar = styled(Avatar)`
  margin: ${(p) => (p.sender === "bot" ? "0 8px 0 0" : "0 0 0 8px")};
  background-color: ${(p) =>
    p.sender === "bot" ? FTU_BRAND_COLOR : "#e4e4e4"};
  color: ${(p) => (p.sender === "bot" ? "#fff" : "#444")};
`;

const InputArea = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 14px;
  border-top: 1px solid #f0f0f0;
  background-color: #fff;
`;

const StyledInput = styled(Input)`
  flex: 1;
  border: none;
  background-color: #f3f3f3;
  border-radius: 16px;
  padding: 8px 14px;
  font-size: 14.5px;

  &:focus, &:hover {
    background-color: #ededed;
    box-shadow: none;
  }
`;

const SendButton = styled(Button)`
  margin-left: 8px;
  background: transparent;
  border: none;
  color: ${FTU_BRAND_COLOR};
  font-size: 18px;

  &:hover {
    color: #7f0028;
  }
`;

const useChat = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "🎓 Xin chào! Tôi là **LIB - CSII Assistant** — trợ lý ảo của Thư viện Cơ sở II Trường Đại học Ngoại thương.\n\nBạn muốn tra cứu thông tin gì? *(ví dụ: sách Kinh tế quốc tế)*",
      isFullText: true,
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [fullResponse, setFullResponse] = useState(null);

  const handleSend = useCallback(async () => {
    if (!inputValue.trim() || loading) return;

    const userMessage = { sender: "user", text: inputValue, isFullText: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    const tempBotMessage = { sender: "bot", text: "", isFullText: false };
    setMessages((prev) => [...prev, tempBotMessage]);

    try {
      const res = await fetch(CHATBOT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.text }),
      });
      if (!res.ok) throw new Error("Lỗi máy chủ");
      const data = await res.json();
      setFullResponse(data.reply);
    } catch (err) {
      console.error(err);
      setFullResponse(
        "Xin lỗi, hệ thống LIB - CSII Assistant đang bận. Vui lòng thử lại sau! 😢"
      );
    }
  }, [inputValue, loading]);

  useEffect(() => {
    if (!fullResponse) return;
    const text = fullResponse;
    let i = 0;

    const updateText = (t, done = false) =>
      setMessages((prev) => {
        const newMsgs = [...prev];
        const last = newMsgs[newMsgs.length - 1];
        if (last.sender === "bot" && !last.isFullText) {
          last.text = t;
          last.isFullText = done;
        }
        return newMsgs;
      });

    const interval = setInterval(() => {
      if (i < text.length) {
        updateText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        updateText(text, true);
        setLoading(false);
        setFullResponse(null);
      }
    }, TYPING_SPEED);

    return () => clearInterval(interval);
  }, [fullResponse]);

  return { messages, inputValue, setInputValue, loading, handleSend };
};

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, inputValue, setInputValue, loading, handleSend } = useChat();
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, loading]);

  useEffect(() => {
    if (isOpen && inputRef.current) inputRef.current.focus();
  }, [isOpen]);

  return (
    <>
      <ChatWindow isOpen={isOpen}>
        <Header>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <BookOutlined /> LIB - CSII Assistant
          </div>
          <Button type="text" icon={<CloseOutlined />} onClick={() => setIsOpen(false)} />
        </Header>

        <MessagesContainer>
          {messages.map((msg, i) => (
            <MessageRow key={i} sender={msg.sender}>
              {msg.sender === "bot" && (
                <StyledAvatar sender="bot" icon={<BookOutlined />} />
              )}
              <MessageBubble sender={msg.sender}>
                {msg.isFullText ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
                {msg.sender === "bot" && !msg.isFullText && (
                  <span
                    style={{
                      borderRight: "1px solid #222",
                      paddingLeft: 2,
                      animation: "blink 1s step-end infinite",
                    }}
                  >
                    &nbsp;
                  </span>
                )}
              </MessageBubble>
              {msg.sender === "user" && (
                <StyledAvatar sender="user" icon={<UserOutlined />} />
              )}
            </MessageRow>
          ))}
          <div ref={messagesEndRef} />
        </MessagesContainer>

        <InputArea>
          <StyledInput
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={!loading ? handleSend : undefined}
            placeholder="Nhập câu hỏi của bạn..."
            disabled={loading}
          />
          <SendButton
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={loading || !inputValue.trim()}
          />
        </InputArea>
      </ChatWindow>

      <Tooltip title={isOpen ? "Đóng chat" : "LIB - CSII Assistant"}>
        <WidgetButton
          icon={isOpen ? <CloseOutlined /> : <MessageOutlined />}
          onClick={() => setIsOpen((p) => !p)}
        />
      </Tooltip>

      <style>
        {`
          @keyframes blink {
            from, to { opacity: 1; }
            50% { opacity: 0; }
          }
        `}
      </style>
    </>
  );
};

export default ChatbotWidget;