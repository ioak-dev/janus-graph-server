const { create_sequence, checkval, nextval } = require("../sequence/service");

export const generateSchemaReference = async (space, referenceKey) => {
  const checkSequence = await checkval("schema_reference", referenceKey, space);
  if (!checkSequence) {
    await create_sequence("schema_reference", referenceKey, 1, space);
    return referenceKey;
  }
  const newKey = await nextval("schema_reference", referenceKey, space);
  return `${referenceKey}${newKey}`;
};
