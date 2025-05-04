"use client";

import React from "react";
import clsx from "clsx";

const tabs = ["Project", "About me", "Contact"];

type TabMenuProps = {
  onTabClick: (tab: string) => void;
};

export default function TabMenu({ onTabClick }: TabMenuProps) {
  const [activeTab, setActiveTab] = React.useState("About me");

  const handleClick = (tab: string) => {
    setActiveTab(tab);
    onTabClick(tab);
  };

  return (
    <div className="inline-flex items-center bg-[#1e1e1e] w-fit rounded-full px-2 py-1 space-x-2 shadow-inner shadow-black">
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => handleClick(tab)}
          className={clsx(
            "px-4 py-2 rounded-full text-sm font-medium transition-colors duration-200",
            activeTab === tab
              ? "text-[#006666]"
              : "text-[#737373] hover:text-white"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
