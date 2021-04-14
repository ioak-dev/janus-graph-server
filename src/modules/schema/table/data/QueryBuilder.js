export const buildQuickFilterCondition = (filterInstance, columnList) => {
  const columnMap = {};
  columnList.forEach((item) => {
    columnMap[item.id] = item;
  });
  const condition = [];
  Object.keys(filterInstance).forEach((columnId) => {
    if (
      filterInstance[columnId] &&
      (!Array.isArray(filterInstance[columnId]) ||
        filterInstance[columnId].length > 0)
    ) {
      switch (columnMap[columnId].datatype) {
        case "list":
        case "relation":
          condition.push({
            [`row.${columnId}`]: { $in: filterInstance[columnId] },
          });
          break;
        case "text":
        case "computed":
          condition.push({
            [`row.${columnId}`]: {
              $regex: filterInstance[columnId],
              $options: "i",
            },
          });
          break;
        default:
          condition.push({
            [`row.${columnId}`]: filterInstance[columnId],
          });
      }
    }
  });
  if (condition.length === 0) {
    return {};
  }
  return {
    $and: condition,
  };
};

export const buildFilterCondition = (
  filterId,
  anonymousFilter,
  columnList,
  filterList
) => {
  const columnMap = {};
  columnList.forEach((item) => {
    columnMap[item.id] = item;
  });
  const filterMap = {};
  filterList.forEach((item) => {
    filterMap[item.id] = item;
  });

  let filter = anonymousFilter;

  if (!filter) {
    filter = filterMap[filterId];
  }

  if (!filter) {
    return {};
  }

  const condition = _buildFilterCondition(filter, columnMap, filterMap);
  return condition;
};

export const _buildFilterCondition = (filterInstance, columnMap, filterMap) => {
  const condition = [];
  filterInstance.search.condition.forEach((filter) => {
    if (filter.extended) {
      condition.push(
        _buildFilterCondition(filterMap[filter.id], columnMap, filterMap)
      );
    } else {
      switch (columnMap[filter.id].datatype) {
        case "list":
        case "relation":
          condition.push({
            [`row.${filter.id}`]: { $in: filter.value },
          });
          break;
        case "text":
        case "computed":
          condition.push({
            [`row.${filter.id}`]: {
              $regex: new RegExp("^" + filter.value.toLowerCase(), "i"),
            },
          });
          break;
        default:
          condition.push({
            [`row.${filter.id}`]: filter.value,
          });
      }
    }
  });
  return {
    [filterInstance.search.operator === "and" ? "$and" : "$or"]: condition,
  };
};

export const buildSortCondition = (sortList) => {
  const condition = {};
  sortList.forEach(
    (sort) => (condition[`row.${sort.id}`] = sort.order === "desc" ? -1 : 1)
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
