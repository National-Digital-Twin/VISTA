import React from "react";
import styles from "./styles.module.css";
import { VulnerablePeopleItem } from "@/api/paralog-python";

interface SummaryInfoProps {
  item: VulnerablePeopleItem;
}

const SummaryInfo: React.FC<SummaryInfoProps> = ({ item }) => {
  return (
    <div className={styles.summaryInfo}>
      <h2>Vulnerable Person Details</h2>
      <div className={styles.idCard}>
        <div className={styles.column}>
          <div className={styles.idCardItem}>
            <strong>Name:</strong> {item.mockFirstName} {item.mockLastName}
          </div>
          <div className={styles.idCardItem}>
            <strong>Year of Birth:</strong> {item.mockYearOfBirth}
          </div>
          <div className={styles.idCardItem}>
            <strong>UPRN:</strong> {item.uprn}
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.idCardItem}>
            <strong>Primary Support Reason:</strong>{" "}
            {item.mockAscPrimarySupportReason}
          </div>
          <div className={styles.idCardItem}>
            <strong>Disability:</strong> {item.mockDisability}
          </div>
          <div className={styles.idCardItem}>
            <strong>Coordinates:</strong> {item.latitude}, {item.longitude}
          </div>
        </div>
        <div className={styles.column}>
          <div className={styles.idCardItem}>
            <strong>Alert Category:</strong> {item.mockAlertCategory}
          </div>
          <div className={styles.idCardItem}>
            <strong>Alert Detail:</strong> {item.mockAlertDetail}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SummaryInfo;
