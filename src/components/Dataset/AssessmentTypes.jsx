import { capitalize, isEmpty, lowerCase } from "lodash";
import classNames from "classnames";
import React, { useEffect, useState } from "react";
import useFetch from "use-http";
import PropTypes from "prop-types";

import { ASSESSMENTS_ASSET_TYPES_ENDPOINT, ONTOLOGY_CLASS_ENDPOINT } from "constants/endpoints";
import { getURIFragment } from "utils";
import GroupedTypes from "./GroupedTypes";

const AssessmentTypes = ({ assessment, selectedTypes, setSelectedTypes }) => {
  const { abort, get, error, response } = useFetch();

  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);

  useEffect(() => {
    if (!assessment) return;

    const getTypes = async () => {
      const types = await get(
        `${ASSESSMENTS_ASSET_TYPES_ENDPOINT}?${new URLSearchParams({ assessment }).toString()}`
      );
      return response.ok ? types : [];
    };

    const generateOntologyGroups = async () => {
      setLoading(true);
      const types = await getTypes();

      const typesWithSuperClasses = await Promise.all(
        types.map(async (type) => {
          const { uri } = type;
          const classUri = { classUri: uri };
          const superClasses = await get(
            `${ONTOLOGY_CLASS_ENDPOINT}?${new URLSearchParams(classUri).toString()}`
          );

          if (response.ok) {
            const superClass = superClasses[uri]?.superClass[0] ?? "other";
            return { ...type, superClass };
          }
        })
      );

      setTypes(typesWithSuperClasses);
      setLoading(false);
    };

    generateOntologyGroups();

    return () => {
      abort();
      setTypes([]);
    };
  }, [assessment, response, abort, get]);

  if (loading) return <p>Fetching data types</p>;
  if (error)
    return (
      <p>
        An error occured while retrieving data types. Please try again. If problem persists contact
        admin
      </p>
    );
  if (isEmpty(types)) return <p>Dataset types not found</p>;

  const superClassGroups = [...new Set(types.map((type) => type.superClass))];

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

  const getTypesInGroup = (selectedGroup) => {
    return types.filter((type) => type.superClass === selectedGroup);
  };

  return (
    <div role="tree" aria-labelledby="assetTypesTree" className="flex flex-col grow min-h-0 overflow-y-auto gap-y-2">
      {superClassGroups.sort().map((ontologyGroup) => (
        <AssessmentGroup
          key={ontologyGroup}
          title={capitalize(lowerCase(getURIFragment(ontologyGroup)))}
          expand={selectedGroups.includes(ontologyGroup)}
          onToggle={() => updateSelectedGroup(ontologyGroup)}
          className="flex flex-col gap-y-2"
        >
          <GroupedTypes
            assessment={assessment}
            types={getTypesInGroup(ontologyGroup)}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
          />
        </AssessmentGroup>
      ))}
    </div>
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
  <div role="treeitem" aria-expanded={expand}  className={classNames(wrapperClassName)}>
    <button
      className={classNames("w-full text-left border-b border-whiteSmoke-700", {
        "cursor-default": !onToggle,
      })}
      type="button"
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
    {expand && children}
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
