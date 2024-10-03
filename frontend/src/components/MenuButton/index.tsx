import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconProp } from "@fortawesome/fontawesome-svg-core";
import SearchConditional from "@/components/SearchConditional";

interface MenuButtonProps {
  onClick: () => void;
  selected: boolean;
  label: string;
  icon?: IconProp;
  searchQuery?: string;
}

export function MenuButton({
  onClick,
  selected,
  label,
  icon,
  searchQuery,
}: MenuButtonProps) {
  return (
    <SearchConditional searchQuery={searchQuery} terms={[label]}>
      <button
        className="menu-item"
        data-selected={selected}
        role="menuitem"
        onClick={onClick}
      >
        {icon && <FontAwesomeIcon icon={icon} className="mr-2" />}
        {label}
      </button>
    </SearchConditional>
  );
}
