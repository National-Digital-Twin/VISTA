import React from "react";
import { Tab, TabList, TabPanel, Tabs } from "react-tabs";
import styles from "./style.module.css";

interface TabsContainerProps {
  tabs: {
    label: string;
    content: React.ReactNode;
  }[];
}

export default function TabsContainer({ tabs }: TabsContainerProps) {
  return (
    <Tabs className={styles.tabsContainer}>
      <TabList className={styles.tabList}>
        {tabs.map((tab, i) => (
          <Tab
            key={i}
            className={styles.tabButton}
            selectedClassName={styles.active}
          >
            {tab.label}
          </Tab>
        ))}
      </TabList>
      {tabs.map((tab, i) => (
        <TabPanel key={i} className={styles.tabContent}>
          {tab.content}
        </TabPanel>
      ))}
    </Tabs>
  );
}
