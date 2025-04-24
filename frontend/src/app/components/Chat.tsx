"use client";
import React from "react";

type Message = {
  role: "assistant" | "user";
  content: string;
};

const MessageBubble = ({ message }: { message: Message }) => {
  const isAssistant = message.role === "assistant";
  return (
    <div
      className={`
        max-w-md p-3 rounded-lg mb-2 
        ${
          isAssistant
            ? "bg-blue-100 text-left"
            : "bg-green-100 ml-auto text-right"
        }
      `}
    >
      {message.content}
    </div>
  );
};

function Chat() {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content:
        "Hello! I am your assistant. How can I help you today? Please upload a PDF file to get started.",
    },
    {
      role: "user",
      content: "Hi! Can I get help with a document I just uploaded?",
    },
  ]);
  const [message, setMessage] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [response, setResponse] = React.useState("");
  const [error, setError] = React.useState("");

  return (
    <div className="flex flex-col justify-between bg-red-100 text-black h-screen p-4">
      <div className="flex flex-col gap-2 overflow-y-auto">
        {messages.map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
      </div>
      <input
        type="text"
        value={message}
        onKeyDownCapture={(e) => {
          if (e.key === "Enter" && message.trim()) {
            setMessages((prev) => [
              ...prev,
              { role: "user", content: message },
            ]);
            setMessage("");
            setLoading(true);
            fetch(`http://localhost:5000/chat?message=${message}`, {
              headers: {
                "Content-Type": "application/json",
              },
            })
              .then((res) => res.json())
              .then((data) => {
                setMessages((prev) => [
                  ...prev,
                  { role: "assistant", content: data.geminiAnswer },
                ]);
                setLoading(false);
              })
              .catch((err) => {
                setError("Error fetching response");
                setLoading(false);
              });
          }
        }}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Type your message here..."
        className="border border-gray-300 rounded-lg p-2"
      />
    </div>
  );
}

export default Chat;
