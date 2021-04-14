import { isEqual } from "lodash";
const { activityCollection, activitySchema } = require("./model");
const { getCollection } = require("../../lib/dbutils");

export const addCreateLog = async (
  space,
  user,
  domain,
  parentReference,
  reference
) => {
  const model = getCollection(space, activityCollection, activitySchema);
  await model.insertMany({
    domain,
    operation: "ADD",
    parentReference,
    reference,
    userId: user.userId,
  });
  return;
};

export const addEditLog = async (
  space,
  user,
  domain,
  newVal,
  oldVal,
  parentReference,
  reference = null
) => {
  const diff = findDiff(oldVal, newVal);
  if (diff.length > 0) {
    const model = getCollection(space, activityCollection, activitySchema);
    await model.insertMany({
      domain,
      operation: "EDIT",
      parentReference,
      fields: diff,
      reference: reference ? reference : newVal.id,
      userId: user.userId,
    });
  }
  return;
};

export const addDeleteLog = async (
  space,
  user,
  domain,
  parentReference,
  reference
) => {
  const model = getCollection(space, activityCollection, activitySchema);
  await model.insertMany({
    domain,
    parentReference,
    reference,
    operation: "DELETE",
    userId: user.userId,
  });
};

const findDiff = (obj1, obj2) => {
  return Object.keys(obj1).filter(
    (k) =>
      !["id", "_id", "createdAt", "updatedAt", "__v"].includes(k) &&
      !isEqual(obj1[k], obj2[k])
  );
};
