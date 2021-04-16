const { sequenceCollection, sequenceSchema } = require("./model");
const { getGlobalCollection, getCollection } = require("../../lib/dbutils");

export const create_sequence = async (
  name: String,
  context: String | null | undefined,
  factor: Number,
  space?: String
) => {
  let model;
  if (space) {
    model = getCollection(space, sequenceCollection, sequenceSchema);
  } else {
    model = getGlobalCollection(sequenceCollection, sequenceSchema);
  }

  const existing_sequence = await model.findOne({ name, context });

  if (existing_sequence) {
    return existing_sequence;
  }

  return await model.findOneAndUpdate(
    { name, context },
    { name, context, factor, nextval: 1 },
    { upsert: true, new: true }
  );
};

export const nextval = async (
  name: String,
  context?: String,
  space?: String
) => {
  let model;
  if (space) {
    model = getCollection(space, sequenceCollection, sequenceSchema);
  } else {
    model = getGlobalCollection(sequenceCollection, sequenceSchema);
  }
  let sequence = await model.findOne({ name, context });
  if (!sequence) {
    await create_sequence(name, context, 1, space);
    sequence = await model.findOne({ name, context });
  }
  await model.findOneAndUpdate(
    { name, context },
    { nextval: sequence.nextval + sequence.factor },
    { upsert: true, new: true }
  );
  return sequence.nextval;
};

export const checkval = async (
  name: String,
  context?: String,
  space?: String
) => {
  let model;
  if (space) {
    model = getCollection(space, sequenceCollection, sequenceSchema);
  } else {
    model = getGlobalCollection(sequenceCollection, sequenceSchema);
  }
  let sequence = await model.findOne({ name, context });
  if (!sequence) {
    return null;
  }
  return sequence.nextval;
};
