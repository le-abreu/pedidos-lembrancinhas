import Link from "next/link";

type TabItem = {
  key: string;
  label: string;
};

type PageTabsProps = {
  pathname: string;
  currentTab: string;
  tabs: TabItem[];
  searchParams?: Record<string, string | undefined>;
};

function buildHref(pathname: string, tabKey: string, searchParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams();

  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  params.set("tab", tabKey);

  return `${pathname}?${params.toString()}`;
}

export function PageTabs({ pathname, currentTab, tabs, searchParams }: PageTabsProps) {
  return (
    <nav className="tabs-nav">
      {tabs.map((tab) => (
        <Link
          key={tab.key}
          href={buildHref(pathname, tab.key, searchParams)}
          className={currentTab === tab.key ? "tab-link active" : "tab-link"}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
