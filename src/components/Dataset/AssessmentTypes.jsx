import React, { useState } from "react";
import { capitalize, lowerCase } from "lodash";
import classNames from "classnames";
import PropTypes from "prop-types";
import { TeliTextField } from "@telicent-io/ds";

import { Modal } from "lib";
import { getURIFragment } from "utils";
import { useGroupedAssets } from "hooks";

import GroupedTypes from "./GroupedTypes";

const AssessmentTypes = ({ assessment }) => {
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { isLoading, isError, error, hasTypes, getSuperclassGroups, getSuperclassChildren } =
    useGroupedAssets({
      assessment,
      searchFilter: searchQuery,
    });

  const updateSelectedGroup = (selectedGroup) => {
    const index = selectedGroups.findIndex((ontologyGroup) => ontologyGroup === selectedGroup);
    if (index === -1) {
      setSelectedGroups([...selectedGroups, selectedGroup]);
      return;
    }
    const filteredGroups = selectedGroups.filter(
      (ontologyGroup) => ontologyGroup !== selectedGroup
    );
    setSelectedGroups(filteredGroups);
  };

  if (isLoading) return <p>Fetching data types</p>;
  if (isError) return <p>{error.message}</p>;
  if (!hasTypes) return <p>Dataset types not found</p>;

  const sortedSuperclassGroups = getSuperclassGroups().sort();

  return (
    <>
      <TeliTextField
        label="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        fullWidth
      />
      <div
        role="tree"
        aria-labelledby="assetTypesTree"
        className="flex flex-col min-h-0 mt-2 overflow-y-auto grow gap-y-2"
      >
        {sortedSuperclassGroups.map((group) => {
          const expand = selectedGroups.includes(group);
          return (
            <AssessmentGroup
              key={group}
              title={capitalize(lowerCase(getURIFragment(group)))}
              expand={expand}
              onToggle={() => updateSelectedGroup(group)}
              className="flex flex-col gap-y-2"
            >
              <GroupedTypes
                expand={expand}
                assessment={assessment}
                types={getSuperclassChildren(group)}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                setIsGeneratingData={setIsGeneratingData}
              />
            </AssessmentGroup>
          );
        })}
        {searchQuery && sortedSuperclassGroups.length === 0 && (
          <p className="text-center">No results found</p>
        )}
      </div>
    </>
  );
};
export default AssessmentTypes;

AssessmentTypes.defaultProps = {
  assessment: undefined,
  selectedTypes: [],
  setSelectedTypes: () => {},
};

AssessmentTypes.propTypes = {
  assessment: PropTypes.string,
  selectedTypes: PropTypes.arrayOf(PropTypes.string),
  setSelectedTypes: PropTypes.func,
};

const AssessmentGroup = ({ expand, title, onToggle, className: wrapperClassName, children }) => (
  <div
    role="treeitem"
    aria-expanded={expand}
    aria-selected={expand}
    className={classNames(wrapperClassName)}
  >
    <button
      className={classNames("w-full text-left border-b border-whiteSmoke-700", {
        "cursor-default": !onToggle,
      })}
      onClick={onToggle}
    >
      {title}
      {onToggle && (
        <i
          className={classNames("float-right", {
            "ri-arrow-up-s-fill !text-xl": expand,
            "ri-arrow-down-s-fill !text-xl": !expand,
          })}
        />
      )}
    </button>
    {children}
  </div>
);

AssessmentGroup.defaultProps = {
  show: false,
  classNames: undefined,
};

AssessmentGroup.propTypes = {
  show: PropTypes.bool,
  title: PropTypes.string.isRequired,
  onToggle: PropTypes.func.isRequired,
  className: PropTypes.string,
  children: PropTypes.element.isRequired,
};
