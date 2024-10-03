import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import classNames from "classnames";
import styles from "./style.module.css";

interface ToolbarButtonProps {
  icon: IconProp;
  title: string;
  onClick: () => void;
  active?: boolean;
  hideTitle?: boolean;
}

export default function ToolbarButton({
  icon,
  title,
  onClick,
  active = false,
  hideTitle = false,
}: ToolbarButtonProps) {
  const buttonClasses = classNames(styles.toolbarButton, "btn");

  return (
    <button
      type="button"
      className={buttonClasses}
      onClick={onClick}
      title={title}
      data-active={active}
    >
      <FontAwesomeIcon icon={icon} />
      <span className={hideTitle ? "sr-only" : styles.toolbarButtonLabel}>
        {title}
      </span>
    </button>
  );
}
