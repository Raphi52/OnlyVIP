"use client";

interface FanContextPanelProps {
  conversationId: string;
}

export default function FanContextPanel({ conversationId }: FanContextPanelProps) {
  return (
    <div className="p-4 text-gray-500 text-sm">
      <p>Fan Context - {conversationId}</p>
    </div>
  );
}
