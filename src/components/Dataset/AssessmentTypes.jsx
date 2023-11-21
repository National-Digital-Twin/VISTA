import { capitalize, isEmpty, lowerCase } from "lodash";
import { useEffect } from "react";
import classNames from "classnames";
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import { useQueries, useQuery } from "react-query";

import { Modal } from "lib";
import { getURIFragment } from "utils";

import GroupedTypes from "./GroupedTypes";
import { fetchAssetTypes, fetchTypeSuperclass } from "api/combined";
import { TeliTextField } from "@telicent-io/ds";

const AssessmentTypes = ({ assessment }) => {
  const [isGeneratingData, setIsGeneratingData] = useState(false);
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [fetchTypes, setFetchTypes] = useState(true); 

  const {
    isLoading: isTypesLoading,
    isError,
    error,
    data: types,
  } = useQuery(["asset-types", assessment], () => fetchAssetTypes(assessment), {
    enabled: fetchTypes,
  });

  useEffect(() => {
    if (fetchTypes) {
      setFetchTypes(false);
    }
  }, [fetchTypes]);

  const typeSuperClassQueries = useQueries(
    types?.map((type) => {
      const typeUri = type.uri;
      return {
        queryKey: ["type-super-class", typeUri],
        queryFn: async () => {
          const superClass = await fetchTypeSuperclass(typeUri);
          return {
            ...type,
            superClass: superClass[typeUri]?.superClass[0] ?? "other",
          };
        },
      };
    }) ?? [],
    {
      enabled: !!types,
    }
  );

  const isLoading = isTypesLoading || typeSuperClassQueries.some((query) => query.isLoading);

  const typeWithSuperClass = typeSuperClassQueries.map((query) => query.data);

  const superClassGroups = useMemo(() => {
    const uniqueClasses = [...new Set(typeWithSuperClass.map((type) => type?.superClass))];
    return uniqueClasses;
  }, [typeWithSuperClass]);

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
    return typeWithSuperClass.filter((type) => type.superClass === selectedGroup);
  };

  const getFilteredTypesInGroup = (selectedGroup, query) => {
    return getTypesInGroup(selectedGroup).filter((type) =>  
      type.uri.toLowerCase().includes(query.toLowerCase())  
    );
  };

  if (isLoading) return <p>Fetching data types</p>;
  if (isError) return <p>{error.message}</p>;
  if (isEmpty(types)) return <p>Dataset types not found</p>;

  const isFiltered = searchQuery.length > 0;

  const formattedQuery = searchQuery.toLowerCase().replace(' ', '');

  const filteredClassGroups = isFiltered ?
  superClassGroups.filter((group) =>
    getFilteredTypesInGroup(group, formattedQuery).length >= 1 || group.toLowerCase().includes(formattedQuery)
  ) : superClassGroups;

  const getTypesInGroupWithFilter = (ontologyGroup) => {
    const typesInGroup = getTypesInGroup(ontologyGroup);
    if (ontologyGroup.toLowerCase().includes(formattedQuery)) {
      return typesInGroup;
    }
    return typesInGroup.filter((type) => type.uri.toLowerCase().includes(formattedQuery));
  };

  return (
    <>
      <TeliTextField 
        label="Search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full"
        fullWidth
      />
      <div
        role="tree"
        aria-labelledby="assetTypesTree"
        className="flex flex-col grow min-h-0 overflow-y-auto gap-y-2 mt-2">
        {filteredClassGroups.sort().map((ontologyGroup) => {
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
                types={getTypesInGroupWithFilter(ontologyGroup)}
                selectedTypes={selectedTypes}
                setSelectedTypes={setSelectedTypes}
                setIsGeneratingData={setIsGeneratingData}
              />
            </AssessmentGroup>
          );
        })}
        {isFiltered && filteredClassGroups.length === 0 && (
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
