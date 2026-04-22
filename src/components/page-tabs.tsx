import Link from "next/link";

type TabItem = {
  key: string;
  label: string;
};

type PageTabsProps = {
  pathname: string;
  currentTab: string;
  tabs: TabItem[];
};

export function PageTabs({ pathname, currentTab, tabs }: PageTabsProps) {
  return (
    <nav className="tabs-nav">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={`${pathname}?tab=${tab.key}`}
          className={currentTab === tab.key ? "tab-link active" : "tab-link"}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
