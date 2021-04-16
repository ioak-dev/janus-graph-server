const {
  create_sequence,
  checkval,
  nextval,
} = require("../../sequence/service");

export const generateTableReference = async (space, referenceKey) => {
  const checkSequence = await checkval("table_reference", referenceKey, space);
  if (!checkSequence) {
    await create_sequence("table_reference", referenceKey, 1, space);
    return referenceKey;
  }
  const newKey = await nextval("table_reference", referenceKey, space);
  return `${referenceKey}${newKey}`;
};
