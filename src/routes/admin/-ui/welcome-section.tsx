"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/tanstack-react-start";

type Props = {
  text: string;
  greeting?: string;
};

const quotes_list = [
  "🤝 Salutations",
  "👀 Good to see you",
  "👋 Hey there",
  "🔙 Welcome back",
  "🤗 Nice to have you here",
  "😃 Glad you're here",
  "🥳 Happy to see you",
  "🎉 It's great to have you",
  "🌞 Hope you're having a great day",
  "🙏 Thanks for joining us",
  "💼 Wishing you a productive day",
  "🤩 Always a pleasure",
  "🌟 You're awesome",
  "🚀 Let's make today great",
  "🛠️ Ready to get started?",
  "🏆 Let's achieve great things together",
];

export const WelcomeSection = ({ text, greeting }: Props) => {
  const [quote, setQuote] = useState<string | null>(null);

  const { user, isLoaded } = useUser();

  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * quotes_list.length);
    setQuote(quotes_list[randomIndex]);
  }, [isLoaded]);

  if (!isLoaded) return null;

  return (
    <div className="w-full max-w-7xl border-b p-4">
      <div className="mb-4">
        <h1 className="mb-2 text-2xl font-bold md:text-4xl font-heading">
          {greeting ?? "Welcome"}, {`${user?.firstName} ${user?.lastName}`}!
        </h1>
        <h2 className="text-xl">
          {quote ?? "👍 Let's get started!"}
        </h2>
      </div>
      <p className="mb-6 text-xs text-muted-foreground md:text-sm">{text}</p>
    </div>
  );
};
