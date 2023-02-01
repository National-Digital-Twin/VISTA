import { capitalize, isEmpty, lowerCase } from "lodash";
import classNames from "classnames";
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";

import config from "config/app-config";
import { ASSESSMENTS_ASSET_TYPES_ENDPOINT, ONTOLOGY_CLASS_ENDPOINT } from "constants/endpoints";
import { useJSFetch } from "hooks";
import { Modal } from "lib";
import { getURIFragment } from "utils";

import GroupedTypes from "./GroupedTypes";

const AssessmentTypes = ({ assessment }) => {
  const { error, get } = useJSFetch();

  
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [loading, setLoading] = useState(false);
  const [types, setTypes] = useState([]);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  
  const superClassGroups = useMemo(() => [...new Set(types.map((type) => type.superClass))], [types]);

  useEffect(() => {
    if (!assessment) return;
    const controller = new AbortController();
    const signal = controller.signal;

    const getTypes = async () => {
      const types = await get(
        `${config.api.url}/${ASSESSMENTS_ASSET_TYPES_ENDPOINT}?${new URLSearchParams({
          assessment,
        }).toString()}`,
        { signal }
      );
      return types || [];
    };

    const generateOntologyGroups = async () => {
      setLoading(true);
      const types = await getTypes();
      if (signal.aborted) return;

      const typesWithSuperClasses = await Promise.all(
        types.map(async (type) => {
          const { uri } = type;
          const classUri = { classUri: uri };
          const superClasses = await get(
            `${config.api.url}/${ONTOLOGY_CLASS_ENDPOINT}?${new URLSearchParams(
              classUri
            ).toString()}`
          );

          let superClass = "other"
          if (superClasses) superClass = superClasses[uri]?.superClass[0] ?? "other"

          return { ...type, superClass };
        })
      );

      setTypes(typesWithSuperClasses);
      setLoading(false);
    };

    generateOntologyGroups();

    return () => {
      controller.abort();
    };
  }, [assessment, get]);

  if (loading) return <p>Fetching data types</p>;
  if (error)
    return (
      <p>
        An error occured while retrieving data types. Please try again. If problem persists contact
        admin
      </p>
    );
  if (isEmpty(types)) return <p>Dataset types not found</p>;

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
    <>
      <div
        role="tree"
        aria-labelledby="assetTypesTree"
        className="flex flex-col grow min-h-0 overflow-y-auto gap-y-2"
      >
        {superClassGroups.sort().map((ontologyGroup) => {
          const expand = selectedGroups.includes(ontologyGroup);
          return (
            <AssessmentGroup
              key={ontologyGroup}
              title={capitalize(lowerCase(getURIFragment(ontologyGroup)))}
              expand={expand}
              onToggle={() => updateSelectedGroup(ontologyGroup)}
              className="flex flex-col gap-y-2"
            >
              <GroupedTypes
                expand={expand}
                assessment={assessment}
                types={getTypesInGroup(ontologyGroup)}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                setIsGeneratingData={setIsGeneratingData}
              />
            </AssessmentGroup>
          );
        })}
      </div>
      <Modal appElement="root" isOpen={isGeneratingData} className="py-2 px-6 rounded-lg">
        <p>Loading data</p>
      </Modal>
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
  <div role="treeitem" aria-expanded={expand} aria-selected={expand} className={classNames(wrapperClassName)}>
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
