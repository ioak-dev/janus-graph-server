export const buildFilterCondition = (filterList) => {
  const condition = [];
  filterList.forEach((filter) =>
    condition.push({
      [`row.${filter.columnId}`]: filter.value,
    })
  );
  return condition;
};

export const buildSortCondition = (sortList) => {
  const condition = {};
  sortList.forEach(
    (sort) =>
      (condition[`row.${sort.columnId}`] = sort.order === "desc" ? -1 : 1)
  );
  return condition;
};

export const setVariables = (schemaTableColumnList) => {
  const variablesMap = {};
  schemaTableColumnList.forEach((column) => {
    if (column.datatype === "relation") {
      variablesMap[column._id] = {
        $toObjectId: `$row.${column._id}`,
      };
    }
  });
  console.log(variablesMap);
  if (Object.keys(variablesMap).length === 0) {
    return null;
  }

  return {
    $set: {
      ...variablesMap,
    },
  };
};

export const lookupConditions = (
  schemaTableColumnList,
  schemaTableDataCollection
) => {
  const lookupConditionsList = [];
  schemaTableColumnList.forEach((column) => {
    if (column.datatype === "relation") {
      lookupConditionsList.push({
        $lookup: {
          from: schemaTableDataCollection,
          localField: `${column._id}`,
          foreignField: "_id",
          as: `relation.${column._id}`,
        },
      });
    }
  });
  // console.log(lookupConditionsList);
  // {
  //   $lookup: {
  //     from: schemaTableDataCollection,
  //     localField: "foreign_key",
  //     foreignField: "_id",
  //     as: "reference.u",
  //   },
  // },
  return lookupConditionsList;
};
